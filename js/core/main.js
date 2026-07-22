//----------------------------------
// Global State
//----------------------------------

let pendingLink = null;

let equipment = [];

let materials = [];

let presets = [];

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

//----------------------------------
// Start Application
//----------------------------------

init();
