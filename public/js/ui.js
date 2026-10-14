// Petits outils d'interface partagés par les écrans.
import { famName, SKILLS } from "./store.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

export const icons = {
  chev: `<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`,
  mic: `<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  stop: `<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></svg>`,
  send: `<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>`,
  prev: `<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
};

export function ring(score, color = "var(--accent)") {
  const p = Math.max(0, Math.min(100, score || 0));
  return `<div class="ring" style="--p:${p};--c:${color}"><div>${score ?? "–"}</div></div>`;
}

export function loading(text) {
  return `<div class="loading"><span class="spinner"></span><span>${esc(text)}</span></div>`;
}

export function errorBox(err, retryId) {
  return `<div class="banner warn fade-in"><div class="grow"><b>Oups.</b> ${esc(err?.message || "Une erreur est survenue.")}${retryId ? ` <button class="link" id="${retryId}">Réessayer</button>` : ""}</div></div>`;
}

export function fixList(list) {
  if (!list?.length) return `<p class="muted small">Aucune faute relevée. Bravo.</p>`;
  return list.map((e) => `
    <div class="fix">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div class="grow"><span class="wrong">${esc(e.w)}</span> → <span class="right">${esc(e.r)}</span></div>
        ${e.f ? `<span class="tag">${esc(famName(e.f))}</span>` : ""}
      </div>
      ${e.y ? `<p class="why">${esc(e.y)}</p>` : ""}
    </div>`).join("");
}

// ---------- Différence mot à mot ----------
const norm = (w) => w.toLowerCase().replace(/[.,;:!?«»"“”()…]/g, "").replace(/’/g, "'");
export function tokenize(t) { return String(t || "").trim().split(/\s+/).filter(Boolean); }

export function diffWords(a, b) {
  const A = tokenize(a), B = tokenize(b);
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = norm(A[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) { out.push({ t: "=", w: B[j] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: "-", w: A[i] }); i++; }
    else { out.push({ t: "+", w: B[j] }); j++; }
  }
  while (i < n) out.push({ t: "-", w: A[i++] });
  while (j < m) out.push({ t: "+", w: B[j++] });
  // Partie du texte de référence réellement couverte (utile pour une dictée partielle).
  let cut = out.length;
  while (cut > 0 && out[cut - 1].t === "+") cut--;
  const covered = out.slice(0, cut).filter((o) => o.t !== "-").length;
  const rest = out.slice(cut).map((o) => o.w).join(" ");
  return { ops: out, same: dp[0][0], total: m, covered, typed: n, head: out.slice(0, cut), rest };
}

export function diffHTML(original, corrected) {
  return diffWords(original, corrected).ops.map((o) =>
    o.t === "=" ? esc(o.w) : o.t === "+" ? `<ins>${esc(o.w)}</ins>` : `<del>${esc(o.w)}</del>`
  ).join(" ");
}

// ---------- Graphique des niveaux ----------
export function lineChart(seriesMap, { days = 30, height = 170 } = {}) {
  const W = 340, H = height, L = 28, R = 10, T = 10, B = 22;
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = new Date(end); start.setDate(end.getDate() - (days - 1)); start.setHours(0,0,0,0);
  const x = (d) => L + ((d - start) / (864e5 * Math.max(1, days - 1))) * (W - L - R);
  const y = (v) => T + (1 - (v - 30) / 70) * (H - T - B);
  let g = "";
  for (const v of [40, 60, 80, 100]) {
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E3DC" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`;
  }
  const fmt = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  g += `<text x="${L}" y="${H - 4}">${fmt(start)}</text><text x="${W - R}" y="${H - 4}" text-anchor="end">Aujourd'hui</text>`;
  for (const [k, pts] of Object.entries(seriesMap)) {
    if (!pts.length) continue;
    const c = SKILLS[k].hex;
    const P = pts.map((p) => [x(Math.max(start, p.d)), y(Math.max(30, Math.min(100, p.v)))]);
    if (P.length > 1) g += `<polyline fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${P.map((p) => p.join(",")).join(" ")}"/>`;
    P.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === P.length - 1 ? 4 : 2.6}" fill="${i === P.length - 1 ? c : "#FEFDFB"}" stroke="${c}" stroke-width="2"/>`; });
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution des scores sur ${days} jours">${g}</svg>`;
}

export function weekBars(values, labels) {
  const W = 340, H = 120, B = 20, T = 14;
  const max = Math.max(15, ...values);
  const bw = Math.min(34, (W / values.length) * 0.56);
  let g = "";
  values.forEach((v, i) => {
    const cx = (i + 0.5) * (W / values.length);
    const h = (v / max) * (H - B - T);
    const last = i === values.length - 1;
    g += `<rect x="${cx - bw / 2}" y="${H - B - h}" width="${bw}" height="${Math.max(h, v ? 2 : 0)}" rx="4" fill="${last ? "#4B4E9E" : "#C8C2E9"}"/>`;
    if (v) g += `<text x="${cx}" y="${H - B - h - 4}" text-anchor="middle" style="fill:#45423D">${v}</text>`;
    g += `<text x="${cx}" y="${H - 5}" text-anchor="middle">${labels[i]}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutes par semaine">${g}</svg>`;
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function relDate(iso) {
  const d = new Date(iso), now = new Date();
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
