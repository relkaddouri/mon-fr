// Données de l'app : localStorage pour l'état, IndexedDB pour les enregistrements audio.
import { SEED } from "/seed.js";

const KEY = "monfrancais.v1";
const START = "2026-10-14";

export const FAMILIES = SEED.families;
export const famName = (id) => (FAMILIES.find((f) => f.id === id) || { name: "Autre" }).name;

// Ordre des priorités du bilan : le s avec tu, la négation, les pronoms, le genre, qui/que/dont…
const FOCUS_ORDER = ["conjugaison", "negation", "pronoms", "genre", "relatifs", "prepositions", "tournures", "orthographe", "anglicismes"];

function fresh() {
  return {
    v: 1,
    createdAt: new Date().toISOString().slice(0, 10),
    settings: { code: "", rate: 1, voiceURI: "", goalMin: 15 },
    // Point de départ : le bilan fait à partir de nos conversations.
    baseline: { ecoute: 82, ecrit: 58, oral: null },
    sessions: [],
    errors: SEED.errors.map((e, i) => ({ ...e, id: "s" + i, src: "bilan", date: "2026-09-30" })),
    vocab: SEED.vocab.map((v, i) => ({ ...v, id: "v" + i, date: "2026-09-30", box: 0 })),
    chats: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {}
  return fresh();
}

export const S = load();
const listeners = new Set();
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn("save", e); }
  listeners.forEach((fn) => fn());
}
export const onChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const today = () => new Date().toISOString().slice(0, 10);

// ---------- Niveaux ----------
export const SKILLS = {
  ecoute: { name: "Écoute", color: "var(--c-ecoute)", hex: "#4B4E9E" },
  ecrit: { name: "Écrit", color: "var(--c-ecrit)", hex: "#2F6B66" },
  oral: { name: "Oral", color: "var(--c-oral)", hex: "#A8562F" },
};

export function cefr(score) {
  if (score == null) return null;
  if (score < 35) return "B1";
  if (score < 50) return "B1+";
  if (score < 62) return "B2";
  if (score < 74) return "B2+";
  if (score < 86) return "C1";
  if (score < 94) return "C1+";
  return "C2";
}

export function skillScore(skill) {
  const list = S.sessions.filter((s) => s.skill === skill && typeof s.score === "number");
  if (!list.length) return S.baseline[skill];
  const last = list.slice(-5).map((s) => s.score);
  return Math.round(last.reduce((a, b) => a + b, 0) / last.length);
}

export function addSession(sess) {
  const s = { id: uid(), date: new Date().toISOString(), minutes: 1, ...sess };
  S.sessions.push(s);
  save();
  return s;
}

export function addErrors(list, src) {
  const date = today();
  let n = 0;
  for (const e of list || []) {
    if (!e || !e.w || !e.r) continue;
    const fam = FAMILIES.some((f) => f.id === e.f) ? e.f : "tournures";
    S.errors.push({ id: uid(), f: fam, w: e.w, r: e.r, y: e.y || "", src, date });
    n++;
  }
  if (n) save();
  return n;
}

export function addVocab(item) {
  if (!item?.m) return false;
  if (S.vocab.some((v) => v.m.toLowerCase() === item.m.toLowerCase())) return false;
  S.vocab.unshift({ id: uid(), m: item.m, s: item.s || "", e: item.e || "", c: item.c || "découvert", date: today(), box: 0 });
  save();
  return true;
}

// ---------- Rythme ----------
export function minutesOn(dateStr) {
  return S.sessions.filter((s) => s.date.slice(0, 10) === dateStr).reduce((a, s) => a + (s.minutes || 0), 0);
}
export function doneToday(skill) {
  const d = today();
  return S.sessions.some((s) => s.skill === skill && s.date.slice(0, 10) === d);
}
export function streak() {
  const days = new Set(S.sessions.map((s) => s.date.slice(0, 10)));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function minutesThisWeek() {
  const now = new Date();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return S.sessions.filter((s) => new Date(s.date) >= monday).reduce((a, s) => a + (s.minutes || 0), 0);
}

export function weeklyFocus() {
  const start = new Date(S.createdAt || START);
  const week = Math.max(0, Math.floor((Date.now() - start.getTime()) / (7 * 864e5)));
  const id = FOCUS_ORDER[week % FOCUS_ORDER.length];
  return FAMILIES.find((f) => f.id === id);
}

// ---------- Sauvegarde ----------
export function exportData() {
  return JSON.stringify({ ...S, exportedAt: new Date().toISOString() }, null, 1);
}
export function importData(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.sessions)) throw new Error("Fichier non reconnu");
  Object.keys(S).forEach((k) => delete S[k]);
  Object.assign(S, fresh(), data);
  save();
}
export function resetAll() {
  localStorage.removeItem(KEY);
  location.reload();
}

// ---------- IndexedDB pour l'audio ----------
let dbp;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open("monfrancais-audio", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("rec");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
export async function putAudio(id, blob) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction("rec", "readwrite");
    tx.objectStore("rec").put(blob, id);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
export async function getAudio(id) {
  const d = await db();
  return new Promise((res) => {
    const r = d.transaction("rec").objectStore("rec").get(id);
    r.onsuccess = () => res(r.result || null); r.onerror = () => res(null);
  });
}
export async function deleteAudio(id) {
  const d = await db();
  d.transaction("rec", "readwrite").objectStore("rec").delete(id);
}
