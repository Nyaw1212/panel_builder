//----------------------------------
// Manual Route Handles V3
//----------------------------------

(function () {
  "use strict";

  let state = null;

  function begin({
    event,
    link,
    pointIndex,
    onChange,
    onComplete,
    gridSize = 12,
  }) {
    if (
      !link?.manualRoute?.points ||
      pointIndex <= 0 ||
      pointIndex >=
        link.manualRoute.points.length - 1
    ) {
      return;
    }

    state = {
      link,
      pointIndex,
      onChange,
      onComplete,
      gridSize,
    };

    event.target.setPointerCapture?.(
      event.pointerId,
    );

    window.addEventListener(
      "pointermove",
      handleMove,
    );

    window.addEventListener(
      "pointerup",
      handleUp,
      { once: true },
    );
  }

  function handleMove(event) {
    if (!state) return;

    const pointer =
      ManualRouteRendererV3.clientToSvgPoint(
        event,
      );

    const snapped =
      ManualRouteGridV3.snapPoint(
        pointer,
        state.gridSize,
      );

    const points =
      state.link.manualRoute.points.map(
        ManualRouteSegmentsV3.clonePoint,
      );

    const index = state.pointIndex;
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];

    const previousAxis =
      ManualRouteSnapV3.segmentAxis(
        previous,
        current,
      );

    const nextAxis =
      ManualRouteSnapV3.segmentAxis(
        current,
        next,
      );

    if (
      previousAxis === "horizontal" &&
      nextAxis === "vertical"
    ) {
      current.x = snapped.x;
      current.y = snapped.y;

      previous.y = current.y;
      next.x = current.x;
    } else if (
      previousAxis === "vertical" &&
      nextAxis === "horizontal"
    ) {
      current.x = snapped.x;
      current.y = snapped.y;

      previous.x = current.x;
      next.y = current.y;
    } else {
      current.x = snapped.x;
      current.y = snapped.y;
    }

    state.link.manualRoute.points =
      ManualRouteSegmentsV3.clean(points);

    state.onChange?.(
      state.link,
    );
  }

  function handleUp() {
    if (!state) return;

    state.onComplete?.(
      state.link,
    );

    window.removeEventListener(
      "pointermove",
      handleMove,
    );

    state = null;
  }

  function cancel() {
    window.removeEventListener(
      "pointermove",
      handleMove,
    );

    state = null;
  }

  window.ManualRouteHandlesV3 = {
    begin,
    cancel,
  };
})();
