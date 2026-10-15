//----------------------------------
// Canvas
//----------------------------------

const grid = document.getElementById("grid");

//----------------------------------
// Auto Save
//----------------------------------

let autoSaveEnabled = false;

//----------------------------------
// Command Line State
//----------------------------------

let commandLineTargetCell = null;
let commandLineHistory = [];
let commandLineHistoryIndex = -1;
let commandLineSuggestions = [];
let commandLineSuggestionIndex = -1;

const PANEL_COMMANDS = [
  { value: "HELP", label: "HELP", detail: "Show available commands" },
  { value: "PLACE ", label: "PLACE", detail: "Place a preset" },
  { value: "CELL ", label: "CELL", detail: "Choose target cell" },
  { value: "UNDO", label: "UNDO", detail: "Undo last change" },
  { value: "REDO", label: "REDO", detail: "Redo last change" },
  { value: "CLEAR", label: "CLEAR", detail: "Clear target cell" }
];

function installCommandLineStyles() {
  if (document.getElementById("panelBuilderCommandLineStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "panelBuilderCommandLineStyles";
  style.textContent = `
    .panel-command-line {
      position: fixed;
      left: 292px;
      right: 18px;
      bottom: 16px;
      z-index: 11000;
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 42px;
      padding: 7px 10px;
      border: 1px solid rgba(96, 165, 250, .42);
      border-radius: 9px;
      background: rgba(7, 17, 31, .94);
      box-shadow: 0 12px 32px rgba(0, 0, 0, .42), inset 0 1px 0 rgba(255,255,255,.06);
      color: #e2e8f0;
      font: 600 13px/1.2 Consolas, "Courier New", monospace;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .panel-command-line__prompt {
      flex: 0 0 auto;
      color: #60a5fa;
      font-weight: 900;
    }

    .panel-command-line__input {
      flex: 1 1 auto;
      min-width: 0;
      padding: 7px 9px;
      border: 0 !important;
      outline: none;
      color: #f8fafc;
      background: transparent !important;
      box-shadow: none !important;
      font: inherit;
      text-transform: uppercase;
    }

    .panel-command-line__status {
      flex: 0 1 auto;
      max-width: 42%;
      overflow: hidden;
      color: #94a3b8;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .panel-command-line__status--error {
      color: #f87171;
    }

    .panel-command-line__status--success {
      color: #4ade80;
    }

    .panel-command-suggestions {
      position: absolute;
      left: 92px;
      right: 10px;
      bottom: calc(100% + 7px);
      display: none;
      max-height: 260px;
      overflow-y: auto;
      border: 1px solid rgba(96, 165, 250, .34);
      border-radius: 8px;
      background: rgba(7, 17, 31, .98);
      box-shadow: 0 14px 34px rgba(0, 0, 0, .48);
      padding: 4px;
    }

    .panel-command-suggestions.is-open {
      display: block;
    }

    .panel-command-suggestion {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 8px 10px;
      border-radius: 5px;
      cursor: pointer;
      color: #dbeafe;
    }

    .panel-command-suggestion:hover,
    .panel-command-suggestion.is-active {
      background: rgba(59, 130, 246, .2);
    }

    .panel-command-suggestion__value {
      font-weight: 800;
      color: #f8fafc;
    }

    .panel-command-suggestion__detail {
      overflow: hidden;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #grid .cell.command-target-cell {
      border-color: #fbbf24 !important;
      box-shadow: inset 0 0 0 2px rgba(251, 191, 36, .42), 0 0 18px rgba(251, 191, 36, .22) !important;
    }

    body.theme-smoke .panel-command-line {
      background: linear-gradient(145deg, rgba(44, 48, 51, .78), rgba(10, 12, 14, .82));
      border-color: rgba(226, 232, 240, .2);
    }

    body.theme-smoke .panel-command-suggestions {
      background: rgba(24, 27, 30, .98);
      border-color: rgba(226, 232, 240, .18);
    }

    @media (max-width: 900px) {
      .panel-command-line {
        left: 12px;
        right: 12px;
      }

      .panel-command-line__status {
        display: none;
      }

      .panel-command-suggestions {
        left: 8px;
        right: 8px;
      }
    }
  `;

  document.head.appendChild(style);
}

function createCommandLine() {
  if (document.getElementById("panelCommandLine")) {
    return;
  }

  installCommandLineStyles();

  const bar = document.createElement("div");
  bar.id = "panelCommandLine";
  bar.className = "panel-command-line";
  bar.innerHTML = `
    <span class="panel-command-line__prompt">Command:</span>
    <input
      id="panelCommandInput"
      class="panel-command-line__input"
      type="text"
      autocomplete="off"
      spellcheck="false"
      placeholder="Type preset code, HELP, UNDO, REDO, CLEAR..."
      aria-label="Panel Builder command line"
    >
    <span id="panelCommandStatus" class="panel-command-line__status">Ready</span>
    <div id="panelCommandSuggestions" class="panel-command-suggestions" role="listbox"></div>
  `;

  document.body.appendChild(bar);

  const input = document.getElementById("panelCommandInput");

  input.addEventListener("input", () => {
    refreshCommandSuggestions(input.value);
  });

  input.addEventListener("focus", () => {
    refreshCommandSuggestions(input.value);
  });

  input.addEventListener("keydown", async event => {
    if (isCommandSuggestionOpen()) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveCommandSuggestion(-1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveCommandSuggestion(1);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        acceptCommandSuggestion();
        return;
      }

      if (event.key === "Enter" && commandLineSuggestionIndex >= 0) {
        event.preventDefault();
        acceptCommandSuggestion();
        closeCommandSuggestions();
        await executePanelCommand(input.value);
        input.value = "";
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeCommandSuggestions();
        return;
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      closeCommandSuggestions();
      await executePanelCommand(input.value);
      input.value = "";
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      input.value = "";
      closeCommandSuggestions();
      clearCommandTargetCell();
      setCommandLineStatus("Command cancelled.");
      input.blur();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!commandLineHistory.length) return;
      commandLineHistoryIndex = Math.max(0, commandLineHistoryIndex - 1);
      input.value = commandLineHistory[commandLineHistoryIndex] || "";
      input.setSelectionRange(input.value.length, input.value.length);
      refreshCommandSuggestions(input.value);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!commandLineHistory.length) return;
      commandLineHistoryIndex = Math.min(
        commandLineHistory.length,
        commandLineHistoryIndex + 1
      );
      input.value = commandLineHistory[commandLineHistoryIndex] || "";
      input.setSelectionRange(input.value.length, input.value.length);
      refreshCommandSuggestions(input.value);
    }
  });

  document.addEventListener("click", event => {
    if (!bar.contains(event.target)) {
      closeCommandSuggestions();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key.length !== 1 ||
      isCommandTypingElement(document.activeElement) ||
      isCommandBlockingModalOpen()
    ) {
      return;
    }

    input.focus();
  });
}

