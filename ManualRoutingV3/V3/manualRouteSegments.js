//----------------------------------
// Manual Route Segments V3
//----------------------------------

(function () {
  "use strict";

  const EPSILON = 0.001;

  function isPoint(point) {
    return (
      point &&
      Number.isFinite(Number(point.x)) &&
      Number.isFinite(Number(point.y))
    );
  }

  function clonePoint(point) {
    return {
      x: Number(point.x),
      y: Number(point.y),
    };
  }

  function samePoint(a, b) {
    return (
      Math.abs(a.x - b.x) <= EPSILON &&
      Math.abs(a.y - b.y) <= EPSILON
    );
  }

  function isCollinear(a, b, c) {
    return (
      (a.x === b.x && b.x === c.x) ||
      (a.y === b.y && b.y === c.y)
    );
  }

  function clean(points = []) {
    const valid = points
      .filter(isPoint)
      .map(clonePoint);

    const deduped = [];

    valid.forEach((point) => {
      const previous = deduped[deduped.length - 1];

      if (!previous || !samePoint(previous, point)) {
        deduped.push(point);
      }
    });

    let changed = true;

    while (changed && deduped.length >= 3) {
      changed = false;

      for (let index = 1; index < deduped.length - 1; index++) {
        if (
          isCollinear(
            deduped[index - 1],
            deduped[index],
            deduped[index + 1],
          )
        ) {
          deduped.splice(index, 1);
          changed = true;
          break;
        }
      }
    }

    return deduped;
  }

  function enforceOrthogonal(points = []) {
    if (points.length < 2) {
      return clean(points);
    }

    const output = [clonePoint(points[0])];

    for (let index = 1; index < points.length; index++) {
      const previous = output[output.length - 1];
      const current = clonePoint(points[index]);

      if (previous.x === current.x || previous.y === current.y) {
        output.push(current);
        continue;
      }

      output.push({
        x: current.x,
        y: previous.y,
      });

      output.push(current);
    }

    return clean(output);
  }

  function toPathData(points = []) {
    const cleaned = clean(points);

    if (!cleaned.length) return "";

    return cleaned
      .map((point, index) => (
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      ))
      .join(" ");
  }

  function nearestPointOnSegment(pointer, start, end) {
    if (start.y === end.y) {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);

      return {
        x: Math.max(minX, Math.min(maxX, pointer.x)),
        y: start.y,
      };
    }

    if (start.x === end.x) {
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      return {
        x: start.x,
        y: Math.max(minY, Math.min(maxY, pointer.y)),
      };
    }

    return clonePoint(start);
  }

  window.ManualRouteSegmentsV3 = {
    EPSILON,
    isPoint,
    clonePoint,
    samePoint,
    clean,
    enforceOrthogonal,
    toPathData,
    nearestPointOnSegment,
  };
})();
