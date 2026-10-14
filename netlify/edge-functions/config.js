// Dit à l'app ce qui est configuré, sans jamais montrer les clés.
import { env, json, aiProvider } from "./lib/common.js";

export default async () =>
  json({
    ok: true,
    ai: !!aiProvider(),
    provider: aiProvider()?.label || null,
    transcribe: !!(env("GROQ_API_KEY").trim() || env("OPENAI_API_KEY").trim()),
    transcribeProvider: env("GROQ_API_KEY").trim() ? "groq" : env("OPENAI_API_KEY").trim() ? "openai" : null,
    needsCode: !!env("APP_CODE").trim(),
    model: aiProvider()?.model || "auto",
  });

export const config = { path: "/api/config" };
