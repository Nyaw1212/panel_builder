//----------------------------------
// Manual Route Renderer V3
//----------------------------------

(function () {
  "use strict";

  const SVG_NS =
    "http://www.w3.org/2000/svg";

  let svg = null;
  let layer = null;
  let previewPath = null;
  let handlesGroup = null;

  function init(svgElement) {
    svg = svgElement;

    if (!svg) {
      throw new Error(
        "ManualRouteRendererV3 requires an SVG element.",
      );
    }

    layer = svg.querySelector(
      '[data-manual-route-v3="layer"]',
    );

    if (!layer) {
      layer = document.createElementNS(
        SVG_NS,
        "g",
      );

      layer.dataset.manualRouteV3 =
        "layer";

      svg.appendChild(layer);
    }

    previewPath = document.createElementNS(
      SVG_NS,
      "path",
    );

    previewPath.classList.add(
      "manual-route-v3__preview",
    );

    previewPath.setAttribute(
      "fill",
      "none",
    );

    handlesGroup = document.createElementNS(
      SVG_NS,
      "g",
    );

    handlesGroup.classList.add(
      "manual-route-v3__handles",
    );

    layer.append(
      previewPath,
      handlesGroup,
    );
  }

  function bringLayerToFront() {
    if (svg && layer?.parentNode === svg) {
      svg.appendChild(layer);
    }
  }

  function renderPreview(points) {
    if (!previewPath) return;

    bringLayerToFront();

    previewPath.setAttribute(
      "d",
      ManualRouteSegmentsV3.toPathData(
        points,
      ),
    );

    previewPath.hidden =
      !points || points.length < 2;
  }

  function clearPreview() {
    if (!previewPath) return;

    previewPath.setAttribute("d", "");
    previewPath.hidden = true;
  }

  function renderHandles(
    points,
    callbacks = {},
  ) {
    if (!handlesGroup) return;

    bringLayerToFront();
    handlesGroup.replaceChildren();

    points.forEach((point, index) => {
      if (
        index === 0 ||
        index === points.length - 1
      ) {
        return;
      }

      const handle =
        document.createElementNS(
          SVG_NS,
          "rect",
        );

      handle.setAttribute(
        "x",
        point.x - 5,
      );

      handle.setAttribute(
        "y",
        point.y - 5,
      );

      handle.setAttribute(
        "width",
        10,
      );

      handle.setAttribute(
        "height",
        10,
      );

      handle.dataset.pointIndex =
        String(index);

      handle.classList.add(
        "manual-route-v3__handle",
      );

      handle.addEventListener(
        "pointerdown",
        (event) => {
          event.stopPropagation();

          callbacks.onHandlePointerDown?.(
            event,
            index,
          );
        },
      );

      handlesGroup.appendChild(handle);
    });
  }

  function clearHandles() {
    handlesGroup?.replaceChildren();
  }

  function clientToSvgPoint(event) {
    if (!svg) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const matrix =
      svg.getScreenCTM();

    if (!matrix) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const point =
      svg.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;

    const transformed =
      point.matrixTransform(
        matrix.inverse(),
      );

    return {
      x: transformed.x,
      y: transformed.y,
    };
  }

  window.ManualRouteRendererV3 = {
    init,
    renderPreview,
    clearPreview,
    renderHandles,
    clearHandles,
    clientToSvgPoint,
  };
})();