function getPresetCommandSuggestions() {
  const rows = Array.isArray(window.presets) ? window.presets : [];
  const counts = new Map();

  rows.forEach(row => {
    const code = String(row?.PRESET || "").trim().toUpperCase();
    if (!code) return;
    counts.set(code, (counts.get(code) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([code, count]) => ({
    value: code,
    label: code,
    detail: `${count} material${count === 1 ? "" : "s"}`,
    kind: "preset"
  }));
}

function buildCommandSuggestions(rawValue) {
  const raw = String(rawValue || "");
  const normalized = raw.trim().toUpperCase();
  const presetSuggestions = getPresetCommandSuggestions();

  if (!normalized) {
    return PANEL_COMMANDS.slice(0, 6);
  }

  if (normalized === "PLACE" || normalized.startsWith("PLACE ")) {
    const query = normalized.replace(/^PLACE\s*/, "").trim();

    return presetSuggestions
      .filter(item => !query || item.label.includes(query))
      .sort((a, b) => {
        const aStarts = a.label.startsWith(query) ? 0 : 1;
        const bStarts = b.label.startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.label.localeCompare(b.label);
      })
      .slice(0, 10)
      .map(item => ({ ...item, value: `PLACE ${item.value}` }));
  }

  const commandMatches = PANEL_COMMANDS.filter(item =>
    item.label.startsWith(normalized)
  );

  const presetMatches = presetSuggestions
    .filter(item => item.label.includes(normalized))
    .sort((a, b) => {
      const aStarts = a.label.startsWith(normalized) ? 0 : 1;
      const bStarts = b.label.startsWith(normalized) ? 0 : 1;
      return aStarts - bStarts || a.label.localeCompare(b.label);
    });

  return [...commandMatches, ...presetMatches].slice(0, 10);
}

function refreshCommandSuggestions(rawValue) {
  commandLineSuggestions = buildCommandSuggestions(rawValue);
  commandLineSuggestionIndex = commandLineSuggestions.length ? 0 : -1;
  renderCommandSuggestions();
}

function renderCommandSuggestions() {
  const popup = document.getElementById("panelCommandSuggestions");

  if (!popup) return;

  popup.innerHTML = "";

  if (!commandLineSuggestions.length) {
    popup.classList.remove("is-open");
    return;
  }

  commandLineSuggestions.forEach((suggestion, index) => {
    const row = document.createElement("div");
    row.className = "panel-command-suggestion";
    row.classList.toggle("is-active", index === commandLineSuggestionIndex);
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", index === commandLineSuggestionIndex ? "true" : "false");

    const value = document.createElement("span");
    value.className = "panel-command-suggestion__value";
    value.textContent = suggestion.label;

    const detail = document.createElement("span");
    detail.className = "panel-command-suggestion__detail";
    detail.textContent = suggestion.detail || "";

    row.appendChild(value);
    row.appendChild(detail);

    row.addEventListener("mouseenter", () => {
      commandLineSuggestionIndex = index;
      renderCommandSuggestions();
    });

    row.addEventListener("mousedown", event => {
      event.preventDefault();
      commandLineSuggestionIndex = index;
      acceptCommandSuggestion();
    });

    popup.appendChild(row);
  });

  popup.classList.add("is-open");
}

function isCommandSuggestionOpen() {
  return document
    .getElementById("panelCommandSuggestions")
    ?.classList.contains("is-open");
}

function closeCommandSuggestions() {
  commandLineSuggestions = [];
  commandLineSuggestionIndex = -1;
  document
    .getElementById("panelCommandSuggestions")
    ?.classList.remove("is-open");
}

function moveCommandSuggestion(direction) {
  if (!commandLineSuggestions.length) return false;

  const count = commandLineSuggestions.length;
  commandLineSuggestionIndex =
    (commandLineSuggestionIndex + direction + count) % count;
  renderCommandSuggestions();
  return true;
}

function acceptCommandSuggestion() {
  const suggestion = commandLineSuggestions[commandLineSuggestionIndex];
  const input = document.getElementById("panelCommandInput");

  if (!suggestion || !input) return false;

  input.value = suggestion.value;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  if (suggestion.value.endsWith(" ")) {
    refreshCommandSuggestions(input.value);
  } else {
    closeCommandSuggestions();
  }

  return true;
}

function isCommandTypingElement(element) {
  if (!element) return false;

  if (element.id === "panelCommandInput") {
    return false;
  }

  const tag = String(element.tagName || "").toUpperCase();

  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable
  );
}

function isCommandBlockingModalOpen() {
  const modal = document.getElementById("equipmentModal");

  if (!modal) return false;

  const style = window.getComputedStyle(modal);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    modal.getClientRects().length > 0
  );
}

function isCommandLineActive() {
  return document.activeElement?.id === "panelCommandInput";
}

function focusPanelCommandLine() {
  const input = document.getElementById("panelCommandInput");
  input?.focus();
  return Boolean(input);
}

function setCommandLineStatus(message, type = "") {
  const status = document.getElementById("panelCommandStatus");

  if (!status) return;

  status.textContent = String(message || "Ready");
  status.classList.toggle(
    "panel-command-line__status--error",
    type === "error"
  );
  status.classList.toggle(
    "panel-command-line__status--success",
    type === "success"
  );
}

function setCommandTargetCell(index) {
  const cellIndex = Number(index);

  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= getGridSize()) {
    return false;
  }

  if (getItem(cellIndex)) {
    setCommandLineStatus(`Cell ${cellIndex} is occupied.`, "error");
    return false;
  }

  commandLineTargetCell = cellIndex;
  applyCommandTargetHighlight();
  setCommandLineStatus(`Target cell: ${cellIndex}`);
  return true;
}

