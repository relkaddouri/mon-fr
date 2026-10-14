// Version Vercel : même code que la fonction Netlify, branché sur /api/claude.
import handler from "../netlify/edge-functions/claude.js";

export function POST(request) {
  return handler(request);
}
