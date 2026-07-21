//———————————- // Routing Pathfinder V2 //———————————-

const RoutingPathfinderV2 = (() => {

    function buildCandidates(start, end) {

        if (!start || !end) return [];

        const routes = [];

        // Horizontal then Vertical
        routes.push([
            clone(start),
            { x: end.x, y: start.y },
            clone(end)
        ]);

        // Vertical then Horizontal
        routes.push([
            clone(start),
            { x: start.x, y: end.y },
            clone(end)
        ]);

        // Offset Corridor Above
        const offset = RoutingConfigV2.COMB.LANE_SPACING;

        routes.push([
            clone(start),
            { x: start.x, y: start.y - offset },
            { x: end.x, y: start.y - offset },
            { x: end.x, y: end.y },
            clone(end)
        ]);

        // Offset Corridor Below
        routes.push([
            clone(start),
            { x: start.x, y: start.y + offset },
            { x: end.x, y: start.y + offset },
            { x: end.x, y: end.y },
            clone(end)
        ]);

        return routes
            .map(RoutingGeometryV2.removeDuplicatePoints)
            .map(RoutingGeometryV2.simplifyRoute);
    }

    function findRoute(start, end, options = {}) {

        RoutingObstacleV2.refresh();

        const candidates = buildCandidates(start, end);

        let best = null;
        let bestScore = Infinity;

        for (const candidate of candidates) {

            const validation = RoutingValidatorV2.validateRoute(
                candidate,
                options
            );

            if (!validation.valid) continue;

            const score = scoreRoute(candidate);

            if (score < bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        return best || [
            clone(start),
            clone(end)
        ];
    }

    function scoreRoute(points) {

        let score = 0;

        for (let i = 0; i < points.length - 1; i++) {

            const a = points[i];
            const b = points[i + 1];

            score += RoutingGeometryV2.segmentLength(a, b);

            if (i > 0) {

                const p = points[i - 1];

                const bend =
                    (p.x !== a.x && a.x === b.x) ||
                    (p.y !== a.y && a.y === b.y);

                if (bend) {
                    score += RoutingConfigV2.SCORE.BEND;
                }
            }
        }

        return score;
    }

    function clone(point) {
        return {
            x: point.x,
            y: point.y
        };
    }

    return {
        buildCandidates,
        findRoute
    };

})();

window.RoutingPathfinderV2 = RoutingPathfinderV2;