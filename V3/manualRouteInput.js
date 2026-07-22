//----------------------------------
// Manual Route Input V3
//----------------------------------

(function () {
  "use strict";

  let svg = null;
  let options = {};
  let enabled = false;
  let initialized = false;

  function init(svgElement, nextOptions = {}) {
    svg = svgElement;
    options = {
      resolveConnector: () => null,
      resolveLink: () => null,
      ...nextOptions,
    };

    if (initialized) return;
    initialized = true;

    // Listen on document because connector nodes and normal link paths are
    // not children of the manual-route SVG interaction layer.
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
  }

  function setEnabled(value) {
    enabled = Boolean(value);

    document.documentElement.classList.toggle(
      "manual-routing-v3-active",
      enabled,
    );

    options.onEnabledChanged?.(enabled);

    if (!enabled && ManualRouterEngineV3.isDrawing()) {
      const drawing = ManualRouterEngineV3.getDrawingState();
      ManualRouterEngineV3.cancel();
      options.onDrawingCancelled?.(drawing?.link || null);
    }

    if (!enabled) {
      ManualRouterEngineV3.deselect();
    }
  }

  function isCanvasTarget(target) {
    return Boolean(
      target?.closest?.("#canvasContainer"),
    );
  }

  function consume(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePointerMove(event) {
    if (!enabled || !ManualRouterEngineV3.isDrawing()) return;

    ManualRouterEngineV3.updatePointer(
      ManualRouteRendererV3.clientToSvgPoint(event),
    );
  }

  function handleClick(event) {
    if (!enabled || !isCanvasTarget(event.target)) return;

    const connector = options.resolveConnector(event.target);
    const drawing = ManualRouterEngineV3.getDrawingState();

    consume(event);

    if (!drawing) {
      if (!connector) return;

      const link = options.createLink?.(connector);
      if (!link) return;

      ManualRouterEngineV3.begin(link, connector.point);
      options.onDrawingStarted?.(link, connector);
      return;
    }

    if (connector) {
      const completed = options.completeLink?.(
        drawing.link,
        connector,
      );

      if (completed === false) return;

      ManualRouterEngineV3.finish(connector.point);
      options.onDrawingFinished?.(drawing.link, connector);
      return;
    }

    ManualRouterEngineV3.addCorner(
      ManualRouteRendererV3.clientToSvgPoint(event),
    );
  }

  function handlePointerDown(event) {
    if (!enabled || !isCanvasTarget(event.target)) return;
    if (ManualRouterEngineV3.isDrawing()) return;

    const link = options.resolveLink(event.target);
    if (!link) return;

    consume(event);

    if (link.routingMode !== "manual") {
      ManualRouterEngineV3.convertToManual(link);
    } else {
      ManualRouterEngineV3.select(link);
    }

    options.onLinkSelected?.(link);
  }

  function handleKeyDown(event) {
    if (!enabled) return;

    if (event.key === "Escape") {
      if (ManualRouterEngineV3.isDrawing()) {
        const drawing = ManualRouterEngineV3.getDrawingState();
        ManualRouterEngineV3.cancel();
        options.onDrawingCancelled?.(drawing?.link || null);
      } else {
        setEnabled(false);
      }
    }
  }

  window.ManualRouteInputV3 = {
    init,
    setEnabled,
    isEnabled() {
      return enabled;
    },
  };
})();
