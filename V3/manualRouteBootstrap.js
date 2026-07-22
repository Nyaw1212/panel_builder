//----------------------------------
// Manual Routing V3 Bootstrap
//----------------------------------

(function () {
  "use strict";

  function redrawLinks() {
    if (typeof window.drawLinks === "function") {
      window.drawLinks();
    }
  }

  function initializeManualRoutingV3({
    svgSelector = "#svgLayer",
    gridSize = 12,
    resolveConnector,
    resolveLink,
    createLink,
    completeLink,
    onRouteChanged,
    onDrawingStarted,
    onDrawingFinished,
    onDrawingCancelled,
    onLinkSelected,
    onEnabledChanged,
  } = {}) {
    const svg = document.querySelector(svgSelector);

    if (!svg) {
      throw new Error(`SVG not found: ${svgSelector}`);
    }

    ManualRouteRendererV3.init(svg);

    ManualRouterEngineV3.configure({
      gridSize,

      onRouteChanged(link, reason) {
        onRouteChanged?.(link, reason);
        redrawLinks();
      },

      onRouteCancelled(link) {
        onDrawingCancelled?.(link);
      },

      onConvertToAuto(link) {
        if (typeof window.updateLinkGeometry === "function") {
          window.updateLinkGeometry(link);
        }

        redrawLinks();
      },
    });

    ManualRouteInputV3.init(svg, {
      resolveConnector,
      resolveLink,
      createLink,
      completeLink,
      onDrawingStarted,
      onDrawingFinished,
      onDrawingCancelled,
      onLinkSelected,
      onEnabledChanged,
    });

    ManualRouteBridgeV3.install();

    return {
      enable() {
        ManualRouteInputV3.setEnabled(true);
      },

      disable() {
        ManualRouteInputV3.setEnabled(false);
      },

      toggle() {
        ManualRouteInputV3.setEnabled(
          !ManualRouteInputV3.isEnabled(),
        );
      },

      isEnabled() {
        return ManualRouteInputV3.isEnabled();
      },

      convertToManual(link) {
        return ManualRouterEngineV3.convertToManual(link);
      },

      convertToAuto(link) {
        return ManualRouterEngineV3.convertToAuto(link);
      },
    };
  }

  window.initializeManualRoutingV3 = initializeManualRoutingV3;
})();
