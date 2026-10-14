import { S, SKILLS, FAMILIES, skillScore, cefr, getAudio, save, deleteAudio } from "../store.js";
import { esc, lineChart, weekBars, relDate, fmtTime } from "../ui.js";

export function render(root) {
  const days = Math.max(7, Math.min(30, Math.round((Date.now() - new Date(S.createdAt)) / 864e5) + 3));
  const since = Date.now() - days * 864e5;
  const series = {};
  for (const k of Object.keys(SKILLS)) {
    const pts = [];
    if (S.baseline[k] != null) pts.push({ d: new Date(S.createdAt), v: S.baseline[k] });
    // Une valeur par jour : la moyenne des séances du jour.
    const byDay = {};
    S.sessions.filter((s) => s.skill === k && typeof s.score === "number").forEach((s) => {
      const d = s.date.slice(0, 10); (byDay[d] ||= []).push(s.score);
    });
    Object.entries(byDay).sort().forEach(([d, arr]) => pts.push({ d: new Date(d), v: arr.reduce((a, b) => a + b, 0) / arr.length }));
    series[k] = pts.filter((p) => p.d.getTime() >= since - 864e5);
  }

  // Minutes par semaine (8 dernières semaines)
  const weeks = [], labels = [];
  const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) {
    const a = new Date(monday); a.setDate(a.getDate() - i * 7);
    const b = new Date(a); b.setDate(b.getDate() + 7);
    weeks.push(S.sessions.filter((s) => { const d = new Date(s.date); return d >= a && d < b; }).reduce((x, s) => x + (s.minutes || 0), 0));
    labels.push(a.toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" }));
  }

  // Fautes par famille : 30 derniers jours (nouvelles) et bilan de départ
  const recent = S.errors.filter((e) => e.src !== "bilan" && new Date(e.date).getTime() >= since);
  const counts = FAMILIES.map((f) => ({ f, n: recent.filter((e) => e.f === f.id).length, base: S.errors.filter((e) => e.f === f.id && e.src === "bilan").length }));
  const maxN = Math.max(1, ...counts.map((c) => (recent.length ? c.n : c.base)));

  const oralSessions = S.sessions.filter((s) => s.skill === "oral" && s.meta?.audioId).slice(-12).reverse();
  const wpmPts = S.sessions.filter((s) => s.skill === "oral" && s.meta?.wpm).slice(-8);

  root.innerHTML = `
    <section class="stack skills-row">
      ${Object.keys(SKILLS).map((k) => {
        const sc = skillScore(k), lv = cefr(sc);
        const n = S.sessions.filter((s) => s.skill === k).length;
        return `<div class="card row"><div class="grow"><p class="label" style="color:${SKILLS[k].color}">${SKILLS[k].name}</p>
          <p class="small muted" style="margin-top:2px">${n ? `${n} séance${n > 1 ? "s" : ""} · score ${sc}/100` : sc != null ? "Point de départ : le bilan" : "Pas encore évalué"}</p></div>
          <div class="h1" style="font-size:30px">${lv || "–"}</div></div>`;
      }).join("")}
    </section>

    <div class="grid-2">
    <section class="section">
      <div class="section-head"><h2>Évolution</h2><span class="small muted">${days} jours</span></div>
      <div class="card">
        ${lineChart(series, { days })}
        <div class="legend" style="margin-top:8px">${Object.entries(SKILLS).map(([k, s]) => `<span><i style="background:${s.hex}"></i>${s.name}</span>`).join("")}</div>
      </div>
      <p class="tiny muted" style="margin-top:8px">Ton niveau affiché est la moyenne de tes cinq dernières séances. Repères : B2 à partir de 50, C1 à partir de 74.</p>
    </section>

    <section class="section">
      <div class="section-head"><h2>Temps de pratique</h2><span class="small muted">minutes par semaine</span></div>
      <div class="card">${weekBars(weeks, labels)}</div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Tes fautes</h2><span class="small muted">${recent.length ? "30 derniers jours" : "bilan de départ"}</span></div>
      <div class="card">
        ${counts.sort((a, b) => (recent.length ? b.n - a.n : b.base - a.base)).map((c) => {
          const v = recent.length ? c.n : c.base;
          return `<div class="hbar"><span>${esc(c.f.name)}</span><div class="bar" style="--c:${recent.length ? "var(--warn)" : "var(--faint)"}"><i style="width:${(v / maxN) * 100}%"></i></div><span class="num">${v}</span></div>`;
        }).join("")}
      </div>
      <p class="tiny muted" style="margin-top:8px">Une famille qui baisse, c'est une règle devenue un réflexe.</p>
    </section>

    ${wpmPts.length ? `<section class="section"><div class="section-head"><h2>Débit à l'oral</h2><span class="small muted">mots par minute</span></div>
      <div class="card">${weekBars(wpmPts.map((s) => s.meta.wpm), wpmPts.map((s) => new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" })))}</div>
      <p class="tiny muted" style="margin-top:8px">Objectif : entre 110 et 140, avec peu d'hésitations.</p></section>` : ""}

    <section class="section">
      <div class="section-head"><h2>Ta voix dans le temps</h2></div>
      ${oralSessions.length ? `<div class="card">${oralSessions.map((s) => `
        <div class="list-item" style="flex-wrap:wrap">
          <div class="grow"><b style="font-weight:500">${esc(s.meta.topic || "Prise de parole")}</b>
          <p class="small muted">${relDate(s.date)} · ${fmtTime(s.meta.seconds || 0)} · ${s.score}/100 · ${s.meta.wpm} mots/min</p></div>
          <button class="btn btn-ghost" data-play="${s.meta.audioId}">Écouter</button>
          <audio id="a-${s.meta.audioId}" controls hidden style="width:100%;margin-top:6px"></audio>
        </div>`).join("")}</div>
        <p class="tiny muted" style="margin-top:8px">Réécoute ton premier enregistrement dans un mois. C'est là que le progrès s'entend.</p>`
      : `<div class="card empty"><p>Tes enregistrements apparaîtront ici.</p><a class="btn btn-primary" style="margin-top:14px" href="#/parler">Faire ma première prise de parole</a></div>`}
    </section>

    <section class="section">
      <div class="section-head"><h2>Historique</h2></div>
      <div class="card">${S.sessions.length ? S.sessions.slice(-15).reverse().map((s) => `
        <div class="list-item"><div class="grow"><b style="font-weight:500">${s.skill === "coach" ? "Coach" : SKILLS[s.skill]?.name}</b>
        <span class="small muted"> · ${esc(s.meta?.topic || s.meta?.titre || (s.meta?.type === "exercice" ? "Exercice ciblé" : s.meta?.mode || ""))}</span>
        <p class="small muted">${relDate(s.date)} · ${s.minutes} min</p></div>
        ${typeof s.score === "number" ? `<span class="num" style="font-weight:600">${s.score}</span>` : ""}</div>`).join("") : `<p class="muted small">Aucune séance pour l'instant.</p>`}</div>
    </section>
    </div>`;

  requestAnimationFrame(() => root.querySelectorAll(".hbar .bar > i").forEach((i) => { const w = i.style.width; i.style.width = "0"; requestAnimationFrame(() => (i.style.width = w)); }));

  root.querySelectorAll("[data-play]").forEach((b) => b.addEventListener("click", async () => {
    const a = root.querySelector("#a-" + b.dataset.play);
    if (!a.src) {
      const blob = await getAudio(b.dataset.play);
      if (!blob) { b.textContent = "Introuvable"; b.disabled = true; return; }
      a.src = URL.createObjectURL(blob);
    }
    a.hidden = false; b.hidden = true; a.play();
  }));
}
