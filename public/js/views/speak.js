import { addSession, addErrors, addVocab, putAudio, uid, cefr } from "../store.js";
import { claudeJSON, getConfig, transcribe } from "../api.js";
import { speakFeedback, readAloudText } from "../prompts.js";
import { esc, ring, loading, errorBox, fixList, fmtTime, icons, toast, tokenize } from "../ui.js";
import { Recorder, canRecord, canRecognize, speak, stopSpeaking } from "../audio.js";

const TOPICS = [
  "Présente-toi comme au début d'un appel avec un nouveau client.",
  "Raconte le dernier film qui t'a vraiment marqué, et pourquoi.",
  "Explique ton métier à un enfant de dix ans.",
  "Quel conseil donnerais-tu à un stagiaire qui débute en UX ?",
  "Décris ta ville idéale pour vivre et travailler.",
  "Raconte une décision difficile que tu as prise cette année.",
  "Qu'est-ce que l'IA a changé dans ta façon de travailler ?",
  "Tu as cinq minutes avec un investisseur. Présente une de tes apps.",
  "Parle d'un jeu vidéo que tu recommandes, comme à un ami.",
  "Qu'est-ce qui fait un bon formateur, selon toi ?",
];
const FALLBACK_READ = {
  titre: "Un lundi à Agadir",
  texte: "Lundi matin, je bois un café brûlant au bout de la rue, puis je pars au centre de formation. Sur la route, je pense aux vingt-deux stagiaires qui m'attendent. Aujourd'hui, nous parlons de parcours utilisateur, de besoins réels et de vraies décisions. Un bon prototype ne vaut rien si personne ne s'en sert. Vers midi, mon fils m'envoie une vidéo : il a enfin vu un poisson bleu au port. Je souris, et je reprends le cours avec un peu plus d'énergie.",
  sons: ["u / ou", "p / b", "les nasales"],
};
const FILLERS = /\b(euh+|heu+|hum+|hmm+|bah|ben)\b/gi;

