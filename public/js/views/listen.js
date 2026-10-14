import { addSession, addVocab, skillScore, cefr } from "../store.js";
import { claudeJSON } from "../api.js";
import { listenGenerate } from "../prompts.js";
import { esc, ring, loading, errorBox, icons, diffHTML, diffWords, toast } from "../ui.js";
import { speak, stopSpeaking, splitSentences, frenchVoices, voicesReady } from "../audio.js";

const THEMES = ["Tech et IA", "Vie quotidienne", "Travail et conseil", "Cinéma et séries", "Société", "Voyage", "Sport"];

export function render(root) {
  let kind = "comprehension", theme = THEMES[0];
  const lv = cefr(skillScore("ecoute")) || "C1";
  let level = lv.startsWith("C") ? "C1" : "B2";
  let rate = 1;
  let ex = null, sentences = [], idx = 0, playing = false, t0 = 0, plays = 0;

  root.innerHTML = `
    <div class="segment"><button data-k="comprehension">Compréhension</button><button data-k="dictee">Dictée</button></div>
    <div id="setup" style="margin-top:20px"></div>
    <div id="ex" style="margin-top:20px"></div>`;
  const $ = (s) => root.querySelector(s);
  const seg = root.querySelectorAll(".segment button");
  const setKind = (k) => { kind = k; seg.forEach((b) => b.classList.toggle("on", b.dataset.k === k)); stop(); ex = null; $("#ex").innerHTML = ""; $("#setup").hidden = false; drawSetup(); };
  seg.forEach((b) => b.addEventListener("click", () => setKind(b.dataset.k)));

  function drawSetup() {
    $("#setup").innerHTML = `
      <p class="label">Thème</p>
      <div class="chips" style="margin-top:8px">${THEMES.map((t) => `<button class="chip ${t === theme ? "on" : ""}" data-th="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <p class="label" style="margin-top:16px">Niveau</p>
      <div class="chips wrap" style="margin-top:8px">${["B2", "C1", "C1+"].map((l) => `<button class="chip ${l === level ? "on" : ""}" data-lv="${l}">${l}</button>`).join("")}</div>
      <button class="btn btn-primary btn-block" id="gen" style="margin-top:18px">${kind === "dictee" ? "Préparer une dictée" : "Préparer une écoute"}</button>
      ${frenchVoices().length ? "" : `<p class="tiny muted" style="margin-top:8px">Aucune voix française trouvée. Sur iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Français.</p>`}`;
    root.querySelectorAll("[data-th]").forEach((c) => c.addEventListener("click", () => { theme = c.dataset.th; drawSetup(); }));
    root.querySelectorAll("[data-lv]").forEach((c) => c.addEventListener("click", () => { level = c.dataset.lv; drawSetup(); }));
    $("#gen").addEventListener("click", generate);
  }

  async function generate() {
    stop();
    const box = $("#ex");
    box.innerHTML = loading("L'IA prépare ton écoute…");
    $("#gen").disabled = true;
    try {
      ex = await claudeJSON(listenGenerate({ theme, level, kind }));
      sentences = splitSentences(ex.texte); idx = 0; plays = 0; t0 = Date.now();
      drawExercise();
      $("#setup").hidden = true;
    } catch (e) {
      box.innerHTML = errorBox(e);
    } finally { const g = $("#gen"); if (g) g.disabled = false; }
  }

  function drawExercise() {
    $("#ex").innerHTML = `
      <div class="card player fade-in">
        <div class="row between"><div><p class="label">${esc(theme)} · ${esc(level)}</p><h3 style="margin-top:4px">${esc(ex.titre)}</h3></div></div>
        <div class="sentence-nav">
          <button class="icon-btn" id="prev" aria-label="Phrase précédente">${icons.prev}</button>
          <button class="play-main" id="play" aria-label="Lecture">${icons.play}</button>
          <button class="icon-btn" id="next" aria-label="Phrase suivante">${icons.next}</button>
        </div>
        <div class="progress-dots" id="dots">${sentences.map(() => "<i></i>").join("")}</div>
        <div class="chips wrap" style="justify-content:center">${[0.8, 1, 1.15].map((r) => `<button class="chip ${r === rate ? "on" : ""}" data-r="${r}">${r === 1 ? "Normal" : r < 1 ? "Lent" : "Rapide"}</button>`).join("")}</div>
        <p class="tiny muted" style="text-align:center">${kind === "dictee" ? "Lecture : rejoue la phrase. Flèches : phrase suivante ou précédente." : "Écoute une ou deux fois sans lire, puis réponds."}</p>
      </div>
      <div id="work" style="margin-top:20px"></div>
      <details class="fold" id="txtFold" style="margin-top:20px"><summary>Voir le texte</summary><div><p class="reading" id="reading">${sentences.map((s, i) => `<span data-s="${i}">${esc(s)}</span>`).join(" ")}</p></div></details>
      <button class="btn btn-secondary btn-block" id="newEx" style="margin-top:16px">Autre écoute</button>`;

    $("#play").addEventListener("click", () => (playing ? stop() : play(idx)));
    $("#prev").addEventListener("click", () => { idx = Math.max(0, idx - 1); play(idx, true); });
    $("#next").addEventListener("click", () => { idx = Math.min(sentences.length - 1, idx + 1); play(idx, true); });
    root.querySelectorAll("[data-r]").forEach((c) => c.addEventListener("click", () => {
      rate = +c.dataset.r; root.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x === c));
      if (playing) play(idx);
    }));
    $("#newEx").addEventListener("click", () => { stop(); $("#ex").innerHTML = ""; $("#setup").hidden = false; drawSetup(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    if (kind === "dictee") $("#txtFold").hidden = true;
    marks();
    kind === "dictee" ? drawDictation() : drawQuestions();
  }

  function marks() {
    root.querySelectorAll("#dots i").forEach((d, i) => d.classList.toggle("on", i <= idx && (playing || i < idx)));
    root.querySelectorAll("#reading [data-s]").forEach((s) => s.classList.toggle("cur", playing && +s.dataset.s === idx));
  }

  function play(i, single = false) {
    idx = i; playing = true; plays++;
    const b = $("#play"); if (b) { b.innerHTML = icons.pause; b.setAttribute("aria-label", "Pause"); }
    marks();
    speak(sentences[i], {
      rate,
      onEnd: () => {
        if (!playing) return;
        const flow = kind !== "dictee" && !single;
        if (flow && idx < sentences.length - 1) play(idx + 1);
        else { if (flow) idx = 0; stop(); }
      },
    });
  }
  function stop(keep) {
    playing = false; stopSpeaking();
    const b = $("#play"); if (b) { b.innerHTML = icons.play; b.setAttribute("aria-label", "Lecture"); }
    if (ex) marks();
  }

  // ---------- Questions ----------
  function drawQuestions() {
    const picks = {};
    $("#work").innerHTML = `
      <p class="label">Questions</p>
      ${ex.questions.map((q, i) => `
        <div class="card" style="margin-top:12px">
          <p style="font-weight:500">${i + 1}. ${esc(q.q)}</p>
          <div class="qcm">${q.o.map((o, j) => `<button class="opt" data-q="${i}" data-o="${j}">${esc(o)}</button>`).join("")}</div>
          <p class="why small" id="x${i}" hidden style="margin-top:10px"></p>
        </div>`).join("")}
      <button class="btn btn-primary btn-block" id="val" style="margin-top:16px" disabled>Valider</button>
      <div id="sum" style="margin-top:16px"></div>`;
    root.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      if ($("#val").dataset.done) return;
      const q = +b.dataset.q; picks[q] = +b.dataset.o;
      root.querySelectorAll(`.opt[data-q="${q}"]`).forEach((x) => x.classList.toggle("pick", x === b));
      $("#val").disabled = Object.keys(picks).length < ex.questions.length;
    }));
    $("#val").addEventListener("click", (e) => {
      e.currentTarget.dataset.done = 1; e.currentTarget.disabled = true; stop();
      let good = 0;
      ex.questions.forEach((q, i) => {
        const ok = picks[i] === q.a; if (ok) good++;
        root.querySelectorAll(`.opt[data-q="${i}"]`).forEach((x) => {
          x.classList.remove("pick");
          if (+x.dataset.o === q.a) x.classList.add("good"); else if (+x.dataset.o === picks[i]) x.classList.add("bad");
        });
        const xp = root.querySelector("#x" + i); xp.hidden = false; xp.textContent = q.x;
      });
      // Score : les bonnes réponses, avec un petit bonus si le niveau est haut et peu de réécoutes.
      let score = Math.round((good / ex.questions.length) * 100);
      const lvBonus = { B2: -12, C1: 0, "C1+": 6 }[level] || 0;
      score = Math.max(0, Math.min(100, score + lvBonus - Math.max(0, plays - 2 * sentences.length) ));
      finish(score, `${good} bonne${good > 1 ? "s" : ""} réponse${good > 1 ? "s" : ""} sur ${ex.questions.length}.`);
      $("#txtFold").open = true;
    });
  }

  // ---------- Dictée ----------
  function drawDictation() {
    $("#work").innerHTML = `
      <div class="field"><span>Écris ce que tu entends</span>
        <textarea class="textarea" id="dict" spellcheck="false" autocapitalize="sentences" autocorrect="off" placeholder="Une phrase après l'autre…"></textarea></div>
      <button class="btn btn-primary btn-block" id="val" style="margin-top:14px">Comparer avec le texte</button>
      <div id="sum" style="margin-top:16px"></div>`;
    $("#val").addEventListener("click", (e) => {
      const mine = $("#dict").value.trim();
      if (!mine) { toast("Écris d'abord ce que tu as entendu."); return; }
      e.currentTarget.disabled = true; stop();
      const d = diffWords(mine, ex.texte);
      const base = Math.max(1, d.covered, d.typed);
      const score = Math.round((d.same / base) * 100);
      const head = d.head.map((o) => o.t === "=" ? esc(o.w) : o.t === "+" ? `<ins>${esc(o.w)}</ins>` : `<del>${esc(o.w)}</del>`).join(" ");
      $("#work").insertAdjacentHTML("beforeend", `<div class="card diff fade-in" style="margin-top:16px"><p class="label" style="margin-bottom:6px">Correction</p>${head}${d.rest ? ` <span class="muted">${esc(d.rest)}</span>` : ""}</div>`);
      finish(score, `${d.same} mots justes sur ${base}. En vert, ce qui manquait ; barré, ce qui était faux.${d.rest ? " En gris, la suite du texte que tu n'as pas écrite." : ""}`);
    });
  }

  function finish(score, line) {
    addSession({ skill: "ecoute", score, cecr: cefr(score), minutes: Math.max(1, Math.round((Date.now() - t0) / 6e4)), meta: { kind, theme, level, titre: ex.titre } });
    const sum = $("#sum");
    sum.innerHTML = `
      <div class="card fade-in"><div class="score-head">${ring(score, "var(--c-ecoute)")}<p class="grow small">${esc(line)}</p></div></div>
      ${ex.mots?.length ? `<p class="label" style="margin:20px 0 8px">Mots de l'écoute</p><div class="card">${ex.mots.map((m, i) => `
        <div class="list-item"><div class="grow"><b style="font-weight:600">${esc(m.m)}</b><p class="small muted">${esc(m.s)}</p></div>
        <button class="btn btn-ghost" data-add="${i}">Ajouter</button></div>`).join("")}</div>` : ""}`;
    sum.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const ok = addVocab({ ...ex.mots[+b.dataset.add], c: "écoute" }); b.textContent = ok ? "Ajouté" : "Déjà là"; b.disabled = true;
    }));
  }

  setKind(kind);
  voicesReady().then(() => { if (!ex && root.isConnected) drawSetup(); });
  return () => stop();
}
