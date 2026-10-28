// Browser-local named layout templates. These do not save a project or generate a report.
(() => {
  const KEY = "panelBuilderNamedTemplatesV1";
  const title = document.getElementById("canvasTemplateName");
  const saveButton = document.getElementById("saveAsTemplateButton");
  const openButton = document.getElementById("openTemplateButton");
  const read = () => {
    try { const rows = JSON.parse(localStorage.getItem(KEY) || "{}"); return rows && typeof rows === "object" ? rows : {}; }
    catch { return {}; }
  };
  const label = name => { if (title) title.textContent = name || "Template Name"; };
  const state = () => typeof getProjectState === "function" ? getProjectState() : {};
  label(state().model);
  saveButton?.addEventListener("click", () => {
    const current = String(state().model || "").trim();
    const proposed = window.prompt("Template name:", current);
    if (proposed === null) return;
    const name = proposed.trim();
    if (!name) { window.alert("Enter a template name."); return; }
    const all = read();
    const existing = Object.keys(all).find(key => key.toLowerCase() === name.toLowerCase());
    if (existing && !window.confirm('Replace existing template "' + existing + '"?')) return;
    // buildProject() includes live canvas objects with circular connection references.
    // Use the existing compact, JSON-safe project serializers instead.
    const project = {
      ...buildProject(),
      layout: serializeLayout(),
      links: serializeLinks(),
      runs: typeof serializeRuns === "function" ? serializeRuns() : [],
      gutters: typeof serializeGutters === "function" ? serializeGutters() : []
    };
    project.id = "";
    project.jobName = "";
    project.address = "";
    project.model = name;
    const key = existing || name;
    all[key] = { project, savedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(all)); }
    catch (err) { window.alert("Unable to store template in this browser: " + err.message); return; }
    state().model = name;
    label(name);
    window.alert('Template "' + name + '" saved in this browser.');
  });
  openButton?.addEventListener("click", () => {
    const all = read();
    const names = Object.keys(all).sort();
    if (!names.length) { window.alert("No saved templates in this browser yet."); return; }
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;";
    const card = document.createElement("div");
    card.style.cssText = "background:#17212f;color:#f8fafc;padding:24px;border:1px solid #475569;border-radius:12px;width:min(420px,90vw);box-shadow:0 18px 55px #0009;";
    const heading = document.createElement("h2");
    heading.textContent = "Open Template";
    heading.style.cssText = "margin:0 0 16px;font:700 20px Arial;";
    const select = document.createElement("select");
    select.style.cssText = "display:block;width:100%;box-sizing:border-box;padding:12px;background:#0f172a;color:white;border:1px solid #64748b;border-radius:7px;font-size:15px;";
    names.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px;margin-top:20px;";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    const load = document.createElement("button");
    load.textContent = "Load Template";
    for (const button of [cancel, load]) button.style.cssText = "padding:9px 14px;border-radius:6px;cursor:pointer;";
    load.style.background = "#2563eb";
    load.style.color = "white";
    cancel.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", event => { if (event.target === overlay) overlay.remove(); });
    load.addEventListener("click", async () => {
      const name = select.value;
      if (!window.confirm('Load template "' + name + '"? This replaces the current unsaved layout.')) return;
      const snapshot = structuredClone(all[name].project);
      if (typeof deserializeProject !== "function") { window.alert("Project loader unavailable."); return; }
      try {
        await deserializeProject(snapshot);
        if (typeof setProjectState === "function") {
          setProjectState({ ...state(), id: "", jobName: "", address: "", model: name, usedMaterialsSpreadsheetId: "", usedMaterialsSpreadsheetUrl: "" });
        }
        label(name);
        if (typeof finalizeLoadedProjectHistory === "function") finalizeLoadedProjectHistory();
        overlay.remove();
      } catch (err) { window.alert("Unable to load template: " + err.message); }
    });
    actions.append(cancel, load);
    card.append(heading, select, actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    select.focus();
  });
  // Keep the canvas title synchronized when project state changes on Open/New.
  const originalSet = window.setProjectState;
  if (typeof originalSet === "function") {
    window.setProjectState = function (...args) {
      const result = originalSet.apply(this, args);
      label(state().model);
      return result;
    };
  }
  const originalClear = window.clearProjectState;
  if (typeof originalClear === "function") {
    window.clearProjectState = function (...args) {
      const result = originalClear.apply(this, args);
      label(state().model);
      return result;
    };
  }
})();