function clearCommandTargetCell() {
  commandLineTargetCell = null;
  applyCommandTargetHighlight();
}

function applyCommandTargetHighlight() {
  grid
    ?.querySelectorAll(".command-target-cell")
    .forEach(cell => cell.classList.remove("command-target-cell"));

  if (commandLineTargetCell === null) return;

  grid
    ?.querySelector(`[data-index="${commandLineTargetCell}"]`)
    ?.classList.add("command-target-cell");
}

function findFirstPresetCell(equipment) {
  if (!equipment || typeof canPlace !== "function") {
    return null;
  }

  for (let index = 0; index < getGridSize(); index++) {
    if (canPlace(equipment, index)) {
      return index;
    }
  }

  return null;
}

async function executePanelCommand(rawCommand) {
  const command = String(rawCommand || "").trim();

  if (!command) {
    return false;
  }

  commandLineHistory.push(command);
  commandLineHistory = commandLineHistory.slice(-50);
  commandLineHistoryIndex = commandLineHistory.length;

  const parts = command.split(/\s+/);
  const keyword = String(parts[0] || "").toUpperCase();
  const argument = String(parts.slice(1).join(" ") || "").trim();

  if (keyword === "HELP" || keyword === "?") {
    setCommandLineStatus(
      "Preset code | PLACE code | CELL n | UNDO | REDO | CLEAR",
      "success"
    );
    return true;
  }

  if (keyword === "CELL") {
    return setCommandTargetCell(Number(argument));
  }

  if (keyword === "UNDO") {
    const result = await window.HistoryManagerV2?.undo?.();
    setCommandLineStatus(result ? "Undo complete." : "Nothing to undo.", result ? "success" : "error");
    return Boolean(result);
  }

  if (keyword === "REDO") {
    const result = await window.HistoryManagerV2?.redo?.();
    setCommandLineStatus(result ? "Redo complete." : "Nothing to redo.", result ? "success" : "error");
    return Boolean(result);
  }

  if (keyword === "CLEAR") {
    clearCommandTargetCell();
    setCommandLineStatus("Target cleared.", "success");
    return true;
  }

  const presetCode =
    keyword === "PLACE"
      ? argument.toUpperCase()
      : command.toUpperCase();

  if (!presetCode) {
    setCommandLineStatus("Enter a preset code.", "error");
    return false;
  }

  if (typeof getPresetEquipment !== "function" || typeof placePreset !== "function") {
    setCommandLineStatus("Preset placement is not ready.", "error");
    return false;
  }

  const equipment = getPresetEquipment(presetCode);

  if (!equipment) {
    setCommandLineStatus(`Preset not found: ${presetCode}`, "error");
    return false;
  }

  let targetCell = commandLineTargetCell;

  if (
    targetCell === null ||
    typeof canPlace !== "function" ||
    !canPlace(equipment, targetCell)
  ) {
    targetCell = findFirstPresetCell(equipment);
  }

  if (targetCell === null) {
    setCommandLineStatus(`No available space for ${presetCode}.`, "error");
    return false;
  }

  const placed = placePreset(presetCode, targetCell);

  if (!placed) {
    setCommandLineStatus(`Unable to place ${presetCode}.`, "error");
    return false;
  }

  commandLineTargetCell = null;
  applyCommandTargetHighlight();
  setCommandLineStatus(`Placed ${presetCode} at cell ${targetCell}.`, "success");
  return true;
}

