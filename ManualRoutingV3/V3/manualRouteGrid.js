//----------------------------------
// Manual Route Grid V3
//----------------------------------

(function () {
  "use strict";

  function snapValue(value, gridSize = 12) {
    const size = Number(gridSize) || 1;
    return Math.round(Number(value) / size) * size;
  }

  function snapPoint(point, gridSize = 12) {
    return {
      x: snapValue(point.x, gridSize),
      y: snapValue(point.y, gridSize),
    };
  }

  window.ManualRouteGridV3 = {
    snapValue,
    snapPoint,
  };
})();
