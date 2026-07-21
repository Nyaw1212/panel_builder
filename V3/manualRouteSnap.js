//----------------------------------
// Manual Route Snap V3
//----------------------------------

(function () {
  "use strict";

  function orthogonalPoint(anchor, pointer, preferredAxis = null) {
    const dx = Math.abs(pointer.x - anchor.x);
    const dy = Math.abs(pointer.y - anchor.y);

    let axis = preferredAxis;

    if (axis !== "horizontal" && axis !== "vertical") {
      axis = dx >= dy
        ? "horizontal"
        : "vertical";
    }

    return axis === "horizontal"
      ? { x: pointer.x, y: anchor.y }
      : { x: anchor.x, y: pointer.y };
  }

  function oppositeAxis(axis) {
    return axis === "horizontal"
      ? "vertical"
      : "horizontal";
  }

  function segmentAxis(a, b) {
    if (a.y === b.y) return "horizontal";
    if (a.x === b.x) return "vertical";
    return null;
  }

  window.ManualRouteSnapV3 = {
    orthogonalPoint,
    oppositeAxis,
    segmentAxis,
  };
})();
