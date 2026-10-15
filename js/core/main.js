//----------------------------------
// Global State
//----------------------------------

let pendingLink = null;

let equipment = [];

let materials = [];

let presets = [];

let wireAssignments = [];

//----------------------------------
// Reload MML Catalog
//----------------------------------

async function reloadMMLCatalog() {
  const button = document.getElementById("reloadMMLButton");
  const originalLabel = button?.textContent || "🔄 Reload MML";

  if (!window.API?.reloadMML) {
    alert("MML reload is not available yet. Refresh the app and try again.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "⏳ Loading MML...";
  }

  try {
    const mml = await window.API.reloadMML();

    equipment = mml.filter(item => item.Placeable);
    materials = mml.filter(item => !item.Placeable);
    window.equipment = equipment;
    window.materials = materials;

    if (typeof buildEquipmentLibrary === "function") {
      const search = document.getElementById("searchBox")?.value || "";
      buildEquipmentLibrary(search);
    }

    if (typeof renderBOM === "function") renderBOM();
    if (typeof drawCanvas === "function") drawCanvas();

    alert(`MML reloaded: ${mml.length} catalog items.`);
  }
  catch (err) {
    console.error("MML reload failed:", err);
    alert(`MML reload failed: ${err.message || "Unable to reach Apps Script."}`);
  }
  finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

//----------------------------------
// Main
//----------------------------------

async function init() {
  PERF.start("Application Startup");

  try {
    //----------------------------------
    // Load MML
    //----------------------------------

    PERF.start("Load MML");

    const mml = await API.getMML();

    PERF.end("Load MML");

    //----------------------------------
    // Load Presets
    //----------------------------------

    PERF.start("Load Presets");

    presets = await API.getPresets();

    PERF.end("Load Presets");

    //----------------------------------
    // Load Wire Assignment Rules
    //----------------------------------

    wireAssignments = typeof API.getWireAssignments === "function"
      ? await API.getWireAssignments()
      : [];

    //----------------------------------
    // Split MML
    //----------------------------------

    PERF.start("Split MML");

    equipment = mml.filter((item) => item.Placeable);

    materials = mml.filter((item) => !item.Placeable);

    PERF.end("Split MML");

    //----------------------------------
    // Expose Global Data
    //----------------------------------

    window.equipment = equipment;
    window.materials = materials;
    window.presets = presets;
    window.wireAssignments = wireAssignments;

    //----------------------------------
    // Initialization Summary
    //----------------------------------

    console.group("Initialization");

    console.log(`Equipment : ${equipment.length}`);

    console.table(equipment.slice(0, 3));

    console.log(`Materials : ${materials.length}`);

    console.table(materials.slice(0, 3));

    console.log(`Presets : ${presets.length}`);

    console.table(presets.slice(0, 3));

    console.groupEnd();

    //----------------------------------
    // Initialize SVG
    //----------------------------------

    PERF.start("Initialize SVG");

    initializeSVG();

    PERF.end("Initialize SVG");

    //----------------------------------
    // Equipment Library
    //----------------------------------

    PERF.start("Equipment Library");

    buildEquipmentLibrary();

    PERF.end("Equipment Library");

    //----------------------------------
    // Preset Library
    //----------------------------------

    PERF.start("Preset Library");

    buildPresetLibrary();

    PERF.end("Preset Library");

    //----------------------------------
    // Toolbar
    //----------------------------------

    if (typeof initializeToolbar === "function") {
      PERF.start("Toolbar");

      initializeToolbar();

      PERF.end("Toolbar");
    }

    //----------------------------------
    // Draw Empty Canvas
    //----------------------------------

    PERF.start("Draw Canvas");

    drawCanvas();

    PERF.end("Draw Canvas");

    //----------------------------------
    // Restore Draft
    //----------------------------------

    if (
      typeof loadDraft === "function" &&
      typeof deserializeProject === "function"
    ) {
      const draft = loadDraft();

      if (draft) {
        PERF.start("Restore Draft");

        console.log("Restoring Draft...");

        await deserializeProject(draft);

        console.log("Draft Restored Successfully");

        PERF.end("Restore Draft");
      }
    }

    //----------------------------------
    // Initialize History Manager
    //----------------------------------

    if (
      window.HistoryManagerV2 &&
      typeof window.HistoryManagerV2.init === "function"
    ) {
      if (typeof serializeProject !== "function") {
        throw new Error("HistoryManagerV2 requires serializeProject().");
      }

      if (typeof deserializeProject !== "function") {
        throw new Error("HistoryManagerV2 requires deserializeProject().");
      }

      PERF.start("Initialize History");

      window.HistoryManagerV2.init({
        serializer: () => {
          return serializeProjectHistory();
        },

        restorer: async (state) => {
          //----------------------------------
          // Prevent Auto Save During Restore
          //----------------------------------

          const previousAutoSaveState =
            typeof autoSaveEnabled !== "undefined" ? autoSaveEnabled : false;

          if (typeof autoSaveEnabled !== "undefined") {
            autoSaveEnabled = false;
          }

          try {
            await deserializeProject(state);

            if (typeof drawCanvas === "function") {
              drawCanvas();
            }

            if (
              typeof getCurrentEquipment === "function" &&
              getCurrentEquipment() &&
              typeof refreshEquipmentCardModal === "function"
            ) {
              refreshEquipmentCardModal();
            }
          } finally {
            if (typeof autoSaveEnabled !== "undefined") {
              autoSaveEnabled = previousAutoSaveState;
            }
          }
        },

        maxEntries: 100,

        captureDelay: 150,
      });

      PERF.end("Initialize History");

      console.log("History Manager Enabled");
    } else {
      console.warn("HistoryManagerV2 was not found.");
    }

    //----------------------------------
    // Enable Auto Save
    //----------------------------------

    autoSaveEnabled = true;

    console.log("Auto Save Enabled");
  } catch (err) {
    console.error("INITIALIZATION FAILED");

    console.error(err);
    console.error(err.stack);

    alert(err.message);
  } finally {
    PERF.end("Application Startup");
  }
}

//----------------------------------
// Start / Finish Link
//----------------------------------

function handleConnectionClick(item, connection) {
  if (!pendingLink) {
    pendingLink = {
      item,
      connection,
    };

    drawCanvas();

    return;
  }

  if (
    pendingLink.item.id === item.id &&
    pendingLink.connection.id === connection.id
  ) {
    pendingLink = null;

    drawCanvas();

    return;
  }

  createLink(pendingLink, {
    item,
    connection,
  });

  pendingLink = null;

  drawCanvas();

  //----------------------------------
  // Capture Link Creation
  //----------------------------------

  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture("Connection created");
  }
}

//----------------------------------
// Get Equipment
//----------------------------------

function getEquipment() {
  return equipment;
}

//----------------------------------
// Get Materials
//----------------------------------

function getMaterials() {
  return materials;
}

//----------------------------------
// Get Presets
//----------------------------------

function getPresetList() {
  return presets;
}

//----------------------------------
// Expose
//----------------------------------

window.getEquipment = getEquipment;

window.getMaterials = getMaterials;

window.getPresetList = getPresetList;

window.handleConnectionClick = handleConnectionClick;

window.init = init;
window.reloadMMLCatalog = reloadMMLCatalog;

//----------------------------------
// Start Application
//----------------------------------

init();
