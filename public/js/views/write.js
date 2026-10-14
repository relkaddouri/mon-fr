import { S, FAMILIES, addSession, addErrors, addVocab, weeklyFocus, cefr } from "../store.js";
import { claudeJSON } from "../api.js";
import { writeCorrection, drillGenerate, drillGrade } from "../prompts.js";
import { esc, ring, loading, errorBox, fixList, diffHTML, toast, tokenize, icons } from "../ui.js";
import { speak, stopSpeaking } from "../audio.js";

const TOPICS = [
  "Raconte ta journée d'hier, du matin au soir.",
  "Écris à un prospect pour lui proposer un audit de stratégie UX.",
  "Présente le Decision Compass à quelqu'un qui ne connaît pas l'UX.",
  "Donne ton avis sur le dernier film ou la dernière série que tu as vus.",
  "Explique à tes stagiaires pourquoi la recherche utilisateur compte.",
  "Écris un court post LinkedIn sur une erreur produit que tu as vue.",
  "Décris Agadir à un ami français qui n'y est jamais allé.",
  "L'IA va-t-elle remplacer les designers ? Donne ton point de vue.",
  "Raconte un souvenir avec ton fils qui t'a fait rire.",
  "Réponds à un client qui trouve ton devis trop cher.",
];
const DRAFT = "mf.draft";

