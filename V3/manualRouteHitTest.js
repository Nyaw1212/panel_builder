//----------------------------------
// Manual Route Hit Test V3
//----------------------------------

(function () {
  "use strict";

  function distanceToSegment(point, start, end) {
    const nearest =
      ManualRouteSegmentsV3.nearestPointOnSegment(
        point,
        start,
        end,
      );

    return Math.hypot(
      point.x - nearest.x,
      point.y - nearest.y,
    );
  }

  function findSegment(points, pointer, tolerance = 8) {
    let best = null;

    for (let index = 0; index < points.length - 1; index++) {
      const distance = distanceToSegment(
        pointer,
        points[index],
        points[index + 1],
      );

      if (
        distance <= tolerance &&
        (!best || distance < best.distance)
      ) {
        best = {
          segmentIndex: index,
          distance,
        };
      }
    }

    return best;
  }

  window.ManualRouteHitTestV3 = {
    distanceToSegment,
    findSegment,
  };
})();
