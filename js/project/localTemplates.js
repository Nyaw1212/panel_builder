// Browser-local named layout templates. These do not save a project or generate a report.
(() => {
  const KEY = "panelBuilderNamedTemplatesV1";
  const title = document.getElementById("canvasTemplateName");
  // Place the caption in the visible workspace rather than the oversized
  // scrollable canvas. Its position follows the workspace viewport.
  const workspace = document.querySelector(".workspace");
  if (title && workspace) workspace.appendChild(title);
  // Keep Runs outside transformed/scrolled canvas ancestors so fixed positioning
  // is relative to the browser viewport, not the canvas coordinate system.
  const runsShortcut = document.getElementById("runsButton");
  if (runsShortcut) document.body.appendChild(runsShortcut);
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
  // Lightweight anchored dropdown: selecting a template loads it immediately.
  let templateMenu = null;
  const closeTemplateMenu = () => {
    templateMenu?.remove();
    templateMenu = null;
  };
  const loadTemplate = async (name, record) => {
    if (!record?.project) return;
    if (typeof deserializeProject !== "function") {
      window.alert("Project loader unavailable.");
      return;
    }
    try {
      const snapshot = structuredClone(record.project);
      await deserializeProject(snapshot);
      if (typeof setProjectState === "function") {
        setProjectState({ ...state(), id: "", jobName: "", address: "", model: name, usedMaterialsSpreadsheetId: "", usedMaterialsSpreadsheetUrl: "" });
      }
      label(name);
      if (typeof finalizeLoadedProjectHistory === "function") finalizeLoadedProjectHistory();
      closeTemplateMenu();
    } catch (err) {
      window.alert("Unable to load template: " + err.message);
    }
  };
  const openTemplateMenu = anchor => {
    if (templateMenu) { closeTemplateMenu(); return; }
    const all = read();
    const names = Object.keys(all).sort();
    if (!names.length) {
      window.alert("No saved templates in this browser yet.");
      return;
    }
    const menu = document.createElement("div");
    menu.className = "template-quick-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Saved templates");
    names.forEach(name => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "template-quick-option";
      option.setAttribute("role", "menuitem");
      option.textContent = name;
      option.addEventListener("click", () => loadTemplate(name, all[name]));
      menu.appendChild(option);
    });
    document.body.appendChild(menu);
    templateMenu = menu;
    const rect = anchor?.getBoundingClientRect?.() || { left: 20, right: 220, top: 60, bottom: 80 };
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width)) + "px";
    menu.style.top = (rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - height - 6)) + "px";
    menu.querySelector("button")?.focus();
  };
  openButton?.addEventListener("click", () => openTemplateMenu(openButton));
  document.addEventListener("pointerdown", event => {
    if (templateMenu && !templateMenu.contains(event.target) && event.target !== title && event.target !== openButton) closeTemplateMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && templateMenu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTemplateMenu();
    }
  }, true);
  // The large workspace title doubles as a shortcut to the existing
  // template dropdown, so there is only one picker to maintain.
  if (title) {
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-label", "Choose a saved template");
    title.setAttribute("title", "Click to choose a saved template");
    title.addEventListener("click", () => openTemplateMenu(title));
    title.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTemplateMenu(title);
      }
    });
  }
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
