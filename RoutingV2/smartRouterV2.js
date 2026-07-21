//———————————- // Smart Router V2 //———————————-

const SmartRouterV2 = (() => {

    function createRoute(start, end, options = {}) {

        if (!start || !end) {
            return [];
        }

        //----------------------------------
        // Refresh obstacle cache
        //----------------------------------

        if (RoutingObstacleV2.refresh) {
            RoutingObstacleV2.refresh();
        }

        //----------------------------------
        // Generate candidates
        //----------------------------------

        const candidates =
            RoutingPathfinderV2.buildCandidates(
                start,
                end
            );

        if (!candidates.length) {
            return [];
        }

        //----------------------------------
        // Select best candidate
        //----------------------------------

        let best =
            RoutingScorerV2.selectBest(
                candidates,
                options
            );

        if (!best) {
            best = candidates[0];
        }

        //----------------------------------
        // Optimize
        //----------------------------------

        best =
            RoutingOptimizerV2.optimize(
                best
            );

        //----------------------------------
        // Final validation
        //----------------------------------

        const validation =
            RoutingValidatorV2.validateRoute(
                best,
                options
            );

        if (!validation.valid) {

            console.warn(
                "SmartRouterV2: optimized route failed validation.",
                validation
            );

        }

        //----------------------------------
        // Reserve lanes
        //----------------------------------

        RoutingLaneManagerV2.registerRoute(
            best,
            options.routeId || null
        );

        return best;

    }

    //----------------------------------
    // Batch Routing
    //----------------------------------

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

    //----------------------------------
    // Reset
    //----------------------------------

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