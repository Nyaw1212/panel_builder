//----------------------------------
// Manual Route Input V3
//----------------------------------

(function () {
  "use strict";

  let svg = null;
  let options = {};
  let enabled = false;

  function init(
    svgElement,
    nextOptions = {},
  ) {
    svg = svgElement;
    options = {
      resolveConnector:
        () => null,

      resolveLink:
        () => null,

      ...nextOptions,
    };

    svg.addEventListener(
      "pointermove",
      handlePointerMove,
    );

    svg.addEventListener(
      "click",
      handleClick,
    );

    svg.addEventListener(
      "dblclick",
      handleDoubleClick,
    );

    svg.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );
  }

  function setEnabled(value) {
    enabled = Boolean(value);

    document.documentElement.classList.toggle(
      "manual-routing-v3-active",
      enabled,
    );
  }

  function handlePointerMove(event) {
    if (
      !enabled ||
      !ManualRouterEngineV3.isDrawing()
    ) {
      return;
    }

    ManualRouterEngineV3.updatePointer(
      ManualRouteRendererV3.clientToSvgPoint(
        event,
      ),
    );
  }

  function handleClick(event) {
    if (!enabled) return;

    const connector =
      options.resolveConnector(
        event.target,
      );

    if (
      !ManualRouterEngineV3.isDrawing()
    ) {
      if (!connector) return;

      const link =
        options.createLink?.(
          connector,
        );

      if (!link) return;

      ManualRouterEngineV3.begin(
        link,
        connector.point,
      );

      options.onDrawingStarted?.(
        link,
        connector,
      );

      return;
    }

    if (connector) {
      const drawing =
        ManualRouterEngineV3.getDrawingState();

      options.completeLink?.(
        drawing.link,
        connector,
      );

      ManualRouterEngineV3.finish(
        connector.point,
      );

      options.onDrawingFinished?.(
        drawing.link,
        connector,
      );

      return;
    }

    ManualRouterEngineV3.addCorner(
      ManualRouteRendererV3.clientToSvgPoint(
        event,
      ),
    );
  }

  function handleDoubleClick(event) {
    if (
      !enabled ||
      !ManualRouterEngineV3.isDrawing()
    ) {
      return;
    }

    event.preventDefault();

    const drawing =
      ManualRouterEngineV3.getDrawingState();

    ManualRouterEngineV3.finish(
      ManualRouteRendererV3.clientToSvgPoint(
        event,
      ),
    );

    options.onDrawingFinished?.(
      drawing.link,
      null,
    );
  }

  function handlePointerDown(event) {
    if (!enabled) return;

    const link =
      options.resolveLink(
        event.target,
      );

    if (link) {
      ManualRouterEngineV3.select(
        link,
      );
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Escape" &&
      ManualRouterEngineV3.isDrawing()
    ) {
      ManualRouterEngineV3.cancel();

      options.onDrawingCancelled?.();
    }

    if (
      event.key === "Enter" &&
      ManualRouterEngineV3.isDrawing()
    ) {
      const drawing =
        ManualRouterEngineV3.getDrawingState();

      ManualRouterEngineV3.finish(
        drawing.pointer,
      );
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
