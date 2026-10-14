// Version Vercel : même code que la fonction Netlify, branché sur /api/config.
import handler from "../netlify/edge-functions/config.js";

export function GET(request) {
  return handler(request);
}
