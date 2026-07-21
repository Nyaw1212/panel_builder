//----------------------------------
// Link Geometry
//----------------------------------

//----------------------------------
// Routing Mode
//----------------------------------

const LINK_GEOMETRY_USE_ROUTING_V2 = true;

//----------------------------------
// Initialize Geometry
//----------------------------------

function initializeLinkGeometry(link) {
  if (!link.geometry) {
    link.geometry = {
      type: "polyline",
      points: [],
      router: null,
      valid: false,
    };
  }

  if (!Array.isArray(link.geometry.points)) {
    link.geometry.points = [];
  }

  return link.geometry;
}

//----------------------------------
// Update Geometry
//----------------------------------

function updateLinkGeometry(link) {
  if (!link?.start || !link?.end) {
    return;
  }

  //----------------------------------
  // Connector Centers
  //----------------------------------

  const startCenter = getConnectionCenter(
    link.start.panelId,
    link.start.connectionId,
  );

  const endCenter = getConnectionCenter(
    link.end.panelId,
    link.end.connectionId,
  );

  //----------------------------------
  // Exit Points
  //----------------------------------

  const startExit = getNodeExitPoint(
    link.start.panelId,
    link.start.connectionId,
  );

  const endExit = getNodeExitPoint(
    link.end.panelId,
    link.end.connectionId,
  );

  //----------------------------------
  // Invalid Endpoints
  //----------------------------------

  if (
    !isLinkGeometryPoint(startCenter) ||
    !isLinkGeometryPoint(endCenter) ||
    !isLinkGeometryPoint(startExit) ||
    !isLinkGeometryPoint(endExit)
  ) {
    clearLinkGeometry(link);

    return;
  }

  //----------------------------------
  // Build Route
  //----------------------------------

  let route;

  if (
    LINK_GEOMETRY_USE_ROUTING_V2 &&
    window.SmartRouterV2 &&
    typeof SmartRouterV2.createRoute === "function"
  ) {
    route = createRouteV2(
      link,
      startCenter,
      startExit,
      endExit,
      endCenter,
    );
  } else {
    route = createLegacyRoute(
      link,
      startCenter,
      startExit,
      endExit,
      endCenter,
    );
  }

  setLinkGeometry(link, route);
}

//----------------------------------
// Create Route
//
// Compatibility wrapper retained because
// other files may still call createRoute().
//----------------------------------

function createRoute(
  link,
  startCenter,
  startExit,
  endExit,
  endCenter,
) {
  if (
    LINK_GEOMETRY_USE_ROUTING_V2 &&
    window.SmartRouterV2 &&
    typeof SmartRouterV2.createRoute === "function"
  ) {
    return createRouteV2(
      link,
      startCenter,
      startExit,
      endExit,
      endCenter,
    );
  }

  return createLegacyRoute(
    link,
    startCenter,
    startExit,
    endExit,
    endCenter,
  );
}

//----------------------------------
// Create Routing V2 Route
//----------------------------------

