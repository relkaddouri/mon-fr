// Outils partagés par les fonctions « edge » (Deno sur Netlify, Node pour les tests).

export function env(name) {
  try { if (globalThis.Netlify?.env) return globalThis.Netlify.env.get(name) || ""; } catch {}
  try { return globalThis.process?.env?.[name] || ""; } catch {}
  return "";
}

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Erreur lisible par l'app : un code court + un message en français simple.
export const fail = (code, message, status = 500, detail) => json({ error: code, message, detail }, status);

export function checkCode(req) {
  const code = env("APP_CODE");
  if (!code) return null;
  if ((req.headers.get("x-app-code") || "").trim() === code.trim()) return null;
  return fail("code", "Le code d'accès est faux. Vérifie-le dans les réglages de l'app.", 401);
}

// Fournisseur d'IA : DeepSeek (via son API compatible Anthropic) si DEEPSEEK_API_KEY existe, sinon Claude.
export function aiProvider() {
  const ds = env("DEEPSEEK_API_KEY").trim();
  if (ds) return {
    name: "deepseek", label: "DeepSeek", key: ds, keyName: "DEEPSEEK_API_KEY", console: "platform.deepseek.com",
    url: env("DEEPSEEK_API_URL") || "https://api.deepseek.com/anthropic",
    model: env("DEEPSEEK_MODEL").trim() || "deepseek-flash",
  };
  const an = env("ANTHROPIC_API_KEY").trim();
  if (an) return {
    name: "anthropic", label: "Claude", key: an, keyName: "ANTHROPIC_API_KEY", console: "console.anthropic.com",
    url: env("ANTHROPIC_API_URL") || "https://api.anthropic.com",
    model: env("CLAUDE_MODEL").trim() || "",
  };
  return null;
}

// Traduit une erreur de l'API Anthropic en message clair.
export function explainAnthropic(status, text, p = { keyName: "ANTHROPIC_API_KEY", console: "console.anthropic.com" }) {
  let type = "", msg = "";
  try { const d = JSON.parse(text); type = d?.error?.type || ""; msg = d?.error?.message || ""; } catch { msg = text || ""; }
  const low = msg.toLowerCase();
  if (status === 401 || type === "authentication_error")
    return ["key", `La clé ${p.keyName} est refusée. Recopie-la dans les variables de l'hébergeur, sans espace, puis redéploie.`];
  if (status === 402 || low.includes("credit balance") || low.includes("billing") || low.includes("insufficient balance"))
    return ["credit", `Ton compte n'a plus de solde. Recharge-le sur ${p.console}.`];
  if (status === 403 || type === "permission_error")
    return ["key", `Cette clé n'a pas le droit d'utiliser l'API. Vérifie ton compte sur ${p.console}.`];
  if (status === 404 || type === "not_found_error" || (low.includes("model") && status === 400))
    return ["model", "Le modèle demandé n'existe pas pour ce compte."];
  if (status === 429 || type === "rate_limit_error")
    return ["rate", "Trop de demandes en même temps. Attends une minute et réessaie."];
  if (status === 529 || type === "overloaded_error")
    return ["overloaded", "L'IA est très sollicitée en ce moment. Réessaie dans quelques secondes."];
  return ["upstream", "L'IA a renvoyé une erreur inattendue."];
}
