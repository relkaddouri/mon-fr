import { S, SKILLS, skillScore, cefr, doneToday, streak, minutesThisWeek, minutesOn, today, weeklyFocus } from "../store.js";
import { esc, icons } from "../ui.js";
import { getConfig } from "../api.js";

export async function render(root) {
  const h = new Date().getHours();
  const hello = h < 5 ? "Bonsoir" : h < 18 ? "Bonjour" : "Bonsoir";
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const focus = weeklyFocus();
  const focusEx = S.errors.filter((e) => e.f === focus.id).slice(-2);
  const minToday = minutesOn(today());
  const goal = S.settings.goalMin || 15;

  const steps = [
    { k: "ecoute", href: "#/ecouter", t: "Écouter", d: "Une écoute courte, puis des questions", min: 5 },
    { k: "oral", href: "#/parler", t: "Parler", d: "Deux minutes sur un sujet", min: 5 },
    { k: "ecrit", href: "#/ecrire", t: "Écrire", d: "Un texte court, corrigé", min: 5 },
  ];
  const done = steps.filter((s) => doneToday(s.k)).length;

  const skillRow = (k) => {
    const sc = skillScore(k);
    const lv = cefr(sc);
    return `<div class="skill">
      <span class="skill-name">${SKILLS[k].name}</span>
      <div class="bar" style="--c:${SKILLS[k].color}"><i data-w="${sc ?? 0}"></i></div>
      ${lv ? `<span class="cefr">${lv}</span>` : `<span class="cefr pending">À tester</span>`}
    </div>`;
  };

  root.innerHTML = `
    <section class="hero">
      <div class="orb" aria-hidden="true"></div>
      <p class="label">${esc(dateLabel)}</p>
      <h1 style="margin-top:8px">${hello} Rachid.</h1>
      <p>${done === 3 ? "Ta séance du jour est faite. Le reste est du bonus." : done ? `Encore ${3 - done} étape${3 - done > 1 ? "s" : ""} et ta séance du jour est faite.` : "Quinze minutes aujourd'hui valent mieux qu'une heure dimanche."}</p>
    </section>

    <div id="notices"></div>

    <div class="home-grid">
      <div>
    <section class="section">
      <div class="section-head"><h2>Séance du jour</h2><span class="small muted num">${minToday} / ${goal} min</span></div>
      <div class="steps">
        ${steps.map((s, i) => `
          <a class="step ${doneToday(s.k) ? "done" : ""}" href="${s.href}">
            <span class="dot">${doneToday(s.k) ? "✓" : i + 1}</span>
            <span class="grow"><span class="step-title">${s.t}</span><br><span class="small muted">${s.d} · ${s.min} min</span></span>
            ${icons.chev}
          </a>`).join("")}
      </div>
    </section>

    <section class="section">
      <div class="card accent">
        <p class="label">Focus de la semaine</p>
        <h3 style="margin-top:6px">${esc(focus.name)}</h3>
        <p class="small" style="margin-top:6px;color:var(--ink-2)">${esc(focus.rule)}</p>
        ${focusEx.length ? `<div style="margin-top:12px" class="small">${focusEx.map((e) => `<p style="margin-top:4px"><span class="wrong">${esc(e.w)}</span> → <span style="color:var(--ok);font-weight:500">${esc(e.r)}</span></p>`).join("")}</div>` : ""}
        <a class="btn btn-primary btn-block" style="margin-top:16px" href="#/ecrire?mode=exercice&f=${focus.id}">M'entraîner sur ce point</a>
      </div>
    </section>

      </div>
      <div>
    <section class="section">
      <a class="card card-link" href="#/progres">
        <div class="row between"><span class="label">Mon niveau</span><span class="small" style="color:var(--accent);font-weight:500">Détails</span></div>
        <div style="margin-top:6px">${["ecoute", "ecrit", "oral"].map(skillRow).join("")}</div>
      </a>
    </section>

    <section class="section">
      <div class="stats">
        <div class="stat"><div class="num">${streak()}</div><div class="tiny">jour${streak() > 1 ? "s" : ""} d'affilée</div></div>
        <div class="stat"><div class="num">${minutesThisWeek()}</div><div class="tiny">min cette semaine</div></div>
        <div class="stat"><div class="num">${S.vocab.length}</div><div class="tiny">mots au carnet</div></div>
      </div>
    </section>

    <section class="section">
      <div class="card">
        <a class="list-item" href="#/carnet"><span class="grow"><b style="font-weight:500">Mon carnet</b><br><span class="small muted">${S.errors.length} fautes corrigées, ${S.vocab.length} mots et expressions</span></span>${icons.chev}</a>
        <a class="list-item" href="#/coach"><span class="grow"><b style="font-weight:500">Discuter avec le coach</b><br><span class="small muted">À l'écrit ou à la voix, sur le sujet de ton choix</span></span>${icons.chev}</a>
      </div>
    </section>
      </div>
    </div>
  `;

  requestAnimationFrame(() => root.querySelectorAll(".bar > i").forEach((i) => (i.style.width = i.dataset.w + "%")));

  // Avis : installation sur iPhone, configuration du serveur.
  const notices = root.querySelector("#notices");
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  let html = "";
  if (isIOS && !standalone) {
    html += `<div class="banner" style="margin-top:20px"><div><b>Installe l'app.</b> Dans Safari, touche Partager, puis « Sur l'écran d'accueil ».</div></div>`;
  }
  const cfg = await getConfig();
  if (cfg.missing) html += `<div class="banner warn" style="margin-top:12px"><div><b>Le serveur de l'app n'est pas installé.</b> L'hébergeur n'a pas déployé la partie serveur. Déploie depuis GitHub (voir le guide), puis recharge.</div></div>`;
  else if (!cfg.offline) {
    if (!cfg.ai) html += `<div class="banner warn" style="margin-top:12px"><div><b>L'IA n'est pas branchée.</b> Ajoute DEEPSEEK_API_KEY dans les variables Vercel, puis redéploie.</div></div>`;
    else if (cfg.needsCode && !S.settings.code) html += `<div class="banner" style="margin-top:12px"><div class="grow"><b>Code d'accès.</b> Entre ton code une fois pour activer l'IA. <a href="#/reglages">Ouvrir les réglages</a></div></div>`;
    if (cfg.ai && !cfg.transcribe) html += `<div class="banner" style="margin-top:12px"><div><b>Transcription de la voix.</b> Pour qu'elle marche partout, ajoute une clé GROQ_API_KEY (gratuite) dans les variables Vercel. <a href="#/reglages">Tester la connexion</a></div></div>`;
  }
  notices.innerHTML = html;
}