function createRouteV2(
  link,
  startCenter,
  startExit,
  endExit,
  endCenter,
) {
  //----------------------------------
  // Existing Routes
  //----------------------------------

  const existingRoutes =
    getExistingLinkRoutesForRouting(link);

  //----------------------------------
  // Smart Route
  //----------------------------------

  let middleRoute = [];

  try {
    middleRoute = SmartRouterV2.createRoute(
      cloneLinkGeometryPoint(startExit),
      cloneLinkGeometryPoint(endExit),
      {
        routeId: getLinkGeometryRouteId(link),

        link,

        sourceObstacleId:
          link.start.panelId,

        targetObstacleId:
          link.end.panelId,

        ignoredObstacleIds: [
          link.start.panelId,
          link.end.panelId,
        ].filter(
          (id) =>
            id !== undefined &&
            id !== null,
        ),

        existingRoutes,

        checkObstacles: true,
        checkExistingRoutes: true,
      },
    );
  } catch (error) {
    console.error(
      "Routing V2 failed. Falling back to legacy routing.",
      error,
    );

    return createLegacyRoute(
      link,
      startCenter,
      startExit,
      endExit,
      endCenter,
    );
  }

  //----------------------------------
  // Invalid V2 Result
  //----------------------------------

  if (
    !Array.isArray(middleRoute) ||
    middleRoute.length < 2
  ) {
    console.warn(
      "Routing V2 returned no usable route. Falling back to legacy routing.",
      link,
    );

    return createLegacyRoute(
      link,
      startCenter,
      startExit,
      endExit,
      endCenter,
    );
  }

  //----------------------------------
  // Preserve Exact Endpoints
  //----------------------------------

  const points = [
    cloneLinkGeometryPoint(startCenter),
    cloneLinkGeometryPoint(startExit),
    ...middleRoute.map(
      cloneLinkGeometryPoint,
    ),
    cloneLinkGeometryPoint(endExit),
    cloneLinkGeometryPoint(endCenter),
  ];

  return cleanupLinkGeometryRoute(
    points,
  );
}

//----------------------------------
// Create Legacy Route
//----------------------------------

function createLegacyRoute(
  link,
  startCenter,
  startExit,
  endExit,
  endCenter,
) {
  //----------------------------------
  // Get Grid Cells
  //----------------------------------

  const startCell = getNodeGridCell(
    link.start.panelId,
    link.start.connectionId,
  );

  const endCell = getNodeGridCell(
    link.end.panelId,
    link.end.connectionId,
  );

  if (!startCell || !endCell) {
    return cleanupLinkGeometryRoute([
      startCenter,
      startExit,
      endExit,
      endCenter,
    ]);
  }

  //----------------------------------
  // Node Sides
  //----------------------------------

  const startSide = getNodeSide(
    link.start.panelId,
    link.start.connectionId,
  );

  const endSide = getNodeSide(
    link.end.panelId,
    link.end.connectionId,
  );

  //----------------------------------
  // Find Path
  //----------------------------------

  const cells = findPath(
    startCell,
    endCell,
  );

  //----------------------------------
  // No Route
  //----------------------------------

  if (
    !Array.isArray(cells) ||
    !cells.length
  ) {
    return cleanupLinkGeometryRoute([
      startCenter,
      startExit,
      endExit,
      endCenter,
    ]);
  }

  //----------------------------------
  // Compress
  //----------------------------------

  const simplified =
    compressGridPath(cells);

  //----------------------------------
  // Build Grid Points
  //----------------------------------

  const gridPoints = [];

  for (
    let index = 1;
    index < simplified.length - 1;
    index++
  ) {
    gridPoints.push(
      gridToPixel(
        simplified[index],
      ),
    );
  }

  //----------------------------------
  // First / Last Grid Point
  //----------------------------------

  const firstGridPoint =
    gridPoints.length
      ? gridPoints[0]
      : endExit;

  const lastGridPoint =
    gridPoints.length
      ? gridPoints[
          gridPoints.length - 1
        ]
      : startExit;

  //----------------------------------
  // Transition Points
  //----------------------------------

  const startTransition =
    getStartTransition(
      startExit,
      firstGridPoint,
      startSide,
    );

  const endTransition =
    getEndTransition(
      lastGridPoint,
      endExit,
      endSide,
    );

  //----------------------------------
  // Build Pixel Route
  //----------------------------------

  const points = [
    startCenter,
    startExit,
  ];

  if (startTransition) {
    points.push(startTransition);
  }

  points.push(...gridPoints);

  if (endTransition) {
    points.push(endTransition);
  }

  points.push(
    endExit,
    endCenter,
  );

  //----------------------------------
  // Optimize Legacy Route
  //----------------------------------

  if (
    typeof optimizePixelRoute ===
    "function"
  ) {
    return optimizePixelRoute(
      points,
    );
  }

  return cleanupLinkGeometryRoute(
    points,
  );
}

