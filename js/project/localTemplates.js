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
    const project = buildProject();
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
  openButton?.addEventListener("click", async () => {
    const all = read();
    const names = Object.keys(all).sort();
    if (!names.length) { window.alert("No saved templates in this browser yet."); return; }
    const selected = window.prompt("Enter the template name to load:\n\n" + names.join("\n"));
    if (selected === null) return;
    const name = names.find(key => key.toLowerCase() === selected.trim().toLowerCase());
    if (!name) { window.alert("Template not found."); return; }
    if (!window.confirm('Load template "' + name + '"? This replaces the current unsaved layout.')) return;
    const snapshot = structuredClone(all[name].project);
    if (typeof deserializeProject !== "function") { window.alert("Project loader unavailable."); return; }
    await deserializeProject(snapshot);
    if (typeof setProjectState === "function") {
      setProjectState({ ...state(), id: "", jobName: "", address: "", model: name, usedMaterialsSpreadsheetId: "", usedMaterialsSpreadsheetUrl: "" });
    }
    label(name);
    if (typeof finalizeLoadedProjectHistory === "function") finalizeLoadedProjectHistory();
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
