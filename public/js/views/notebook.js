import { S, FAMILIES, famName, save, addVocab } from "../store.js";
import { esc, relDate, toast, icons } from "../ui.js";
import { speak } from "../audio.js";

const SRC = { bilan: "Bilan", ecrit: "Écrit", oral: "Oral", coach: "Coach", exercice: "Exercice" };

export function render(root, params) {
  let tab = params.tab || "fautes", fam = "all", q = "";
  root.innerHTML = `
    <div class="segment"><button data-t="fautes">Fautes</button><button data-t="mots">Mots</button><button data-t="reviser">Réviser</button></div>
    <div id="pane" style="margin-top:20px"></div>`;
  const pane = root.querySelector("#pane");
  const seg = root.querySelectorAll(".segment button");
  const setTab = (t) => { tab = t; seg.forEach((b) => b.classList.toggle("on", b.dataset.t === t)); q = ""; ({ fautes, mots, reviser })[t](); };
  seg.forEach((b) => b.addEventListener("click", () => setTab(b.dataset.t)));

  function fautes() {
    pane.innerHTML = `
      <input class="input" id="q" type="search" placeholder="Chercher une faute…" value="${esc(q)}">
      <div class="chips" style="margin-top:12px">
        <button class="chip ${fam === "all" ? "on" : ""}" data-f="all">Toutes · ${S.errors.length}</button>
        ${FAMILIES.map((f) => { const n = S.errors.filter((e) => e.f === f.id).length; return n ? `<button class="chip ${fam === f.id ? "on" : ""}" data-f="${f.id}">${esc(f.name)} · ${n}</button>` : ""; }).join("")}
      </div>
      <div id="rule"></div>
      <div class="card" id="list" style="margin-top:12px"></div>`;
    const draw = () => {
      const f = FAMILIES.find((x) => x.id === fam);
      pane.querySelector("#rule").innerHTML = f ? `<div class="card recess small" style="margin-top:12px">${esc(f.rule)}</div>` : "";
      const ql = q.toLowerCase();
      const items = S.errors.filter((e) => (fam === "all" || e.f === fam) && (!ql || (e.w + e.r + e.y).toLowerCase().includes(ql))).slice().reverse();
      pane.querySelector("#list").innerHTML = items.length ? items.slice(0, 150).map((e) => `
        <div class="fix">
          <div class="row" style="justify-content:space-between;align-items:flex-start"><div class="grow"><span class="wrong">${esc(e.w)}</span> → <span class="right">${esc(e.r)}</span></div>
          <span class="tag">${SRC[e.src] || e.src}</span></div>
          ${e.y ? `<p class="why">${esc(e.y)}</p>` : ""}
          <p class="tiny muted" style="margin-top:2px">${fam === "all" ? esc(famName(e.f)) + " · " : ""}${e.src === "bilan" ? "avant l'app" : relDate(e.date)}</p>
        </div>`).join("") : `<p class="muted small">Rien ici.</p>`;
    };
    pane.querySelector("#q").addEventListener("input", (e) => { q = e.target.value; draw(); });
    pane.querySelectorAll("[data-f]").forEach((c) => c.addEventListener("click", () => {
      fam = c.dataset.f; pane.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === c)); draw();
    }));
    draw();
  }

  function mots() {
    pane.innerHTML = `
      <input class="input" id="q" type="search" placeholder="Chercher un mot…">
      <details class="fold" style="margin-top:12px"><summary>Ajouter un mot ou une expression</summary>
        <div class="stack">
          <input class="input" id="nm" placeholder="Le mot ou l'expression">
          <input class="input" id="ns" placeholder="Le sens, avec tes mots">
          <input class="input" id="ne" placeholder="Un exemple (facultatif)">
          <button class="btn btn-primary btn-block" id="add">Ajouter au carnet</button>
        </div></details>
      <div class="card" id="list" style="margin-top:12px"></div>`;
    const draw = () => {
      const ql = q.toLowerCase();
      const items = S.vocab.filter((v) => !ql || (v.m + v.s + v.e).toLowerCase().includes(ql));
      pane.querySelector("#list").innerHTML = items.length ? items.map((v) => `
        <div class="fix">
          <div class="row between" style="align-items:flex-start"><b style="font-weight:600;font-size:17px" class="grow">${esc(v.m)}</b>
            <button class="icon-btn" style="width:32px;height:32px" data-say="${v.id}" aria-label="Écouter">${icons.speaker}</button></div>
          <p class="small" style="color:var(--ink-2)">${esc(v.s)}</p>
          ${v.e ? `<p class="small muted" style="margin-top:4px;font-style:italic">${esc(v.e)}</p>` : ""}
          <div class="row between" style="margin-top:4px"><span class="tiny muted">${esc(v.c || "")}${v.box ? ` · su ${v.box} fois` : ""}</span>
          <button class="link tiny" data-del="${v.id}" style="color:var(--muted)">Retirer</button></div>
        </div>`).join("") : `<p class="muted small">Rien ici.</p>`;
      pane.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => { const v = S.vocab.find((x) => x.id === b.dataset.say); speak(v.m + ". " + (v.e || ""), { rate: 0.95 }); }));
      pane.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { S.vocab = S.vocab.filter((x) => x.id !== b.dataset.del); save(); draw(); toast("Mot retiré."); }));
    };
    pane.querySelector("#q").addEventListener("input", (e) => { q = e.target.value; draw(); });
    pane.querySelector("#add").addEventListener("click", () => {
      const m = pane.querySelector("#nm").value.trim();
      if (!m) return;
      const ok = addVocab({ m, s: pane.querySelector("#ns").value.trim(), e: pane.querySelector("#ne").value.trim(), c: "ajouté" });
      toast(ok ? "Ajouté au carnet." : "Ce mot est déjà dans ton carnet.");
      ["#nm", "#ns", "#ne"].forEach((s) => (pane.querySelector(s).value = ""));
      draw();
    });
    draw();
  }

  function reviser() {
    let deckKind = "mots";
    const build = () => {
      if (deckKind === "mots") {
        return [...S.vocab].sort((a, b) => (a.box || 0) - (b.box || 0) || Math.random() - 0.5).slice(0, 10)
          .map((v) => ({ id: v.id, front: v.m, back: v.s, ex: v.e, kind: "mots" }));
      }
      return [...S.errors].sort(() => Math.random() - 0.5).slice(0, 10)
        .map((e) => ({ id: e.id, front: e.w, back: e.r, ex: e.y, kind: "fautes" }));
    };
    let deck = build(), i = 0, flipped = false, known = 0;
    const draw = () => {
      if (i >= deck.length) {
        pane.innerHTML = `<div class="card empty"><h2 style="color:var(--ink)">${known} / ${deck.length}</h2><p style="margin-top:6px">${known === deck.length ? "Tout est su. Bravo." : "Les cartes ratées reviendront en premier."}</p>
          <button class="btn btn-primary" id="again" style="margin-top:16px">Encore 10 cartes</button></div>`;
        pane.querySelector("#again").addEventListener("click", () => { deck = build(); i = 0; known = 0; draw(); });
        return;
      }
      const c = deck[i];
      pane.innerHTML = `
        <div class="chips wrap"><button class="chip ${deckKind === "mots" ? "on" : ""}" data-k="mots">Mots</button><button class="chip ${deckKind === "fautes" ? "on" : ""}" data-k="fautes">Fautes à corriger</button></div>
        <p class="small muted" style="margin-top:14px">Carte ${i + 1} sur ${deck.length}</p>
        <div class="card flash" id="card" style="margin-top:8px">
          <div>
            <p class="label">${c.kind === "mots" ? "Que veut dire…" : "Comment corriger…"}</p>
            <p class="front" style="margin-top:10px;${c.kind === "fautes" ? "color:var(--warn);font-size:21px" : ""}">${esc(c.front)}</p>
            ${flipped ? `<hr class="divider"><p style="font-size:18px;font-weight:500;color:${c.kind === "fautes" ? "var(--ok)" : "var(--ink)"}">${esc(c.back)}</p>${c.ex ? `<p class="small muted" style="margin-top:8px">${esc(c.ex)}</p>` : ""}`
              : `<p class="tiny muted" style="margin-top:18px">Touche pour voir la réponse</p>`}
          </div>
        </div>
        ${flipped ? `<div class="btn-row" style="margin-top:14px"><button class="btn btn-secondary" id="no">À revoir</button><button class="btn btn-primary" id="yes">Je savais</button></div>` : ""}`;
      pane.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { deckKind = b.dataset.k; deck = build(); i = 0; known = 0; flipped = false; draw(); }));
      pane.querySelector("#card").addEventListener("click", () => { if (!flipped) { flipped = true; draw(); } });
      const answer = (ok) => {
        if (c.kind === "mots") { const v = S.vocab.find((x) => x.id === c.id); if (v) { v.box = ok ? (v.box || 0) + 1 : 0; save(); } }
        if (ok) known++;
        i++; flipped = false; draw();
      };
      pane.querySelector("#yes")?.addEventListener("click", () => answer(true));
      pane.querySelector("#no")?.addEventListener("click", () => answer(false));
    };
    draw();
  }

  setTab(tab);
}
