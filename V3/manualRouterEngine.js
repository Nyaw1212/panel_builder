//----------------------------------
// Manual Router Engine V3
//----------------------------------

(function () {
  "use strict";

  const DEFAULTS = {
    gridSize: 12,
    minSegmentLength: 6,
  };

  let options = {
    ...DEFAULTS,
  };

  let drawing = null;
  let selectedLink = null;

  function configure(nextOptions = {}) {
    options = {
      ...options,
      ...nextOptions,
    };
  }

  function begin(link, startPoint) {
    if (!link) {
      throw new Error(
        "A link object is required.",
      );
    }

    // Connector endpoints must remain exact. Only user-created
    // corners are snapped to the manual routing grid.
    const start =
      ManualRouteSegmentsV3.clonePoint(
        startPoint,
      );

    link.routingMode = "manual";

    link.manualRoute = {
      points: [start],
      locked: false,
    };

    drawing = {
      link,
      points: [start],
      pointer: start,
      preferredAxis: null,
    };

    selectedLink = link;

    ManualRouteRendererV3.renderPreview(
      drawing.points,
    );

    return link;
  }

  function updatePointer(pointer) {
    if (!drawing) return [];

    const snappedPointer =
      ManualRouteGridV3.snapPoint(
        pointer,
        options.gridSize,
      );

    const anchor =
      drawing.points[
        drawing.points.length - 1
      ];

    const previewPoint =
      ManualRouteSnapV3.orthogonalPoint(
        anchor,
        snappedPointer,
        drawing.preferredAxis,
      );

    drawing.pointer = previewPoint;

    const preview = [
      ...drawing.points,
      previewPoint,
    ];

    ManualRouteRendererV3.renderPreview(
      preview,
    );

    return preview;
  }

  function addCorner(pointer = null) {
    if (!drawing) return null;

    const target =
      pointer
        ? updatePointer(pointer).at(-1)
        : drawing.pointer;

    const anchor =
      drawing.points[
        drawing.points.length - 1
      ];

    if (
      Math.hypot(
        target.x - anchor.x,
        target.y - anchor.y,
      ) < options.minSegmentLength
    ) {
      return null;
    }

    drawing.points.push(
      ManualRouteSegmentsV3.clonePoint(
        target,
      ),
    );

    const currentAxis =
      ManualRouteSnapV3.segmentAxis(
        anchor,
        target,
      );

    drawing.preferredAxis =
      ManualRouteSnapV3.oppositeAxis(
        currentAxis,
      );

    drawing.link.manualRoute.points =
      ManualRouteSegmentsV3.clean(
        drawing.points,
      );

    return target;
  }

  function finish(endPoint) {
    if (!drawing) return null;

    // Preserve the exact destination connector center.
    const exactEnd =
      ManualRouteSegmentsV3.clonePoint(
        endPoint,
      );

    const anchor =
      drawing.points[
        drawing.points.length - 1
      ];

    const axisPoint =
      ManualRouteSnapV3.orthogonalPoint(
        anchor,
        exactEnd,
        drawing.preferredAxis,
      );

    const finalPoints = [
      ...drawing.points,
    ];

    if (
      !ManualRouteSegmentsV3.samePoint(
        anchor,
        axisPoint,
      )
    ) {
      finalPoints.push(axisPoint);
    }

    if (
      !ManualRouteSegmentsV3.samePoint(
        axisPoint,
        exactEnd,
      )
    ) {
      finalPoints.push(exactEnd);
    }

    const link = drawing.link;

    link.routingMode = "manual";

    link.manualRoute = {
      points:
        ManualRouteSegmentsV3.enforceOrthogonal(
          finalPoints,
        ),

      locked: false,
    };

    if (!link.geometry) {
      link.geometry = {};
    }

    link.geometry.type =
      "polyline";

    link.geometry.points =
      link.manualRoute.points.map(
        ManualRouteSegmentsV3.clonePoint,
      );

    link.geometry.router =
      "ManualRoutingV3";

    link.geometry.valid =
      link.geometry.points.length >= 2;

    drawing = null;

    ManualRouteRendererV3.clearPreview();

    select(link);

    options.onRouteChanged?.(
      link,
      "finish",
    );

    return link;
  }

  function cancel() {
    if (!drawing) return;

    const link = drawing.link;

    drawing = null;

    ManualRouteRendererV3.clearPreview();

    options.onRouteCancelled?.(
      link,
    );
  }

  function select(link) {
    selectedLink = link || null;

    if (
      selectedLink?.routingMode ===
        "manual" &&
      selectedLink.manualRoute?.points
    ) {
      ManualRouteRendererV3.renderHandles(
        selectedLink.manualRoute.points,
        {
          onHandlePointerDown(
            event,
            pointIndex,
          ) {
            ManualRouteHandlesV3.begin({
              event,
              link: selectedLink,
              pointIndex,
              gridSize:
                options.gridSize,

              onChange(changedLink) {
                syncGeometry(changedLink);

                options.onRouteChanged?.(
                  changedLink,
                  "handle-move",
                );

                select(changedLink);
              },

              onComplete(changedLink) {
                syncGeometry(changedLink);

                options.onRouteChanged?.(
                  changedLink,
                  "handle-complete",
                );

                select(changedLink);
              },
            });
          },
        },
      );
    } else {
      ManualRouteRendererV3.clearHandles();
    }

    return selectedLink;
  }

  function deselect() {
    selectedLink = null;

    ManualRouteRendererV3.clearHandles();
  }

  function syncGeometry(link) {
    if (
      !link ||
      link.routingMode !== "manual" ||
      !link.manualRoute
    ) {
      return link;
    }

    if (!link.geometry) {
      link.geometry = {};
    }

    link.manualRoute.points =
      ManualRouteSegmentsV3.enforceOrthogonal(
        link.manualRoute.points || [],
      );

    link.geometry.type =
      "polyline";

    link.geometry.points =
      link.manualRoute.points.map(
        ManualRouteSegmentsV3.clonePoint,
      );

    link.geometry.router =
      "ManualRoutingV3";

    link.geometry.valid =
      link.geometry.points.length >= 2;

    return link;
  }

  function convertToManual(link) {
    if (!link) return null;

    const sourcePoints =
      link.geometry?.points || [];

    link.routingMode = "manual";

    link.manualRoute = {
      points:
        ManualRouteSegmentsV3.enforceOrthogonal(
          sourcePoints,
        ),

      locked: false,
    };

    syncGeometry(link);
    select(link);

    options.onRouteChanged?.(
      link,
      "convert-to-manual",
    );

    return link;
  }

  function convertToAuto(link) {
    if (!link) return null;

    link.routingMode = "auto";
    link.manualRoute = null;

    deselect();

    options.onConvertToAuto?.(
      link,
    );

    return link;
  }

  function isDrawing() {
    return Boolean(drawing);
  }

  function getDrawingState() {
    return drawing;
  }

  function getSelectedLink() {
    return selectedLink;
  }

  window.ManualRouterEngineV3 = {
    configure,
    begin,
    updatePointer,
    addCorner,
    finish,
    cancel,
    select,
    deselect,
    syncGeometry,
    convertToManual,
    convertToAuto,
    isDrawing,
    getDrawingState,
    getSelectedLink,
  };
})();
