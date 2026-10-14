import { S, save, uid, addErrors, addSession, famName } from "../store.js";
import { claude, getConfig, transcribe, parseJSON } from "../api.js";
import { coachSystem, COACH_MODES } from "../prompts.js";
import { esc, icons, toast, relDate, errorBox } from "../ui.js";
import { speak, stopSpeaking, dictate, canRecognize, Recorder, canRecord } from "../audio.js";

const KICKOFF = "[Début de la séance. Lance la conversation avec une première phrase courte et une question. Pas de corrections.]";
const VOICE_KEY = "mf.coachVoice";

export async function render(root, params) {
  const cfg = await getConfig();
  if (params.id && S.chats.find((c) => c.id === params.id)) return chat(root, S.chats.find((c) => c.id === params.id), cfg);
  if (params.mode && COACH_MODES[params.mode]) {
    const c = { id: uid(), mode: params.mode, date: new Date().toISOString(), messages: [] };
    S.chats.unshift(c); S.chats = S.chats.slice(0, 30); save();
    history.replaceState(null, "", `#/coach?id=${c.id}`);
    return chat(root, c, cfg, true);
  }
  picker(root);
}

function picker(root) {
  const recent = S.chats.filter((c) => c.messages.some((m) => m.role === "user" && !m.hidden)).slice(0, 6);
  root.innerHTML = `
    <section class="hero" style="padding-top:8px">
      <h1 class="h2" style="font-size:26px">Une vraie conversation, avec tes fautes notées à part.</h1>
      <p class="small">Le coach ne coupe jamais la discussion. Les corrections s'affichent sous tes messages et vont dans ton carnet.</p>
    </section>
    <div class="stack mode-grid" style="margin-top:20px">
      ${Object.entries(COACH_MODES).map(([id, m]) => `
        <a class="card card-link mode-card" href="#/coach?mode=${id}">
          <div class="grow"><h3>${esc(m.name)}</h3><p class="small muted" style="margin-top:2px">${esc(m.intro)}</p></div>${icons.chev}
        </a>`).join("")}
    </div>
    ${recent.length ? `<section class="section"><p class="label" style="margin-bottom:6px">Reprendre</p><div class="card">
      ${recent.map((c) => {
        const last = [...c.messages].reverse().find((m) => m.role === "user" && !m.hidden);
        return `<a class="list-item" href="#/coach?id=${c.id}"><div class="grow"><b style="font-weight:500">${esc(COACH_MODES[c.mode]?.name || "Discussion")}</b>
        <p class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${relDate(c.date)} · ${esc(last?.content || "")}</p></div>${icons.chev}</a>`;
      }).join("")}</div></section>` : ""}`;
}