export function render(root, params) {
  let mode = params.mode === "exercice" ? "exercice" : "libre";
  let famId = params.f || weeklyFocus().id;

  root.innerHTML = `
    <div class="segment" role="tablist">
      <button data-m="libre">Texte libre</button>
      <button data-m="exercice">Exercice ciblé</button>
    </div>
    <div id="pane" style="margin-top:20px"></div>`;
  const pane = root.querySelector("#pane");
  const seg = root.querySelectorAll(".segment button");
  const setMode = (m) => { mode = m; seg.forEach((b) => b.classList.toggle("on", b.dataset.m === m)); m === "libre" ? free() : drill(); };
  seg.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.m)));

  // ---------- Texte libre ----------
  function free() {
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem(DRAFT) || "{}"); } catch {}
    let topic = draft.topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    let t0 = null;

    pane.innerHTML = `
      <p class="label">Ton sujet</p>
      <div class="row" style="margin-top:8px;align-items:flex-start">
        <p class="quote grow" id="topic" style="font-size:17px">${esc(topic)}</p>
        <button class="icon-btn" id="newTopic" aria-label="Autre sujet">${icons.refresh}</button>
      </div>
      <div class="field" style="margin-top:18px">
        <textarea class="textarea" id="txt" placeholder="Écris ici. Vise 80 à 150 mots, sans chercher la perfection." autocapitalize="sentences" spellcheck="false">${esc(draft.text || "")}</textarea>
        <div class="counter" id="count">0 mot</div>
      </div>
      <p class="tiny muted" style="margin-top:4px">Le correcteur automatique est coupé ici : tes vraies fautes doivent rester visibles.</p>
      <button class="btn btn-primary btn-block" id="go" style="margin-top:16px">Corriger mon texte</button>
      <div id="out" style="margin-top:24px"></div>`;

    const txt = pane.querySelector("#txt"), count = pane.querySelector("#count"), go = pane.querySelector("#go");
    const upd = () => {
      const n = tokenize(txt.value).length;
      count.textContent = `${n} mot${n > 1 ? "s" : ""}`;
      go.disabled = n < 8;
      try { localStorage.setItem(DRAFT, JSON.stringify({ topic, text: txt.value })); } catch {}
    };
    txt.addEventListener("input", () => { if (!t0) t0 = Date.now(); upd(); });
    upd();
    pane.querySelector("#newTopic").addEventListener("click", () => {
      const others = TOPICS.filter((t) => t !== topic);
      topic = others[Math.floor(Math.random() * others.length)];
      pane.querySelector("#topic").textContent = topic;
      upd();
    });

    go.addEventListener("click", async () => {
      const text = txt.value.trim();
      const out = pane.querySelector("#out");
      go.disabled = true;
      out.innerHTML = loading("L'IA relit ton texte…");
      out.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        const res = await claudeJSON(writeCorrection(topic, text));
        const minutes = Math.max(1, Math.min(40, Math.round((Date.now() - (t0 || Date.now() - 6e4)) / 6e4)));
        addSession({ skill: "ecrit", score: res.score, cecr: res.cecr, minutes, meta: { type: "texte", topic, words: tokenize(text).length } });
        addErrors(res.erreurs, "ecrit");
        try { localStorage.removeItem(DRAFT); } catch {}
        showResult(out, text, res);
      } catch (e) {
        out.innerHTML = errorBox(e, "retry");
        out.querySelector("#retry")?.addEventListener("click", () => go.click());
      } finally { go.disabled = false; }
    });
  }

  function showResult(out, text, r) {
    out.innerHTML = `
      <div class="card fade-in">
        <div class="score-head">
          ${ring(r.score, "var(--c-ecrit)")}
          <div class="grow"><span class="tag accent">${esc(r.cecr || cefr(r.score))}</span><p style="margin-top:6px" class="small">${esc(r.resume)}</p></div>
        </div>
      </div>

      <div class="section" style="margin-top:20px">
        <p class="label" style="margin-bottom:8px">Ton texte corrigé</p>
        <div class="card diff">${diffHTML(text, r.corrige)}</div>
      </div>

      <div class="section" style="margin-top:20px">
        <p class="label">Tes fautes · ${r.erreurs?.length || 0}</p>
        <div>${fixList(r.erreurs)}</div>
        <p class="tiny muted">Elles sont ajoutées à ton carnet.</p>
      </div>

      ${r.tournures?.length ? `<div class="section" style="margin-top:20px"><p class="label">Plus naturel</p>${fixList(r.tournures)}</div>` : ""}

      <details class="fold" style="margin-top:20px">
        <summary>Version C1</summary>
        <div><p style="line-height:1.75">${esc(r.c1)}</p>
        <button class="btn btn-secondary" id="hear" style="margin-top:12px">${icons.speaker} Écouter</button></div>
      </details>

      ${r.mots?.length ? `<div class="section" style="margin-top:20px"><p class="label" style="margin-bottom:8px">Mots à retenir</p>
        <div class="card">${r.mots.map((m, i) => `
          <div class="list-item"><div class="grow"><b style="font-weight:600">${esc(m.m)}</b><p class="small muted">${esc(m.s)}</p></div>
          <button class="btn btn-ghost" data-add="${i}">Ajouter</button></div>`).join("")}</div></div>` : ""}

      <div class="btn-row" style="margin-top:24px">
        <button class="btn btn-secondary" id="rewrite">Réécrire</button>
        <button class="btn btn-primary" id="again">Nouveau sujet</button>
      </div>`;

    let playing = false;
    out.querySelector("#hear")?.addEventListener("click", (e) => {
      if (playing) { stopSpeaking(); playing = false; e.currentTarget.innerHTML = `${icons.speaker} Écouter`; return; }
      playing = true; const b = e.currentTarget; b.textContent = "Arrêter";
      speak(r.c1, { onEnd: () => { playing = false; b.innerHTML = `${icons.speaker} Écouter`; } });
    });
    out.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const ok = addVocab({ ...r.mots[+b.dataset.add], c: "écrit" });
      b.textContent = ok ? "Ajouté" : "Déjà là"; b.disabled = true;
    }));
    out.querySelector("#again").addEventListener("click", () => { localStorage.removeItem(DRAFT); free(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    out.querySelector("#rewrite").addEventListener("click", () => {
      try { localStorage.setItem(DRAFT, JSON.stringify({ topic: pane.querySelector("#topic").textContent, text: "" })); } catch {}
      free(); window.scrollTo({ top: 0, behavior: "smooth" });
      toast("Réécris ton texte en appliquant les corrections.");
    });
  }

  // ---------- Exercice ciblé ----------
  function drill() {
    const fam = () => FAMILIES.find((f) => f.id === famId) || FAMILIES[0];
    pane.innerHTML = `
      <p class="label">Choisis un point</p>
      <div class="chips" style="margin-top:10px">
        ${FAMILIES.map((f) => `<button class="chip ${f.id === famId ? "on" : ""}" data-f="${f.id}">${esc(f.name)}</button>`).join("")}
      </div>
      <div class="card recess" style="margin-top:16px"><p class="small" id="rule">${esc(fam().rule)}</p></div>
      <button class="btn btn-primary btn-block" id="gen" style="margin-top:16px">Préparer 6 phrases</button>
      <div id="dz" style="margin-top:24px"></div>`;

    pane.querySelectorAll("[data-f]").forEach((c) => c.addEventListener("click", () => {
      famId = c.dataset.f;
      pane.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === c));
      pane.querySelector("#rule").textContent = fam().rule;
      pane.querySelector("#dz").innerHTML = "";
    }));

    pane.querySelector("#gen").addEventListener("click", async () => {
      const dz = pane.querySelector("#dz");
      const f = fam();
      dz.innerHTML = loading("L'IA prépare tes phrases…");
      const t0 = Date.now();
      try {
        const { items } = await claudeJSON(drillGenerate(f));
        dz.innerHTML = `
          <p class="small muted">Chaque phrase contient une faute. Corrige-la directement dans le champ.</p>
          ${items.map((it, i) => `
            <div class="card" style="margin-top:12px">
              <div class="row between"><span class="label">Phrase ${i + 1}</span><button class="link small" data-hint="${i}">Indice</button></div>
              <p class="small muted" id="h${i}" hidden style="margin-top:4px">${esc(it.indice)}</p>
              <textarea class="textarea" style="min-height:76px;margin-top:8px" data-i="${i}" spellcheck="false" autocapitalize="off">${esc(it.faux)}</textarea>
              <div id="r${i}"></div>
            </div>`).join("")}
          <button class="btn btn-primary btn-block" id="check" style="margin-top:16px">Vérifier mes réponses</button>
          <div id="sum" style="margin-top:16px"></div>`;
        dz.querySelectorAll("[data-hint]").forEach((b) => b.addEventListener("click", () => { dz.querySelector("#h" + b.dataset.hint).hidden = false; b.remove(); }));
        dz.querySelector("#check").addEventListener("click", async (ev) => {
          const btn = ev.currentTarget; btn.disabled = true;
          const answers = [...dz.querySelectorAll("textarea[data-i]")].map((t) => t.value.trim());
          const sum = dz.querySelector("#sum");
          sum.innerHTML = loading("Correction en cours…");
          try {
            const g = await claudeJSON(drillGrade(f, items, answers));
            g.resultats.forEach((r, i) => {
              dz.querySelector("#r" + i).innerHTML = `<div class="fix" style="padding-bottom:0">
                <span class="tag ${r.ok ? "ok" : "warn"}">${r.ok ? "Juste" : "À revoir"}</span>
                ${r.ok ? "" : `<p style="margin-top:6px"><span class="right">${esc(r.juste)}</span></p>`}
                <p class="why">${esc(r.explication)}</p></div>`;
            });
            const misses = g.resultats.map((r, i) => (!r.ok ? { w: answers[i], r: r.juste, y: r.explication, f: f.id } : null)).filter(Boolean);
            addErrors(misses, "exercice");
            addSession({ skill: "ecrit", score: g.score, cecr: cefr(g.score), minutes: Math.max(1, Math.round((Date.now() - t0) / 6e4)), meta: { type: "exercice", fam: f.id } });
            sum.innerHTML = `<div class="card fade-in"><div class="score-head">${ring(g.score, "var(--c-ecrit)")}<p class="grow small">${esc(g.conseil)}</p></div>
              <button class="btn btn-secondary btn-block" id="more" style="margin-top:14px">Six nouvelles phrases</button></div>`;
            sum.querySelector("#more").addEventListener("click", () => { pane.querySelector("#gen").click(); window.scrollTo({ top: 0, behavior: "smooth" }); });
          } catch (e) {
            sum.innerHTML = errorBox(e); btn.disabled = false;
          }
        });
      } catch (e) {
        dz.innerHTML = errorBox(e);
      }
    });
  }

  setMode(mode);
  return () => stopSpeaking();
}
