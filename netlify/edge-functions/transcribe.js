// Transcription de la voix avec Whisper.
// GROQ_API_KEY (gratuit, rapide, conseillé) ou OPENAI_API_KEY.
// Claude ne lit pas l'audio : c'est cette étape qui transforme ta voix en texte.
import { env, fail, json, checkCode } from "./lib/common.js";

const MAX = 20 * 1024 * 1024;

function provider() {
  const groq = env("GROQ_API_KEY").trim();
  if (groq) return {
    name: "groq", key: groq,
    url: (env("GROQ_API_URL") || "https://api.groq.com/openai") + "/v1/audio/transcriptions",
    model: env("TRANSCRIBE_MODEL") || "whisper-large-v3",
  };
  const openai = env("OPENAI_API_KEY").trim();
  if (openai) return {
    name: "openai", key: openai,
    url: (env("OPENAI_API_URL") || "https://api.openai.com") + "/v1/audio/transcriptions",
    model: env("TRANSCRIBE_MODEL") || "whisper-1",
  };
  return null;
}

export default async (req) => {
  if (req.method !== "POST") return fail("method", "Méthode non autorisée.", 405);
  const denied = checkCode(req);
  if (denied) return denied;

  const p = provider();
  if (!p) return fail("no_transcription", "La transcription n'est pas configurée. Ajoute GROQ_API_KEY sur Netlify (gratuit).", 501);

  const type = (req.headers.get("content-type") || "audio/mp4").split(";")[0];
  const buf = await req.arrayBuffer();
  if (!buf.byteLength) return fail("no_audio", "Enregistrement vide.", 400);
  if (buf.byteLength > MAX) return fail("too_big", "Enregistrement trop long. Reste sous 5 minutes.", 413);

  const ext = type.includes("webm") ? "webm" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mpeg") ? "mp3" : "m4a";
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type }), "voix." + ext);
  fd.append("model", p.model);
  fd.append("language", "fr");
  fd.append("response_format", "json");
  // Cette invite aide Whisper à garder les « euh », utiles pour mesurer la fluidité.
  fd.append("prompt", "Euh… alors, hum, je pense que… ben, en fait, euh, voilà.");

  let r;
  try {
    r = await fetch(p.url, { method: "POST", headers: { Authorization: "Bearer " + p.key }, body: fd });
  } catch {
    return fail("network", "Le service de transcription ne répond pas.", 502);
  }
  if (!r.ok) {
    const text = await r.text();
    if (r.status === 401) return fail("key", `La clé ${p.name === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY"} est refusée.`, 502, text.slice(0, 300));
    if (r.status === 429) return fail("rate", "Limite de transcription atteinte. Attends une minute.", 502, text.slice(0, 300));
    return fail("upstream", "La transcription a échoué.", 502, text.slice(0, 300));
  }
  const data = await r.json();
  return json({ text: (data.text || "").trim(), provider: p.name });
};

export const config = { path: "/api/transcribe" };
