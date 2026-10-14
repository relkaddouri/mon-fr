// Relais vers l'IA (DeepSeek ou Claude), réponse au fil de l'eau.
// Netlify : edge function (pas de limite de 10 s). Vercel : fonction Node (jusqu'à 5 min).
import { fail, checkCode, aiProvider, explainAnthropic } from "./lib/common.js";

let autoModel = null;

// Claude : choisit le Sonnet le plus récent du compte si aucun modèle n'est imposé.
async function findModel(p) {
  if (autoModel) return autoModel;
  try {
    const r = await fetch(p.url + "/v1/models?limit=100", { headers: { "x-api-key": p.key, "anthropic-version": "2023-06-01" } });
    if (r.ok) {
      const ids = ((await r.json()).data || []).map((m) => m.id);
      autoModel = ids.find((i) => /sonnet/i.test(i)) || ids.find((i) => /opus/i.test(i)) || ids[0] || null;
    }
  } catch {}
  return autoModel || "claude-sonnet-5-5";
}

function call(p, model, payload) {
  return fetch(p.url + "/v1/messages", {
    method: "POST",
    headers: { "x-api-key": p.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ ...payload, model, stream: true }),
  });
}

export default async (req) => {
  if (req.method !== "POST") return fail("method", "Méthode non autorisée.", 405);
  const denied = checkCode(req);
  if (denied) return denied;

  const p = aiProvider();
  if (!p) return fail("no_key", "Aucune clé d'IA configurée. Ajoute DEEPSEEK_API_KEY dans les variables de l'hébergeur, puis redéploie.", 500);

  let body;
  try { body = await req.json(); } catch { return fail("bad_json", "Requête illisible.", 400); }
  const { system, messages, max_tokens = 1500 } = body || {};
  if (!Array.isArray(messages) || !messages.length) return fail("no_messages", "Message vide.", 400);

  const payload = {
    max_tokens: Math.min(Number(max_tokens) || 1500, 4000),
    messages: messages.slice(-40),
    ...(typeof system === "string" && system ? { system } : {}),
  };

  let model = p.model || (await findModel(p));
  let res = await call(p, model, payload);

  if (!res.ok && (res.status === 404 || res.status === 400) && p.name === "anthropic") {
    const text = await res.text();
    const [code, msg] = explainAnthropic(res.status, text, p);
    if (code !== "model") return fail(code, msg, 502, text.slice(0, 300));
    autoModel = null;
    const fallback = await findModel(p);
    if (!fallback || fallback === model) return fail("model", `Le modèle « ${model} » n'existe pas pour ce compte.`, 502, text.slice(0, 300));
    model = fallback;
    res = await call(p, model, payload);
  }

  if (!res.ok && (res.status === 529 || res.status === 503)) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await call(p, model, payload);
  }

  if (!res.ok) {
    const text = await res.text();
    const [c, m] = explainAnthropic(res.status, text, p);
    return fail(c, m, 502, text.slice(0, 300));
  }

  return new Response(res.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-model": model,
      "x-provider": p.label,
    },
  });
};

export const config = { path: "/api/claude" };