//----------------------------------
// Draw Canvas
//----------------------------------

function drawCanvas() {
  //----------------------------------
  // Remove Floating Link Delete
  //----------------------------------

  if (typeof removeLinkDeleteButton === "function") {
    removeLinkDeleteButton();
  }

  //----------------------------------
  // Draw Grid
  //----------------------------------

  drawGrid();

  //----------------------------------
  // Draw Equipment
  //----------------------------------

  drawPlacedItems();

  //----------------------------------
  // Build Obstacle Grid
  //----------------------------------

  if (typeof refreshObstacleGrid === "function") {
    refreshObstacleGrid();
  }

  //----------------------------------
  // Debug Grid
  //----------------------------------

  if (typeof debugObstacleGrid === "function") {
    debugObstacleGrid();
  }

  //----------------------------------
  // Clear SVG
  //----------------------------------

  if (typeof clearSVG === "function") {
    clearSVG();
  }

  //----------------------------------
  // Draw Connections
  //----------------------------------

  drawConnections();

  //----------------------------------
  // Draw Links
  //----------------------------------

  drawLinks();

  //----------------------------------
  // Update BOM
  //----------------------------------

  if (typeof renderBOM === "function") {
    renderBOM();
  }

  //----------------------------------
  // Auto Save Draft
  //----------------------------------

  if (autoSaveEnabled && typeof saveDraft === "function") {
    saveDraft();
  }
}

