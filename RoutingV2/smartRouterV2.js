//----------------------------------
// Smart Router V2
//----------------------------------

const SmartRouterV2 = (() => {

    function createRoute(start, end, options = {}) {

        if (!start || !end) {
            return [];
        }

        if (RoutingObstacleV2.refresh) {
            RoutingObstacleV2.refresh();
        }

        //----------------------------------
        // Generate obstacle-aware candidates
        //----------------------------------

        const candidates = RoutingPathfinderV2.buildCandidates(
            start,
            end,
            options
        );

        if (!candidates.length) {
            return [];
        }

        //----------------------------------
        // Select and optimize a valid route
        //----------------------------------

        let best = RoutingScorerV2.selectBest(candidates, options);

        if (!best) {
            console.warn(
                "SmartRouterV2: no valid route was found.",
                { start, end, options }
            );
            return [];
        }

        best = RoutingOptimizerV2.optimize(best);

        const validation = RoutingValidatorV2.validateRoute(best, options);

        if (!validation.valid) {
            console.warn(
                "SmartRouterV2: optimized route failed validation.",
                validation
            );
            return [];
        }

        RoutingLaneManagerV2.registerRoute(
            best,
            options.routeId || null
        );

        return best;
    }

    function createRoutes(routes = []) {

        RoutingLaneManagerV2.reset();

        return routes.map(route => ({
            id: route.id,
            points: createRoute(
                route.start,
                route.end,
                {
                    ...route,
                    routeId: route.id
                }
            )
        }));
    }

    function reset() {

        RoutingLaneManagerV2.reset();

        if (RoutingObstacleV2.refresh) {
            RoutingObstacleV2.refresh();
        }
    }

    return {
        createRoute,
        createRoutes,
        reset
    };

})();

window.SmartRouterV2 = SmartRouterV2;