//----------------------------------
// Existing Routes for V2
//----------------------------------

function getExistingLinkRoutesForRouting(
  currentLink,
) {
  const collections = [
    window.links,
    window.Links,
    window.linkStore?.links,
    window.LinkStore?.links,
    window.PanelBuilderState?.links,
    window.AppState?.links,
  ];

  for (
    let index = 0;
    index < collections.length;
    index++
  ) {
    const collection =
      collections[index];

    if (!Array.isArray(collection)) {
      continue;
    }

    return collection
      .filter(
        (link) =>
          link &&
          link !== currentLink &&
          Array.isArray(
            link.geometry?.points,
          ) &&
          link.geometry.points.length >= 2,
      )
      .map((link) => ({
        id:
          getLinkGeometryRouteId(link),

        points:
          link.geometry.points.map(
            cloneLinkGeometryPoint,
          ),
      }));
  }

  return [];
}

//----------------------------------
// Route ID
//----------------------------------

function getLinkGeometryRouteId(
  link,
) {
  return (
    link?.id ??
    link?.linkId ??
    link?.uuid ??
    null
  );
}

//----------------------------------
// Clean Route
//----------------------------------

function cleanupLinkGeometryRoute(
  points,
) {
  if (!Array.isArray(points)) {
    return [];
  }

  const cleaned = [];

  for (
    let index = 0;
    index < points.length;
    index++
  ) {
    const point = points[index];

    if (
      !isLinkGeometryPoint(point)
    ) {
      continue;
    }

    const normalized =
      cloneLinkGeometryPoint(point);

    const previous =
      cleaned[
        cleaned.length - 1
      ];

    if (
      previous &&
      previous.x === normalized.x &&
      previous.y === normalized.y
    ) {
      continue;
    }

    cleaned.push(normalized);
  }

  return cleaned;
}

//----------------------------------
// Point Helpers
//----------------------------------

function isLinkGeometryPoint(point) {
  return (
    point &&
    Number.isFinite(
      Number(point.x),
    ) &&
    Number.isFinite(
      Number(point.y),
    )
  );
}

function cloneLinkGeometryPoint(
  point,
) {
  return {
    x: Number(point.x),
    y: Number(point.y),
  };
}

//----------------------------------
// Set Geometry
//----------------------------------

function setLinkGeometry(
  link,
  points,
) {
  const geometry =
    initializeLinkGeometry(link);

  geometry.type = "polyline";

  geometry.points =
    cleanupLinkGeometryRoute(
      points,
    );

  geometry.router =
    LINK_GEOMETRY_USE_ROUTING_V2 &&
    window.SmartRouterV2
      ? "RoutingV2"
      : "Legacy";

  geometry.valid =
    geometry.points.length >= 2;
}

//----------------------------------
// Get Geometry
//----------------------------------

function getLinkGeometry(link) {
  return initializeLinkGeometry(link);
}

//----------------------------------
// Get Points
//----------------------------------

function getLinkPoints(link) {
  return initializeLinkGeometry(
    link,
  ).points;
}

//----------------------------------
// Clear Geometry
//----------------------------------

function clearLinkGeometry(link) {
  const geometry =
    initializeLinkGeometry(link);

  geometry.points = [];
  geometry.valid = false;
}

//----------------------------------
// Expose
//----------------------------------

window.initializeLinkGeometry =
  initializeLinkGeometry;

window.updateLinkGeometry =
  updateLinkGeometry;

window.createRoute =
  createRoute;

window.createRouteV2 =
  createRouteV2;

window.createLegacyRoute =
  createLegacyRoute;

window.setLinkGeometry =
  setLinkGeometry;

window.getLinkGeometry =
  getLinkGeometry;

window.getLinkPoints =
  getLinkPoints;

window.clearLinkGeometry =
  clearLinkGeometry;