//----------------------------------
// Draw Grid
//----------------------------------

function drawGrid() {
  grid.innerHTML = "";

  //----------------------------------
  // Dynamic Grid Style
  //----------------------------------

  grid.style.display = "grid";

  grid.style.gridTemplateColumns = `repeat(${SETTINGS.columns}, ${SETTINGS.cellSize}px)`;

  grid.style.gridAutoRows = `${SETTINGS.cellSize}px`;

  grid.style.gap = `${SETTINGS.gap}px`;

  //----------------------------------
  // Draw Cells
  //----------------------------------

  for (let index = 0; index < getGridSize(); index++) {
    const cell = document.createElement("div");

    cell.className = "cell";

    cell.dataset.index = index;

    //----------------------------------
    // Preview follows cursor
    //----------------------------------

    cell.onmouseenter = () => {
      const preset = getCurrentPreset();

      if (!preset) return;

      movePlacementPreview(index);
    };

    //----------------------------------
    // Click
    //----------------------------------

    cell.onclick = () => {
      const item = getItem(index);

      //----------------------------------
      // Existing Equipment
      //----------------------------------

      if (item) {
        return;
      }

      //----------------------------------
      // Command Target Selection
      //----------------------------------

      if (isCommandLineActive()) {
        setCommandTargetCell(index);
        setTimeout(focusPanelCommandLine, 0);
        return;
      }

      //----------------------------------
      // Empty Cell
      //----------------------------------

      SelectionManager.clear();

      //----------------------------------
      // Preset Placement
      //----------------------------------

      const preset = getCurrentPreset();

      if (preset) {
        const placed = placePreset(
          preset,

          index,
        );

        if (placed) {
          hidePlacementPreview();
        }

        return;
      }

      //----------------------------------
      // Manual Placement
      //----------------------------------

      openModal(index);
    };

    grid.appendChild(cell);
  }

  applyCommandTargetHighlight();
}

//----------------------------------
// Draw Equipment
//----------------------------------

