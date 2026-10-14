// Appels au serveur : Claude (en flux) et la transcription de la voix.
import { S } from "./store.js";

export class ApiError extends Error {
  constructor(kind, message, detail) { super(message); this.kind = kind; this.detail = detail; }
}

const NOT_DEPLOYED = "Le serveur de l'app ne répond pas. Déploie l'app depuis GitHub (Vercel ou Netlify) : le glisser-déposer n'installe pas la partie serveur.";

let cfg = null;
export async function getConfig(force) {
  if (cfg && !force) return cfg;
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    const isJSON = (r.headers.get("content-type") || "").includes("json");
    if (r.ok && isJSON) cfg = await r.json();
    else cfg = { ok: false, ai: false, transcribe: false, needsCode: false, missing: true };
  } catch {
    cfg = { ok: false, ai: false, transcribe: false, needsCode: false, offline: true };
  }
  return cfg;
}

function headers(extra = {}) {
  return { "x-app-code": S.settings.code || "", ...extra };
}

async function failure(res) {
  const isJSON = (res.headers.get("content-type") || "").includes("json");
  if (!isJSON) {
    if (res.status === 404 || res.status === 405) return new ApiError("not_deployed", NOT_DEPLOYED);
    if (res.status === 413) return new ApiError("too_big", "Enregistrement trop long. Reste sous 3 minutes.");
    if (res.status === 504) return new ApiError("timeout", "Le serveur a mis trop de temps. Réessaie.");
    return new ApiError("server", `Le serveur a répondu avec une erreur (${res.status}). Réessaie dans un instant.`);
  }
  let data = {};
  try { data = await res.json(); } catch {}
  return new ApiError(data.error || "server", data.message || `Erreur du serveur (${res.status}).`, data.detail);
}

async function post(url, init) {
  try {
    return await fetch(url, { method: "POST", ...init });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError("network", navigator.onLine === false ? "Tu es hors ligne. Vérifie ta connexion." : "Impossible de joindre le serveur. Vérifie ta connexion.");
  }
}

// Envoie une conversation à Claude et reçoit la réponse au fil de l'eau.
export async function claude({ system, messages, max_tokens = 1500, onText, signal }) {
  const res = await post("/api/claude", {
    headers: headers({ "content-type": "application/json" }),
    body: JSON.stringify({ system, messages, max_tokens }),
    signal,
  });
  if (!res.ok) throw await failure(res);
  if (!(res.headers.get("content-type") || "").includes("event-stream")) throw new ApiError("not_deployed", NOT_DEPLOYED);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", finished = false, stop = "";
  const handle = (chunk) => {
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d) continue;
      let ev;
      try { ev = JSON.parse(d); } catch { continue; }
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
        text += ev.delta.text;
        onText && onText(text);
      } else if (ev.type === "message_delta") {
        stop = ev.delta?.stop_reason || stop;
      } else if (ev.type === "message_stop") {
        finished = true;
      } else if (ev.type === "error") {
        const t = ev.error?.type;
        throw new ApiError(t === "overloaded_error" ? "overloaded" : "server",
          t === "overloaded_error" ? "L'IA est très sollicitée en ce moment. Réessaie dans quelques secondes." : "L'IA s'est arrêtée en cours de route. Réessaie.");
      }
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf = (buf + dec.decode(value, { stream: true })).replace(/\r/g, "");
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      handle(chunk);
    }
  }
  if (buf.trim()) handle(buf);
  if (!finished && !text) throw new ApiError("cut", "La réponse a été coupée. Réessaie.");
  if (!finished) throw new ApiError("cut", "La réponse a été coupée avant la fin. Réessaie.");
  return text;
}

export function parseJSON(text) {
  const clean = String(text).replace(/```(?:json)?/g, "");
  const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
  if (s < 0 || e <= s) throw new ApiError("format", "Réponse inattendue de l'IA. Réessaie.");
  const raw = clean.slice(s, e + 1);
  try { return JSON.parse(raw); } catch {}
  // Petites réparations : virgules en trop, guillemets typographiques autour des clés.
  try { return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")); } catch {}
  throw new ApiError("format", "Réponse inattendue de l'IA. Réessaie.");
}

export async function claudeJSON({ system, prompt, max_tokens = 2000, signal }) {
  const text = await claude({ system, messages: [{ role: "user", content: prompt }], max_tokens, signal });
  return parseJSON(text);
}

export async function transcribe(blob) {
  if (!blob || !blob.size) throw new ApiError("no_audio", "L'enregistrement est vide.");
  const res = await post("/api/transcribe", {
    headers: headers({ "content-type": (blob.type || "audio/mp4").split(";")[0] }),
    body: blob,
  });
  if (!res.ok) throw await failure(res);
  const data = await res.json();
  return (data.text || "").trim();
}

// Test complet de la connexion, pour l'écran Réglages.
export async function diagnose() {
  const out = { server: null, claude: null, transcribe: null };
  const c = await getConfig(true);
  out.config = c;
  if (c.offline) { out.server = { ok: false, msg: "Hors ligne." }; return out; }
  if (c.missing) { out.server = { ok: false, msg: NOT_DEPLOYED }; return out; }
  out.server = { ok: true, msg: "Le serveur répond." };
  try {
    const t0 = performance.now();
    const res = await post("/api/claude", {
      headers: headers({ "content-type": "application/json" }),
      body: JSON.stringify({ messages: [{ role: "user", content: "Réponds seulement : OK" }], max_tokens: 10 }),
    });
    if (!res.ok) throw await failure(res);
    const model = res.headers.get("x-model") || "";
    const prov = res.headers.get("x-provider") || "L'IA";
    const reader = res.body.getReader(); while (!(await reader.read()).done) {}
    out.claude = { ok: true, msg: `${prov} répond (${model}, ${Math.round(performance.now() - t0)} ms).` };
  } catch (e) { out.claude = { ok: false, msg: e.message, detail: e.detail }; }
  out.transcribe = c.transcribe
    ? { ok: true, msg: `Transcription active (${c.transcribeProvider === "groq" ? "Groq" : "OpenAI"}).` }
    : { ok: false, msg: "Transcription non configurée : ajoute GROQ_API_KEY (gratuit) dans les variables Vercel." };
  return out;
}