export async function render(root) {
  let mode = "libre", target = 120, topic = TOPICS[Math.floor(Math.random() * TOPICS.length)], ref = FALLBACK_READ;
  let rec = null, timer = null, result = null;
  const cfg = await getConfig();

  root.innerHTML = `
    <div class="segment"><button data-m="libre">Parler librement</button><button data-m="lire">Lire à voix haute</button></div>
    <div id="prompt" style="margin-top:20px"></div>
    <div class="card recorder" id="recCard" style="margin-top:16px">
      <canvas class="wave" id="wave" width="600" height="96" aria-hidden="true"></canvas>
      <div class="rec-time num" id="time">0:00</div>
      <button class="rec-btn" id="rec" aria-label="Commencer l'enregistrement">${icons.mic}</button>
      <p class="small muted" id="hint">Touche le micro et parle.</p>
      <div class="live" id="live" hidden></div>
    </div>
    <div id="tnote"></div>
    <div id="after" style="margin-top:20px"></div>
    <p class="tiny muted" style="margin-top:20px">L'IA lit la transcription de ta voix, elle ne l'entend pas. Pour travailler la prononciation, utilise « Lire à voix haute » : les mots mal reconnus montrent les sons à travailler.</p>`;

  const $ = (s) => root.querySelector(s);
  const seg = root.querySelectorAll(".segment button");
  const setMode = (m) => { mode = m; seg.forEach((b) => b.classList.toggle("on", b.dataset.m === m)); drawPrompt(); $("#after").innerHTML = ""; };
  seg.forEach((b) => b.addEventListener("click", () => { if (!rec) setMode(b.dataset.m); }));

  function drawPrompt() {
    const p = $("#prompt");
    if (mode === "libre") {
      p.innerHTML = `
        <p class="label">Ton sujet</p>
        <div class="row" style="margin-top:8px;align-items:flex-start">
          <p class="quote grow" style="font-size:17px">${esc(topic)}</p>
          <button class="icon-btn" id="nt" aria-label="Autre sujet">${icons.refresh}</button>
        </div>
        <div class="chips wrap" style="margin-top:14px">
          ${[60, 120, 180].map((s) => `<button class="chip ${s === target ? "on" : ""}" data-t="${s}">${s / 60} min</button>`).join("")}
        </div>`;
      p.querySelector("#nt").addEventListener("click", () => { const o = TOPICS.filter((t) => t !== topic); topic = o[Math.floor(Math.random() * o.length)]; drawPrompt(); });
      p.querySelectorAll("[data-t]").forEach((c) => c.addEventListener("click", () => { target = +c.dataset.t; drawPrompt(); }));
    } else {
      p.innerHTML = `
        <div class="row between"><p class="label">À lire · ${esc(ref.sons?.join(", ") || "")}</p>
        <button class="link small" id="newText">Autre texte</button></div>
        <div class="card" style="margin-top:8px"><h3>${esc(ref.titre)}</h3><p class="reading" style="margin-top:8px">${esc(ref.texte)}</p>
        <button class="btn btn-ghost" id="model" style="margin-top:8px;padding:0">${icons.speaker} Écouter le modèle d'abord</button></div>`;
      p.querySelector("#model").addEventListener("click", () => speak(ref.texte, { rate: 0.92 }));
      p.querySelector("#newText").addEventListener("click", async () => {
        p.querySelector(".card").innerHTML = loading("L'IA écrit un texte pour toi…");
        try { ref = await claudeJSON(readAloudText()); } catch (e) { toast(e.message); }
        drawPrompt();
      });
    }
  }

  // ---------- Onde ----------
  const cv = $("#wave"), ctx = cv.getContext("2d");
  const levels = new Array(60).fill(0);
  function drawWave() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const w = cv.width / levels.length;
    levels.forEach((l, i) => {
      const h = Math.max(4, l * cv.height * 0.9);
      ctx.fillStyle = rec ? "#A8562F" : "#DEDAD1";
      ctx.globalAlpha = 0.35 + 0.65 * (i / levels.length);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(i * w + 2, (cv.height - h) / 2, w - 4, h, 3) : ctx.rect(i * w + 2, (cv.height - h) / 2, w - 4, h);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  drawWave();

  // ---------- Enregistrement ----------
  const useLive = !cfg.transcribe && canRecognize;
  if (!cfg.transcribe && !useLive) {
    $("#tnote").innerHTML = `<div class="banner" style="margin-top:12px"><div><b>Transcription automatique indisponible.</b> Tu peux t'enregistrer et te réécouter. Pour l'analyse, redis ton texte avec le micro du clavier. Pour tout automatiser, ajoute GROQ_API_KEY (gratuit) dans les variables Vercel.</div></div>`;
  }
  $("#rec").addEventListener("click", async () => {
    if (!canRecord) { toast("Ton navigateur ne permet pas d'enregistrer."); return; }
    if (rec) return stopRec();
    stopSpeaking();
    $("#after").innerHTML = "";
    const live = $("#live");
    rec = new Recorder({
      live: useLive,
      onLevel: (l) => { levels.push(l); levels.shift(); drawWave(); },
      onLive: (fin, interim) => { live.innerHTML = `${esc(fin)}<span class="interim">${esc(interim)}</span>`; },
    });
    try { await rec.start(); }
    catch { rec = null; toast("Autorise le micro pour enregistrer."); return; }
    live.hidden = !useLive; live.innerHTML = "";
    $("#rec").classList.add("recording");
    $("#rec").innerHTML = icons.stop;
    $("#rec").setAttribute("aria-label", "Arrêter");
    $("#hint").textContent = mode === "libre" ? `Parle environ ${target / 60} min. Touche pour arrêter.` : "Lis le texte à ton rythme. Touche pour arrêter.";
    timer = setInterval(() => {
      const s = rec.seconds;
      $("#time").textContent = fmtTime(s) + (mode === "libre" ? ` / ${fmtTime(target)}` : "");
      $("#time").style.color = mode === "libre" && s >= target ? "var(--ok)" : "";
      if (s > 180) stopRec();
    }, 250);
  });

  async function stopRec() {
    clearInterval(timer);
    const r = rec; rec = null;
    $("#rec").classList.remove("recording");
    $("#rec").innerHTML = icons.mic;
    $("#hint").textContent = "Touche le micro pour recommencer.";
    const { blob, seconds, text } = await r.stop();
    levels.fill(0); drawWave();
    if (seconds < 4) { toast("Trop court. Parle au moins quelques secondes."); return; }
    review(blob, seconds, text);
  }

  // ---------- Après l'enregistrement ----------
  async function review(blob, seconds, liveText) {
    const after = $("#after");
    const url = URL.createObjectURL(blob);
    after.innerHTML = `
      <div class="card fade-in">
        <p class="label">Ton enregistrement · ${fmtTime(seconds)}</p>
        <audio controls src="${url}" style="width:100%;margin-top:10px"></audio>
        <div class="field" style="margin-top:16px">
          <span>Ce que tu as dit</span>
          <div id="tz">${cfg.transcribe ? loading("Transcription en cours…") : ""}</div>
        </div>
        <button class="btn btn-primary btn-block" id="analyse" style="margin-top:14px" disabled>Analyser</button>
      </div>
      <div id="res" style="margin-top:20px"></div>`;

    let transcript = liveText;
    const tz = after.querySelector("#tz");
    const showText = (t, note) => {
      tz.innerHTML = `<textarea class="textarea" id="tr" style="min-height:120px" spellcheck="false">${esc(t)}</textarea>
        <p class="tiny muted" style="margin-top:4px">${note}</p>`;
      const ta = tz.querySelector("#tr"), btn = after.querySelector("#analyse");
      const upd = () => (btn.disabled = tokenize(ta.value).length < 5);
      ta.addEventListener("input", upd); upd();
    };
    if (cfg.transcribe) {
      try { transcript = await transcribe(blob); showText(transcript, "Corrige seulement les erreurs de la machine, pas les tiennes."); }
      catch (e) { showText(liveText, e.message + " Tape ou dicte ce que tu as dit."); }
    } else if (liveText) {
      showText(liveText, "Corrige seulement les erreurs de la machine, pas les tiennes.");
    } else {
      showText("", "La transcription automatique n'est pas disponible ici. Réécoute-toi, puis utilise la dictée du clavier (le micro du clavier) pour redire la même chose.");
    }

    after.querySelector("#analyse").addEventListener("click", async (ev) => {
      const btn = ev.currentTarget; btn.disabled = true;
      const t = after.querySelector("#tr").value.trim();
      const words = tokenize(t);
      const fillers = (t.match(FILLERS) || []).length;
      const wpm = Math.round((words.length - fillers) / (seconds / 60));
      const res = after.querySelector("#res");
      res.innerHTML = loading("L'IA analyse ta prise de parole…");
      try {
        const r = await claudeJSON(speakFeedback({ mode, topic, refText: ref.texte, transcript: t, seconds: Math.round(seconds), wpm, fillers }));
        const id = uid();
        try { await putAudio(id, blob); } catch {}
        addSession({ skill: "oral", score: r.score, cecr: r.cecr, minutes: Math.max(1, Math.ceil(seconds / 60)), meta: { mode, topic: mode === "libre" ? topic : ref.titre, wpm, fillers, seconds: Math.round(seconds), audioId: id, mime: blob.type } });
        addErrors(r.erreurs, "oral");
        btn.textContent = "Analyse terminée";
        showResult(res, r, { wpm, fillers, seconds });
      } catch (e) {
        res.innerHTML = errorBox(e); btn.disabled = false;
      }
    });
  }

  function showResult(res, r, m) {
    result = r;
    res.innerHTML = `
      <div class="card fade-in">
        <div class="score-head">${ring(r.score, "var(--c-oral)")}
          <div class="grow"><span class="tag accent">${esc(r.cecr || cefr(r.score))}</span><p class="small" style="margin-top:6px">${esc(r.resume)}</p></div>
        </div>
        <div class="stats" style="margin-top:16px">
          <div class="stat"><div class="num">${m.wpm}</div><div class="tiny">mots / min</div></div>
          <div class="stat"><div class="num">${m.fillers}</div><div class="tiny">hésitations</div></div>
          <div class="stat"><div class="num">${fmtTime(m.seconds)}</div><div class="tiny">durée</div></div>
        </div>
        <p class="small" style="margin-top:14px;color:var(--ink-2)">${esc(r.fluidite)}</p>
      </div>

      <div class="section" style="margin-top:20px">
        <p class="label" style="margin-bottom:8px">Version naturelle</p>
        <div class="card"><p class="quote">${esc(r.reformulation)}</p>
          <button class="btn btn-secondary" id="shadow" style="margin-top:12px">${icons.speaker} Écouter et répéter</button></div>
      </div>

      ${r.prononciation?.length ? `<div class="section" style="margin-top:20px"><p class="label">Prononciation</p>
        ${r.prononciation.map((p) => `<div class="fix"><span class="right">${esc(p.attendu)}</span> <span class="muted small">compris comme</span> <span class="wrong">${esc(p.entendu)}</span><p class="why">${esc(p.conseil)}</p></div>`).join("")}</div>` : ""}

      <div class="section" style="margin-top:20px"><p class="label">Fautes · ${r.erreurs?.length || 0}</p>${fixList(r.erreurs)}</div>

      ${r.conseils?.length ? `<div class="section" style="margin-top:20px"><p class="label" style="margin-bottom:8px">Pour la prochaine fois</p>
        <div class="card recess">${r.conseils.map((c) => `<p class="small" style="margin-top:6px">${esc(c)}</p>`).join("")}</div></div>` : ""}

      ${r.expressions?.length ? `<div class="section" style="margin-top:20px"><p class="label" style="margin-bottom:8px">Expressions utiles</p>
        <div class="card">${r.expressions.map((x, i) => `<div class="list-item"><div class="grow"><b style="font-weight:600">${esc(x.m)}</b><p class="small muted">${esc(x.s)}</p></div><button class="btn btn-ghost" data-add="${i}">Ajouter</button></div>`).join("")}</div></div>` : ""}

      <button class="btn btn-primary btn-block" id="again" style="margin-top:24px">Recommencer sur le même sujet</button>`;

    res.querySelector("#shadow").addEventListener("click", () => speak(r.reformulation, { rate: 0.95 }));
    res.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const ok = addVocab({ ...r.expressions[+b.dataset.add], c: "oral" });
      b.textContent = ok ? "Ajouté" : "Déjà là"; b.disabled = true;
    }));
    res.querySelector("#again").addEventListener("click", () => { $("#after").innerHTML = ""; window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  setMode("libre");
  return () => { clearInterval(timer); if (rec) rec.stop(); stopSpeaking(); };
}