function drawPlacedItems() {
  const drawn = new Set();

  getLayout().forEach((item) => {
    if (!item) return;

    if (drawn.has(item.id)) return;

    drawn.add(item.id);

    const cell = grid.querySelector(`[data-index="${item.startCell}"]`);

    if (!cell) return;

    const image = getDriveImageUrl(item.data.DriveFileID, 300);

    const isSelected = SelectionManager.isSelected(item);

    //----------------------------------
    // Card
    //----------------------------------

    const card = document.createElement("div");

    card.className = "panel-card";

    // Keep the actual target values on the DOM card.  This makes a placed
    // item inspectable in DevTools > Elements even when drag logging clears
    // the Console.
    card.dataset.itemId = item.id || "";
    card.dataset.preset = item.preset || "";
    card.dataset.catalogNumber = item.data?.CatalogNumber || "";
    card.dataset.nodeType = item.data?.NodeType || "";
    card.dataset.type = item.data?.Type || "";
    card.dataset.description = item.data?.Description || "";
    card.dataset.lDiscMatch = String(
      String(item.preset || "")
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase() === "LDISC"
    );

    card.style.position = "absolute";
    card.style.left = "0";
    card.style.top = "0";

    card.style.width = `${item.width * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

    card.style.height = `${item.height * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

    card.style.boxSizing = "border-box";

    card.style.padding = "8px";

    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.gap = "6px";

    card.style.background = "#EAF3FF";
    card.style.borderRadius = "2px";

    if (isSelected) {
      card.style.border = "3px solid #2196F3";
    } else {
      card.style.border = "2px solid transparent";
    }

    //----------------------------------
    // Remove Button
    //----------------------------------

    const remove = document.createElement("button");

    remove.className = "panel-remove";

    remove.innerHTML = "✕";

    remove.onclick = (e) => {
      e.stopPropagation();

      removeItem(item.startCell);

      drawCanvas();
    };

    card.appendChild(remove);

    //----------------------------------
    // Image
    //----------------------------------

    const img = document.createElement("img");

    img.className = "canvas-image";

    img.src = image;

    const imageWidth = item.width * SETTINGS.cellSize * 0.55;

    const imageHeight = item.height * SETTINGS.cellSize * 0.55;

    img.style.width = `${imageWidth}px`;
    img.style.height = `${imageHeight}px`;

    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";

    img.style.objectFit = "contain";
    img.style.pointerEvents = "none";
    img.draggable = false;

    //----------------------------------
    // Catalog
    //----------------------------------

    const code = document.createElement("div");

    code.className = "canvas-code";

    code.textContent = item.data.CatalogNumber;

    code.style.textAlign = "center";
    code.style.fontSize = "11px";
    code.style.fontWeight = "600";
    code.style.pointerEvents = "none";

    //----------------------------------
    // Description
    //----------------------------------

    const desc = document.createElement("div");

    desc.className = "canvas-desc";

    desc.textContent = `${item.data.Size || ""} ${item.data.Type || ""}`;

    desc.style.textAlign = "center";
    desc.style.fontSize = "10px";
    desc.style.pointerEvents = "none";

    //----------------------------------
    // Assemble Card
    //----------------------------------

    card.appendChild(img);

    card.appendChild(code);

    card.appendChild(desc);

    //----------------------------------
    // Enable Drag
    //----------------------------------

    if (typeof enableDrag === "function") {
      enableDrag(card, item);
    }

    //----------------------------------
    // Add to Cell
    //----------------------------------

    cell.appendChild(card);
  });
}

//----------------------------------
// Expose
//----------------------------------

window.drawCanvas = drawCanvas;
window.drawGrid = drawGrid;
window.drawPlacedItems = drawPlacedItems;
window.focusPanelCommandLine = focusPanelCommandLine;
window.executePanelCommand = executePanelCommand;
window.setCommandTargetCell = setCommandTargetCell;
window.clearCommandTargetCell = clearCommandTargetCell;

createCommandLine();
