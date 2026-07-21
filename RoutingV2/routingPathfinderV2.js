//----------------------------------
// Routing Pathfinder V2
//----------------------------------

const RoutingPathfinderV2 = (() => {

    const EPSILON = 0.000001;

    //----------------------------------
    // Build Route Candidates
    //----------------------------------

    function buildCandidates(start, end, options = {}) {

        if (!isPoint(start) || !isPoint(end)) {
            return [];
        }

        const routes = [];

        // The obstacle-aware candidate is intentionally first.
        const searched = findOrthogonalRoute(start, end, options);

        if (searched.length >= 2) {
            routes.push(searched);
        }

        // Keep the inexpensive legacy shapes as alternatives. The scorer and
        // validator will discard them when they cross equipment.
        routes.push(...buildLegacyCandidates(start, end));

        return uniqueRoutes(
            routes
                .map(route => RoutingGeometryV2.removeDuplicatePoints(route))
                .map(route => RoutingGeometryV2.simplifyRoute(route))
                .filter(route => route.length >= 2)
        );
    }

    //----------------------------------
    // Orthogonal A* Search
    //----------------------------------

    function findOrthogonalRoute(start, end, options = {}) {

        const obstacles = getActiveObstacles(options);
        const axes = buildRoutingAxes(start, end, obstacles, options);
        const graph = buildGraph(axes, obstacles, options);

        const startKey = pointKey(start);
        const endKey = pointKey(end);

        if (!graph.has(startKey) || !graph.has(endKey)) {
            return [];
        }

        const open = [];
        const bestCost = new Map();

        const initial = {
            key: startKey,
            point: clone(start),
            direction: null,
            cost: 0,
            estimate: manhattan(start, end),
            parent: null
        };

        open.push(initial);
        bestCost.set(stateKey(startKey, null), 0);

        const maxIterations = Number(
            RoutingConfigV2?.ROUTE?.MAX_ITERATIONS
        ) || 5000;

        let iterations = 0;

        while (open.length > 0 && iterations < maxIterations) {

            iterations++;
            open.sort((a, b) => a.estimate - b.estimate);

            const current = open.shift();

            if (current.key === endKey) {
                return reconstruct(current);
            }

            const neighbors = graph.get(current.key) || [];

            for (const neighbor of neighbors) {

                const direction = getDirection(current.point, neighbor.point);
                const bendCost =
                    current.direction && current.direction !== direction
                        ? Number(RoutingConfigV2?.SCORE?.BEND) || 0
                        : 0;

                const nextCost =
                    current.cost +
                    neighbor.length +
                    bendCost +
                    getExistingRouteCost(
                        current.point,
                        neighbor.point,
                        options
                    );

                const nextStateKey = stateKey(neighbor.key, direction);

                if (
                    bestCost.has(nextStateKey) &&
                    bestCost.get(nextStateKey) <= nextCost
                ) {
                    continue;
                }

                bestCost.set(nextStateKey, nextCost);

                open.push({
                    key: neighbor.key,
                    point: neighbor.point,
                    direction,
                    cost: nextCost,
                    estimate: nextCost + manhattan(neighbor.point, end),
                    parent: current
                });
            }
        }

        return [];
    }

    //----------------------------------
    // Routing Axes
    //----------------------------------

    function buildRoutingAxes(start, end, obstacles, options) {

        const spacing = Math.max(
            2,
            Number(options.searchSpacing) ||
            Number(RoutingConfigV2?.ROUTE?.SEARCH_SPACING) ||
            Number(RoutingConfigV2?.COMB?.LANE_SPACING) ||
            16
        );

        const xs = new Set([start.x, end.x]);
        const ys = new Set([start.y, end.y]);

        // Nearby endpoint corridors allow A* to leave a connector even when
        // its exact axis is blocked farther along the route.
        xs.add(start.x - spacing);
        xs.add(start.x + spacing);
        xs.add(end.x - spacing);
        xs.add(end.x + spacing);
        ys.add(start.y - spacing);
        ys.add(start.y + spacing);
        ys.add(end.y - spacing);
        ys.add(end.y + spacing);

        for (const obstacle of obstacles) {
            xs.add(obstacle.left - spacing);
            xs.add(obstacle.right + spacing);
            ys.add(obstacle.top - spacing);
            ys.add(obstacle.bottom + spacing);
        }

        const bounds = getSearchBounds(start, end, obstacles, spacing);

        xs.add(bounds.left);
        xs.add(bounds.right);
        ys.add(bounds.top);
        ys.add(bounds.bottom);

        return {
            xs: Array.from(xs)
                .filter(value => value >= bounds.left && value <= bounds.right)
                .sort((a, b) => a - b),
            ys: Array.from(ys)
                .filter(value => value >= bounds.top && value <= bounds.bottom)
                .sort((a, b) => a - b)
        };
    }

    function getSearchBounds(start, end, obstacles, spacing) {

        const configuredDistance = Number(
            RoutingConfigV2?.ROUTE?.MAX_SEARCH_DISTANCE
        ) || 500;

        let left = Math.min(start.x, end.x) - spacing * 2;
        let right = Math.max(start.x, end.x) + spacing * 2;
        let top = Math.min(start.y, end.y) - spacing * 2;
        let bottom = Math.max(start.y, end.y) + spacing * 2;

        for (const obstacle of obstacles) {
            left = Math.min(left, obstacle.left - spacing);
            right = Math.max(right, obstacle.right + spacing);
            top = Math.min(top, obstacle.top - spacing);
            bottom = Math.max(bottom, obstacle.bottom + spacing);
        }

        return {
            left: Math.max(
                Math.min(start.x, end.x) - configuredDistance,
                left
            ),
            right: Math.min(
                Math.max(start.x, end.x) + configuredDistance,
                right
            ),
            top: Math.max(
                Math.min(start.y, end.y) - configuredDistance,
                top
            ),
            bottom: Math.min(
                Math.max(start.y, end.y) + configuredDistance,
                bottom
            )
        };
    }

    //----------------------------------
    // Visibility Graph
    //----------------------------------

    function buildGraph(axes, obstacles, options) {

        const graph = new Map();
        const rows = new Map();
        const columns = new Map();

        for (const y of axes.ys) {
            for (const x of axes.xs) {

                const point = { x, y };

                if (pointBlocked(point, obstacles)) {
                    continue;
                }

                const key = pointKey(point);
                graph.set(key, []);

                if (!rows.has(y)) rows.set(y, []);
                if (!columns.has(x)) columns.set(x, []);

                rows.get(y).push(point);
                columns.get(x).push(point);
            }
        }

        connectAxisGroups(rows, "x", graph, options);
        connectAxisGroups(columns, "y", graph, options);

        return graph;
    }

    function connectAxisGroups(groups, sortProperty, graph, options) {

        for (const points of groups.values()) {

            points.sort((a, b) => a[sortProperty] - b[sortProperty]);

            for (let index = 0; index < points.length - 1; index++) {
                const first = points[index];
                const second = points[index + 1];

                if (!segmentClear(first, second, options)) {
                    continue;
                }

                addEdge(graph, first, second);
                addEdge(graph, second, first);
            }
        }
    }

    function addEdge(graph, from, to) {
        graph.get(pointKey(from)).push({
            key: pointKey(to),
            point: clone(to),
            length: manhattan(from, to)
        });
    }

    //----------------------------------
    // Obstacles
    //----------------------------------

    function getActiveObstacles(options) {

        const ignored = new Set([
            ...normalizeIds(options.ignoredObstacleIds),
            ...normalizeIds(options.sourceObstacleId),
            ...normalizeIds(options.targetObstacleId)
        ].map(String));

        const obstacles =
            typeof RoutingObstacleV2?.getObstacles === "function"
                ? RoutingObstacleV2.getObstacles()
                : [];

        return obstacles.filter(obstacle => !ignored.has(String(obstacle.id)));
    }

    function pointBlocked(point, obstacles) {
        return obstacles.some(obstacle =>
            RoutingObstacleV2.pointInsideObstacle(point, obstacle)
        );
    }

    function segmentClear(start, end, options) {
        return !RoutingObstacleV2.segmentHitsObstacle(
            start,
            end,
            [
                ...normalizeIds(options.ignoredObstacleIds),
                ...normalizeIds(options.sourceObstacleId),
                ...normalizeIds(options.targetObstacleId)
            ]
        );
    }

    //----------------------------------
    // Existing Route Cost
    //----------------------------------

    function getExistingRouteCost(start, end, options) {

        if (!Array.isArray(options.existingRoutes)) {
            return 0;
        }

        let cost = 0;

        for (const route of options.existingRoutes) {
            const points = route?.points || route?.geometry?.points || route;

            if (!Array.isArray(points)) continue;

            for (let index = 0; index < points.length - 1; index++) {
                const relation = RoutingValidatorV2.classifySegmentRelation(
                    start,
                    end,
                    points[index],
                    points[index + 1]
                );

                if (relation.type === "overlap") {
                    cost += Number(RoutingConfigV2?.SCORE?.OVERLAP) || 0;
                } else if (relation.type === "intersection") {
                    cost += Number(RoutingConfigV2?.SCORE?.INTERSECTION) || 0;
                }
            }
        }

        return cost;
    }

    //----------------------------------
    // Legacy Candidates
    //----------------------------------

    function buildLegacyCandidates(start, end) {

        const offset = Number(RoutingConfigV2?.COMB?.LANE_SPACING) || 16;

        return [
            [clone(start), { x: end.x, y: start.y }, clone(end)],
            [clone(start), { x: start.x, y: end.y }, clone(end)],
            [
                clone(start),
                { x: start.x, y: start.y - offset },
                { x: end.x, y: start.y - offset },
                { x: end.x, y: end.y },
                clone(end)
            ],
            [
                clone(start),
                { x: start.x, y: start.y + offset },
                { x: end.x, y: start.y + offset },
                { x: end.x, y: end.y },
                clone(end)
            ]
        ];
    }

    //----------------------------------
    // Public Find Route
    //----------------------------------

    function findRoute(start, end, options = {}) {

        RoutingObstacleV2.refresh();

        const candidates = buildCandidates(start, end, options);

        return RoutingScorerV2.selectBest(candidates, options) || [];
    }

    //----------------------------------
    // Utilities
    //----------------------------------

    function reconstruct(state) {
        const points = [];
        let current = state;

        while (current) {
            points.push(clone(current.point));
            current = current.parent;
        }

        return RoutingGeometryV2.simplifyRoute(points.reverse());
    }

    function uniqueRoutes(routes) {
        const seen = new Set();

        return routes.filter(route => {
            const key = route.map(pointKey).join("|");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function getDirection(start, end) {
        return Math.abs(start.x - end.x) < EPSILON ? "vertical" : "horizontal";
    }

    function pointKey(point) {
        return `${normalizeNumber(point.x)},${normalizeNumber(point.y)}`;
    }

    function stateKey(key, direction) {
        return `${key}:${direction || "start"}`;
    }

    function normalizeNumber(value) {
        return Math.round(Number(value) * 1000) / 1000;
    }

    function manhattan(first, second) {
        return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
    }

    function normalizeIds(value) {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }

    function isPoint(point) {
        return point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
    }

    function clone(point) {
        return { x: Number(point.x), y: Number(point.y) };
    }

    return {
        buildCandidates,
        findOrthogonalRoute,
        findRoute
    };

})();

window.RoutingPathfinderV2 = RoutingPathfinderV2;