async function chat(root, c, cfg, fresh) {
  const view = document.getElementById("view");
  view.classList.add("has-composer");
  let voiceOut = localStorage.getItem(VOICE_KEY) === "1";
  let busy = false, usedVoice = false, abort = null;
  const t0 = Date.now(), startCount = c.messages.filter((m) => m.role === "user" && !m.hidden).length;
  const mode = COACH_MODES[c.mode] || COACH_MODES.libre;
  document.getElementById("pageTitle").textContent = mode.name;
  const micAvailable = canRecognize || (cfg.transcribe && canRecord);

  root.innerHTML = `
    <div class="row between" style="margin-bottom:14px">
      <a href="#/coach" class="link small">Toutes les discussions</a>
      <button class="chip ${voiceOut ? "on" : ""}" id="vo">${voiceOut ? "Voix activée" : "Voix coupée"}</button>
    </div>
    <div class="chat" id="chat"></div>
    <div class="composer">
      ${micAvailable ? `<button class="round" id="mic" aria-label="Parler">${icons.mic}</button>` : ""}
      <textarea id="box" rows="1" placeholder="${micAvailable ? "Écris ou touche le micro" : "Écris, ou utilise le micro du clavier"}" spellcheck="false"></textarea>
      <button class="round send" id="send" aria-label="Envoyer" disabled>${icons.send}</button>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const list = $("#chat"), box = $("#box"), send = $("#send");

  $("#vo").addEventListener("click", (e) => {
    voiceOut = !voiceOut; localStorage.setItem(VOICE_KEY, voiceOut ? "1" : "0");
    e.currentTarget.classList.toggle("on", voiceOut); e.currentTarget.textContent = voiceOut ? "Voix activée" : "Voix coupée";
    if (!voiceOut) stopSpeaking();
  });

  const grow = () => { box.style.height = "auto"; box.style.height = Math.min(140, box.scrollHeight) + "px"; send.disabled = busy || !box.value.trim(); };
  box.addEventListener("input", grow);
  box.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !/iphone|android/i.test(navigator.userAgent)) { e.preventDefault(); if (!send.disabled) send.click(); } });

  function corrHTML(m) {
    if (!m.corr) return "";
    if (!m.corr.length) return `<div class="corr clean"><p class="label">Aucune faute</p></div>`;
    return `<div class="corr"><p class="label">Pour ton français</p>${m.corr.map((e) =>
      `<p><span class="wrong">${esc(e.w)}</span> → <b style="font-weight:600">${esc(e.r)}</b><br><span class="tiny" style="color:var(--ink-2)">${esc(e.y)}${e.f ? " · " + esc(famName(e.f)) : ""}</span></p>`).join("")}</div>`;
  }
  function drawAll() {
    list.innerHTML = c.messages.filter((m) => !m.hidden).map((m, i) =>
      m.role === "user" ? `<div class="msg me">${esc(m.content)}</div>${corrHTML(m)}`
        : `<div class="msg ai">${esc(m.content)}</div><div class="msg-tools"><button data-say="${i}">${"Écouter"}</button></div>`).join("");
    const visible = c.messages.filter((m) => !m.hidden);
    list.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => speak(visible[+b.dataset.say].content)));
    window.scrollTo({ top: document.body.scrollHeight });
  }

  async function ask() {
    busy = true; grow();
    const bubble = document.createElement("div");
    bubble.className = "msg ai typing"; bubble.textContent = "";
    list.appendChild(bubble);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    const apiMsgs = c.messages.map((m) => ({ role: m.role, content: m.content }));
    abort = new AbortController();
    try {
      const full = await claude({
        system: coachSystem(c.mode, usedVoice), messages: apiMsgs, max_tokens: 900, signal: abort.signal,
        onText: (t) => { bubble.textContent = t.split("§§§")[0].trim(); window.scrollTo({ top: document.body.scrollHeight }); },
      });
      const [reply, tail] = full.split("§§§");
      let corr = [];
      try { corr = tail ? parseJSON(tail).corrections || [] : []; } catch {}
      const lastUser = [...c.messages].reverse().find((m) => m.role === "user");
      if (lastUser && !lastUser.hidden) { lastUser.corr = corr; addErrors(corr, "coach"); }
      c.messages.push({ role: "assistant", content: reply.trim() });
      c.date = new Date().toISOString();
      save();
      drawAll();
      if (voiceOut) speak(reply.trim());
    } catch (e) {
      if (e.name === "AbortError") return;
      bubble.remove();
      list.insertAdjacentHTML("beforeend", errorBox(e));
    } finally { busy = false; abort = null; grow(); }
  }

  send.addEventListener("click", () => {
    const t = box.value.trim();
    if (!t || busy) return;
    stopSpeaking();
    c.messages.push({ role: "user", content: t });
    save();
    box.value = ""; grow();
    drawAll();
    ask();
  });

  // ---------- Micro ----------
  let listening = null;
  const mic = $("#mic");
  mic?.addEventListener("click", async () => {
    if (listening) { listening.stop(); return; }
    stopSpeaking();
    usedVoice = true;
    if (canRecognize && !cfg.transcribe) {
      const before = box.value ? box.value.trim() + " " : "";
      const r = dictate({
        onText: (t) => { box.value = before + t; grow(); },
        onEnd: () => { listening = null; mic.classList.remove("rec"); mic.innerHTML = icons.mic; grow(); },
      });
      if (!r) return;
      listening = { stop: () => r.stop() };
      mic.classList.add("rec"); mic.innerHTML = icons.stop;
    } else {
      const rec = new Recorder({});
      try { await rec.start(); } catch { toast("Autorise le micro pour parler."); return; }
      mic.classList.add("rec"); mic.innerHTML = icons.stop;
      listening = {
        stop: async () => {
          listening = null; mic.classList.remove("rec"); mic.innerHTML = `<span class="spinner"></span>`;
          const { blob, seconds } = await rec.stop();
          if (seconds < 1) { mic.innerHTML = icons.mic; return; }
          try { const t = await transcribe(blob); box.value = (box.value ? box.value.trim() + " " : "") + t; }
          catch (e) { toast(e.message); }
          mic.innerHTML = icons.mic; grow(); box.focus();
        },
      };
    }
  });

  drawAll();
  if (fresh || !c.messages.length) {
    c.messages.push({ role: "user", content: KICKOFF, hidden: true });
    save();
    ask();
  }

  return () => {
    view.classList.remove("has-composer");
    abort?.abort(); listening?.stop?.(); stopSpeaking();
    const n = c.messages.filter((m) => m.role === "user" && !m.hidden).length - startCount;
    if (n >= 2) addSession({ skill: "coach", minutes: Math.max(1, Math.round((Date.now() - t0) / 6e4)), meta: { mode: c.mode, messages: n, voice: usedVoice } });
  };
}
