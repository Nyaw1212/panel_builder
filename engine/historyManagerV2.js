//----------------------------------
// History Manager V2
//----------------------------------

window.HistoryManagerV2 = (() => {
  //----------------------------------
  // State
  //----------------------------------

  let undoStack = [];
  let redoStack = [];

  let maxEntries = 100;

  let initialized = false;
  let restoring = false;
  let suspended = false;

  let serializer = null;
  let restorer = null;

  let captureTimer = null;
  let captureDelay = 150;

  let lastSerializedState = null;

  let transactionDepth = 0;
  let transactionStartState = null;
  let transactionLabel = "";

  //----------------------------------
  // Initialize
  //----------------------------------

  function init(options = {}) {
    if (typeof options.serializer === "function") {
      serializer = options.serializer;
    }

    if (typeof options.restorer === "function") {
      restorer = options.restorer;
    }

    if (Number.isFinite(Number(options.maxEntries))) {
      maxEntries = Math.max(1, Number(options.maxEntries));
    }

    if (Number.isFinite(Number(options.captureDelay))) {
      captureDelay = Math.max(0, Number(options.captureDelay));
    }

    initialized = true;

    reset();

    console.log("HistoryManagerV2 initialized.");

    return true;
  }

  //----------------------------------
  // Configure
  //----------------------------------

  function configure(options = {}) {
    return init({
      serializer: options.serializer || serializer,

      restorer: options.restorer || restorer,

      maxEntries: options.maxEntries ?? maxEntries,

      captureDelay: options.captureDelay ?? captureDelay,
    });
  }

  //----------------------------------
  // Auto Detect Serializer
  //----------------------------------

  function resolveSerializer() {
    if (typeof serializer === "function") {
      return serializer;
    }

    const candidates = [
      "serializeProject",
      "getProjectState",
      "exportProjectState",
    ];

    for (const name of candidates) {
      if (typeof window[name] === "function") {
        return window[name];
      }
    }

    return null;
  }

  //----------------------------------
  // Auto Detect Restorer
  //----------------------------------

  function resolveRestorer() {
    if (typeof restorer === "function") {
      return restorer;
    }

    const candidates = [
      "deserializeProject",
      "restoreProjectState",
      "loadProjectState",
      "applyProjectState",
    ];

    for (const name of candidates) {
      if (typeof window[name] === "function") {
        return window[name];
      }
    }

    return null;
  }

  //----------------------------------
  // Serialize Current State
  //----------------------------------

  function getCurrentState() {
    const activeSerializer = resolveSerializer();

    if (typeof activeSerializer !== "function") {
      console.warn("HistoryManagerV2: No serializer function found.");

      return null;
    }

    try {
      const state = activeSerializer();

      return cloneState(state);
    } catch (error) {
      console.error("HistoryManagerV2: Failed to serialize state.", error);

      return null;
    }
  }

  //----------------------------------
  // Capture State
  //----------------------------------

  function capture(label = "Change", options = {}) {
    if (!initialized) {
      init();
    }

    if (restoring || suspended) {
      return false;
    }

    if (transactionDepth > 0) {
      return false;
    }

    if (options.immediate === false) {
      scheduleCapture(label);

      return true;
    }

    return captureNow(label);
  }

  //----------------------------------
  // Capture Immediately
  //----------------------------------

  function captureNow(label = "Change") {
    clearCaptureTimer();

    if (restoring || suspended) {
      return false;
    }

    const state = getCurrentState();

    if (state === null || state === undefined) {
      return false;
    }

    const serialized = stableStringify(state);

    if (serialized === lastSerializedState) {
      return false;
    }

    undoStack.push({
      label,
      timestamp: Date.now(),
      state,
    });

    trimStack(undoStack);

    redoStack = [];

    lastSerializedState = serialized;

    dispatchChange();

    return true;
  }

  //----------------------------------
  // Preserve Uncaptured Live State
  //----------------------------------

  function captureLiveStateBeforeUndo() {
    if (restoring || suspended) {
      return false;
    }

    const state = getCurrentState();

    if (state === null || state === undefined) {
      return false;
    }

    const serialized = stableStringify(state);

    if (serialized === lastSerializedState) {
      return false;
    }

    undoStack.push({
      label: "Latest change",
      timestamp: Date.now(),
      state,
    });

    trimStack(undoStack);

    redoStack = [];
    lastSerializedState = serialized;

    return true;
  }

  //----------------------------------
  // Debounced Capture
  //----------------------------------

  function scheduleCapture(label = "Change") {
    clearCaptureTimer();

    captureTimer = setTimeout(() => {
      captureNow(label);
    }, captureDelay);
  }

  //----------------------------------
  // Begin Transaction
  //----------------------------------

  function beginTransaction(label = "Change") {
    if (restoring || suspended) {
      return false;
    }

    transactionDepth++;

    if (transactionDepth === 1) {
      transactionLabel = label;

      transactionStartState = getCurrentState();
    }

    return true;
  }

  //----------------------------------
  // End Transaction
  //----------------------------------

  function endTransaction(label = "") {
    if (transactionDepth <= 0) {
      return false;
    }

    transactionDepth--;

    if (transactionDepth > 0) {
      return true;
    }

    const finalLabel = label || transactionLabel || "Change";

    transactionStartState = null;

    transactionLabel = "";

    return captureNow(finalLabel);
  }

  //----------------------------------
  // Cancel Transaction
  //----------------------------------

  function cancelTransaction() {
    transactionDepth = 0;

    transactionStartState = null;

    transactionLabel = "";
  }

  //----------------------------------
  // Undo
  //----------------------------------

  async function undo() {
    clearCaptureTimer();

    if (restoring) {
      return false;
    }

    // A user may press Ctrl+Z before a delayed capture finishes,
    // or after a code path changed state without explicitly capturing it.
    // Preserve that live state first so one undo always means one step.
    captureLiveStateBeforeUndo();

    if (undoStack.length <= 1) {
      return false;
    }

    const currentEntry = undoStack.pop();

    redoStack.push(currentEntry);

    const previousEntry = undoStack[undoStack.length - 1];

    const restored = await restoreEntry(previousEntry);

    if (!restored) {
      undoStack.push(redoStack.pop());

      return false;
    }

    dispatchChange();

    return true;
  }

  //----------------------------------
  // Redo
  //----------------------------------

  async function redo() {
    clearCaptureTimer();

    if (restoring || redoStack.length === 0) {
      return false;
    }

    const entry = redoStack.pop();

    const restored = await restoreEntry(entry);

    if (!restored) {
      redoStack.push(entry);

      return false;
    }

    undoStack.push(entry);

    trimStack(undoStack);

    dispatchChange();

    return true;
  }

  //----------------------------------
  // Restore Entry
  //----------------------------------

  async function restoreEntry(entry) {
    if (!entry) {
      return false;
    }

    const activeRestorer = resolveRestorer();

    if (typeof activeRestorer !== "function") {
      console.warn("HistoryManagerV2: No restorer function found.");

      return false;
    }

    restoring = true;

    try {
      const state = cloneState(entry.state);

      await activeRestorer(state);

      lastSerializedState = stableStringify(state);

      window.dispatchEvent(
        new CustomEvent("historyrestore", {
          detail: {
            label: entry.label,

            timestamp: entry.timestamp,

            state,
          },
        }),
      );

      return true;
    } catch (error) {
      console.error("HistoryManagerV2: Restore failed.", error);

      return false;
    } finally {
      restoring = false;
    }
  }

  //----------------------------------
  // Reset History
  //----------------------------------

  function reset(label = "Initial State") {
    clearCaptureTimer();

    undoStack = [];
    redoStack = [];

    lastSerializedState = null;

    const state = getCurrentState();

    if (state !== null && state !== undefined) {
      undoStack.push({
        label,
        timestamp: Date.now(),
        state,
      });

      lastSerializedState = stableStringify(state);
    }

    dispatchChange();

    return true;
  }

  //----------------------------------
  // Clear History
  //----------------------------------

  function clear() {
    clearCaptureTimer();

    undoStack = [];
    redoStack = [];

    lastSerializedState = null;

    dispatchChange();
  }

  //----------------------------------
  // Suspend Capture
  //----------------------------------

  function suspend() {
    suspended = true;
  }

  //----------------------------------
  // Resume Capture
  //----------------------------------

  function resume(captureAfterResume = false, label = "Resume") {
    suspended = false;

    if (captureAfterResume) {
      captureNow(label);
    }
  }

  //----------------------------------
  // Run Without History
  //----------------------------------

  async function withoutHistory(callback) {
    if (typeof callback !== "function") {
      return null;
    }

    const previousSuspended = suspended;

    suspended = true;

    try {
      return await callback();
    } finally {
      suspended = previousSuspended;
    }
  }

  //----------------------------------
  // Can Undo
  //----------------------------------

  function canUndo() {
    return undoStack.length > 1 && !restoring;
  }

  //----------------------------------
  // Can Redo
  //----------------------------------

  function canRedo() {
    return redoStack.length > 0 && !restoring;
  }

  //----------------------------------
  // History Info
  //----------------------------------

  function getInfo() {
    return {
      initialized,
      restoring,
      suspended,

      canUndo: canUndo(),

      canRedo: canRedo(),

      undoCount: Math.max(0, undoStack.length - 1),

      redoCount: redoStack.length,

      undoLabel: canUndo() ? undoStack[undoStack.length - 1]?.label || "" : "",

      redoLabel: canRedo() ? redoStack[redoStack.length - 1]?.label || "" : "",
    };
  }

  //----------------------------------
  // Get History List
  //----------------------------------

  function getHistory() {
    return {
      undo: undoStack.map((entry) => ({
        label: entry.label,

        timestamp: entry.timestamp,
      })),

      redo: redoStack.map((entry) => ({
        label: entry.label,

        timestamp: entry.timestamp,
      })),
    };
  }

  //----------------------------------
  // Trim Stack
  //----------------------------------

  function trimStack(stack) {
    while (stack.length > maxEntries) {
      stack.shift();
    }
  }

  //----------------------------------
  // Clone State
  //----------------------------------

  function cloneState(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  //----------------------------------
  // Stable Stringify
  //----------------------------------

  function stableStringify(value) {
    return JSON.stringify(sortObject(value));
  }

  //----------------------------------
  // Sort Object Recursively
  //----------------------------------

  function sortObject(value) {
    if (Array.isArray(value)) {
      return value.map(sortObject);
    }

    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((result, key) => {
          result[key] = sortObject(value[key]);

          return result;
        }, {});
    }

    return value;
  }

  //----------------------------------
  // Clear Capture Timer
  //----------------------------------

  function clearCaptureTimer() {
    if (captureTimer) {
      clearTimeout(captureTimer);

      captureTimer = null;
    }
  }

  //----------------------------------
  // Dispatch History Change
  //----------------------------------

  function dispatchChange() {
    window.dispatchEvent(
      new CustomEvent("historychange", {
        detail: getInfo(),
      }),
    );
  }

  //----------------------------------
  // Public API
  //----------------------------------

  return {
    init,
    configure,

    capture,
    captureNow,
    scheduleCapture,

    beginTransaction,
    endTransaction,
    cancelTransaction,

    undo,
    redo,

    reset,
    clear,

    suspend,
    resume,
    withoutHistory,

    canUndo,
    canRedo,

    getInfo,
    getHistory,
  };
})();

//----------------------------------
// Global Compatibility Functions
//----------------------------------

window.undo = function () {
  return window.HistoryManagerV2.undo();
};

window.redo = function () {
  return window.HistoryManagerV2.redo();
};
