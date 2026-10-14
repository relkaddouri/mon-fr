// Micro, reconnaissance vocale et voix de synthèse.
import { S } from "./store.js";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = !!(window.navigator.standalone || window.matchMedia?.("(display-mode: standalone)").matches);
// Sur iPhone, la reconnaissance vocale de Safari est instable dans une app installée : on ne s'y fie pas.
export const canRecognize = !!SR && !(isIOS && isStandalone);
export const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

function pickMime() {
  const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

// Enregistreur : garde l'audio, dessine l'onde, et transcrit en direct si on le demande.
export class Recorder {
  constructor({ live = false, onLive, onLevel } = {}) {
    this.live = live && canRecognize;
    this.onLive = onLive; this.onLevel = onLevel;
    this.finalText = ""; this.interim = "";
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = pickMime();
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.mr.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.mr.start(1000);
    this.t0 = performance.now();

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ac = new AC();
      if (this.ac.state === "suspended") await this.ac.resume();
      const src = this.ac.createMediaStreamSource(this.stream);
      this.an = this.ac.createAnalyser(); this.an.fftSize = 512;
      src.connect(this.an);
      const data = new Uint8Array(this.an.fftSize);
      const tick = () => {
        if (!this.an) return;
        this.an.getByteTimeDomainData(data);
        let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2;
        this.onLevel && this.onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        this.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {}

    if (this.live) this._startRecognition();
  }

  _startRecognition() {
    const r = new SR();
    r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) this.finalText += res[0].transcript.trim() + " ";
        else interim += res[0].transcript;
      }
      this.interim = interim;
      this.onLive && this.onLive(this.finalText, interim);
    };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") this.live = false; };
    // Safari coupe la reconnaissance après un silence : on la relance tant qu'on enregistre.
    r.onend = () => { if (this.live && this.mr?.state === "recording") { try { r.start(); } catch {} } };
    try { r.start(); this.rec = r; } catch { this.live = false; }
  }

  get seconds() { return this.t0 ? (performance.now() - this.t0) / 1000 : 0; }

  stop() {
    return new Promise((resolve) => {
      const seconds = this.seconds;
      const finish = () => {
        cancelAnimationFrame(this.raf); this.an = null;
        try { this.ac?.close(); } catch {}
        this.stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(this.chunks, { type: this.mr?.mimeType || "audio/mp4" });
        const text = (this.finalText + " " + (this.interim || "")).trim();
        resolve({ blob, seconds, text });
      };
      this.live = false;
      try { this.rec?.stop(); } catch {}
      if (this.mr && this.mr.state !== "inactive") { this.mr.onstop = finish; this.mr.stop(); }
      else finish();
    });
  }

  cancel() { this.stop(); }
}

// Dictée simple (pour le coach, sans garder l'audio).
export function dictate({ onText, onEnd }) {
  if (!SR) return null;
  const r = new SR();
  r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
  let final = "";
  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript.trim() + " ";
      else interim += e.results[i][0].transcript;
    }
    onText((final + interim).trim());
  };
  r.onend = () => onEnd && onEnd(final.trim());
  r.onerror = () => {};
  r.start();
  return r;
}

// ---------- Voix de synthèse ----------
export function frenchVoices() {
  const all = window.speechSynthesis?.getVoices() || [];
  return all.filter((v) => v.lang?.toLowerCase().startsWith("fr"));
}
function bestVoice() {
  const vs = frenchVoices();
  if (!vs.length) return null;
  const chosen = vs.find((v) => v.voiceURI === S.settings.voiceURI);
  if (chosen) return chosen;
  const fr = vs.filter((v) => /fr[-_]FR/i.test(v.lang));
  const pool = fr.length ? fr : vs;
  return pool.find((v) => /premium|enhanced|amélioré|natural|neural/i.test(v.name)) ||
         pool.find((v) => /thomas|audrey|amélie|marie|google/i.test(v.name)) || pool[0];
}
let voicesP = null;
export function voicesReady() {
  if (!window.speechSynthesis) return Promise.resolve([]);
  if (speechSynthesis.getVoices().length) return Promise.resolve(speechSynthesis.getVoices());
  if (!voicesP) voicesP = new Promise((res) => {
    const done = () => res(speechSynthesis.getVoices());
    speechSynthesis.addEventListener?.("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesP;
}
voicesReady();

// iOS n'autorise la voix qu'après un geste : on « débloque » au premier toucher.
let unlocked = false;
function unlock() {
  if (unlocked || !window.speechSynthesis) return;
  unlocked = true;
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch {}
}
window.addEventListener("pointerdown", unlock, { once: true, capture: true });

// Lit un texte phrase par phrase (Chrome coupe les textes longs, iOS aussi parfois).
let speakToken = 0;
export function speak(text, { rate, onEnd, onStart } = {}) {
  if (!window.speechSynthesis) { onEnd && onEnd(); return null; }
  const token = ++speakToken;
  speechSynthesis.cancel();
  if (speechSynthesis.paused) speechSynthesis.resume();
  const parts = splitSentences(text);
  const v = bestVoice();
  let i = 0, started = false;
  const next = () => {
    if (token !== speakToken) return;
    if (i >= parts.length) { onEnd && onEnd(); return; }
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = v?.lang || "fr-FR";
    if (v) u.voice = v;
    u.rate = rate || S.settings.rate || 1;
    u.onstart = () => { if (!started) { started = true; onStart && onStart(); } };
    u.onend = next;
    u.onerror = (e) => { if (e.error === "interrupted" || e.error === "canceled") return; next(); };
    speechSynthesis.speak(u);
  };
  next();
  return token;
}
export function stopSpeaking() { speakToken++; window.speechSynthesis?.cancel(); }
export const speaking = () => !!window.speechSynthesis?.speaking;

export function splitSentences(text) {
  return (String(text).match(/[^.!?…]+[.!?…]+["»)]?|[^.!?…]+$/g) || [text]).map((s) => s.trim()).filter(Boolean);
}
