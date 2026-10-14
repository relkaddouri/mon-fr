import { S, save, exportData, importData, resetAll } from "../store.js";
import { getConfig, diagnose } from "../api.js";
import { esc, toast } from "../ui.js";
import { frenchVoices, speak, voicesReady } from "../audio.js";

export async function render(root) {
  const cfg = await getConfig(true);
  await voicesReady();
  const voices = frenchVoices();

  root.innerHTML = `
    <section class="stack-lg">
      <div class="card stack">
        <h3>Connexion</h3>
        <label class="field"><span>Code d'accès</span>
          <input class="input" id="code" type="password" autocomplete="off" value="${esc(S.settings.code)}" placeholder="${cfg.needsCode ? "Le code défini dans APP_CODE" : "Aucun code demandé"}"></label>
        <div class="btn-row">
          <button class="btn btn-secondary" id="saveCode">Enregistrer le code</button>
          <button class="btn btn-primary" id="diag">Tester la connexion</button>
        </div>
        <div id="diagOut"></div>
      </div>

      <div class="card stack">
        <h3>Voix de lecture</h3>
        ${voices.length ? `<select class="select" id="voice">
          <option value="">Automatique</option>
          ${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voiceURI ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}
        </select>` : `<p class="small muted">Aucune voix française trouvée. Sur iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis télécharge une voix « améliorée ».</p>`}
        <label class="field"><span>Vitesse : <b id="rateV">${S.settings.rate}</b></span>
          <input type="range" id="rate" min="0.7" max="1.3" step="0.05" value="${S.settings.rate}"></label>
        <button class="btn btn-secondary" id="test">Tester la voix</button>
      </div>

      <div class="card stack">
        <h3>Objectif quotidien</h3>
        <div class="chips wrap">${[10, 15, 20, 30].map((m) => `<button class="chip ${S.settings.goalMin === m ? "on" : ""}" data-g="${m}">${m} min</button>`).join("")}</div>
      </div>

      <div class="card stack">
        <h3>Mes données</h3>
        <p class="small muted">Tout reste sur ce téléphone. Exporte une sauvegarde de temps en temps. Les enregistrements audio ne sont pas inclus.</p>
        <div class="btn-row">
          <button class="btn btn-secondary" id="exp">Exporter</button>
          <label class="btn btn-secondary">Importer<input type="file" id="imp" accept="application/json" hidden></label>
        </div>
        <button class="link small" id="reset" style="color:var(--warn);justify-self:start">Tout effacer et recommencer</button>
      </div>
      <p class="tiny muted" style="text-align:center">Mon français · v1 · design Decision Compass</p>
    </section>`;

  const $ = (s) => root.querySelector(s);
  $("#saveCode").addEventListener("click", () => { S.settings.code = $("#code").value.trim(); save(); toast("Code enregistré."); });
  const line = (r, label) => r ? `<div class="check-line"><span class="ic ${r.ok ? "ok" : "ko"}">${r.ok ? "✓" : "!"}</span><div><b style="font-weight:500">${label}</b><br><span class="muted">${esc(r.msg)}</span>${r.detail ? `<code>${esc(r.detail)}</code>` : ""}</div></div>` : "";
  $("#diag").addEventListener("click", async (e) => {
    const b = e.currentTarget; b.disabled = true;
    S.settings.code = $("#code").value.trim(); save();
    $("#diagOut").innerHTML = `<div class="loading"><span class="spinner"></span>Test en cours…</div>`;
    const d = await diagnose();
    $("#diagOut").innerHTML = line(d.server, "Serveur") + line(d.claude, "Intelligence artificielle") + line(d.transcribe, "Transcription de la voix");
    b.disabled = false;
  });
  $("#voice")?.addEventListener("change", (e) => { S.settings.voiceURI = e.target.value; save(); });
  $("#rate").addEventListener("input", (e) => { S.settings.rate = +e.target.value; $("#rateV").textContent = S.settings.rate; save(); });
  $("#test").addEventListener("click", () => speak("Bonjour Rachid. Voici la voix qui lira tes écoutes."));
  root.querySelectorAll("[data-g]").forEach((c) => c.addEventListener("click", () => {
    S.settings.goalMin = +c.dataset.g; save(); root.querySelectorAll("[data-g]").forEach((x) => x.classList.toggle("on", x === c));
  }));
  $("#exp").addEventListener("click", async () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const name = `mon-francais-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch {} }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  });
  $("#imp").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { importData(await f.text()); toast("Sauvegarde importée."); setTimeout(() => (location.hash = "#/"), 600); }
    catch (err) { toast(err.message); }
  });
  $("#reset").addEventListener("click", () => {
    if ($("#reset").dataset.armed) return resetAll();
    $("#reset").dataset.armed = 1; $("#reset").textContent = "Touche encore pour confirmer";
    setTimeout(() => { const r = $("#reset"); if (r) { delete r.dataset.armed; r.textContent = "Tout effacer et recommencer"; } }, 4000);
  });
}
