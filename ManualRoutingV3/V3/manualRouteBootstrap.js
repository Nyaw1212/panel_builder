//----------------------------------
// Manual Routing V3 Bootstrap
//----------------------------------

(function () {
  "use strict";

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
  } = {}) {
    const svg =
      document.querySelector(
        svgSelector,
      );

    if (!svg) {
      throw new Error(
        `SVG not found: ${svgSelector}`,
      );
    }

    ManualRouteRendererV3.init(svg);

    ManualRouterEngineV3.configure({
      gridSize,

      onRouteChanged(link, reason) {
        onRouteChanged?.(
          link,
          reason,
        );

        if (
          typeof window.renderLinks ===
          "function"
        ) {
          window.renderLinks();
        }
      },

      onConvertToAuto(link) {
        if (
          typeof window.updateLinkGeometry ===
          "function"
        ) {
          window.updateLinkGeometry(link);
        }

        if (
          typeof window.renderLinks ===
          "function"
        ) {
          window.renderLinks();
        }
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
    });

    ManualRouteBridgeV3.install();

    return {
      enable() {
        ManualRouteInputV3.setEnabled(
          true,
        );
      },

      disable() {
        ManualRouteInputV3.setEnabled(
          false,
        );
      },

      toggle() {
        ManualRouteInputV3.setEnabled(
          !ManualRouteInputV3.isEnabled(),
        );
      },

      convertToManual(link) {
        return ManualRouterEngineV3.convertToManual(
          link,
        );
      },

      convertToAuto(link) {
        return ManualRouterEngineV3.convertToAuto(
          link,
        );
      },
    };
  }

  window.initializeManualRoutingV3 =
    initializeManualRoutingV3;
})();
