// Version Vercel : même code que la fonction Netlify, branché sur /api/transcribe.
import handler from "../netlify/edge-functions/transcribe.js";

export function POST(request) {
  return handler(request);
}
