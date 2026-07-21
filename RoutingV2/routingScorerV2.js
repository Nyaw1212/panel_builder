//———————————- // Routing Scorer V2 //———————————-

const RoutingScorerV2 = (() => {

    //----------------------------------
    // Score Route
    //----------------------------------

    function scoreRoute(
        points,
        options = {}
    ) {

        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            return Infinity;

        }

        const config =
            RoutingConfigV2.SCORE;

        let score = 0;

        const validation =
            RoutingValidatorV2.validateRoute(
                points,
                {
                    requireOrthogonal: true,

                    checkObstacles:
                        options.checkObstacles !==
                        false,

                    checkExistingRoutes:
                        options.checkExistingRoutes !==
                        false,

                    existingRoutes:
                        options.existingRoutes || [],

                    ignoredRouteIds:
                        options.ignoredRouteIds || [],

                    ignoredObstacleIds:
                        options.ignoredObstacleIds || [],

                    sourceObstacleId:
                        options.sourceObstacleId,

                    targetObstacleId:
                        options.targetObstacleId
                }
            );

        //----------------------------------
        // Invalid Route
        //----------------------------------

        if (!validation.valid) {

            const hasCollision =
                validation.errors.some(
                    error =>
                        error.code ===
                        "OBSTACLE_COLLISION"
                );

            if (hasCollision) {

                return Number(
                    config.PANEL_COLLISION
                ) || Infinity;

            }

            return Infinity;

        }

        //----------------------------------
        // Route Length
        //----------------------------------

        score +=
            getRouteLength(points) *
            (
                Number(
                    config.LENGTH
                ) || 1
            );

        //----------------------------------
        // Bend Cost
        //----------------------------------

        score +=
            getBendCount(points) *
            (
                Number(
                    config.BEND
                ) || 0
            );

        //----------------------------------
        // Existing Route Intersections
        //----------------------------------

        score +=
            validation.intersections.length *
            (
                Number(
                    config.INTERSECTION
                ) || 0
            );

        //----------------------------------
        // Existing Route Overlaps
        //----------------------------------

        score +=
            validation.overlaps.length *
            (
                Number(
                    config.OVERLAP
                ) || 0
            );

        //----------------------------------
        // Lane Occupancy
        //----------------------------------

        score +=
            getLaneOccupancyCost(
                points
            );

        //----------------------------------
        // Shared Trunk Bonus
        //----------------------------------

        score +=
            getSharedTrunkBonus(
                points,
                options.existingRoutes || []
            );

        //----------------------------------
        // Parallel Lane Bonus
        //----------------------------------

        score +=
            getParallelLaneBonus(
                points
            );

        //----------------------------------
        // Short Segment Penalty
        //----------------------------------

        score +=
            getShortSegmentPenalty(
                points
            );

        debugScore(
            points,
            score,
            validation
        );

        return score;

    }

    //----------------------------------
    // Route Length
    //----------------------------------

    function getRouteLength(points) {

        let total = 0;

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            total +=
                RoutingGeometryV2
                    .segmentLength(
                        points[index],
                        points[index + 1]
                    );

        }

        return total;

    }

    //----------------------------------
    // Bend Count
    //----------------------------------

    function getBendCount(points) {

        if (
            !Array.isArray(points) ||
            points.length < 3
        ) {

            return 0;

        }

        let bends = 0;

        for (
            let index = 1;
            index < points.length - 1;
            index++
        ) {

            const previous =
                points[index - 1];

            const current =
                points[index];

            const next =
                points[index + 1];

            const firstHorizontal =
                previous.y ===
                current.y;

            const secondHorizontal =
                current.y ===
                next.y;

            if (
                firstHorizontal !==
                secondHorizontal
            ) {

                bends++;

            }

        }

        return bends;

    }

    //----------------------------------
    // Lane Occupancy Cost
    //----------------------------------

    function getLaneOccupancyCost(points) {

        if (
            !RoutingConfigV2
                .LINKS
                .AVOID_OVERLAP
        ) {

            return 0;

        }

        let cost = 0;

        const overlapCost =
            Number(
                RoutingConfigV2
                    .SCORE
                    .OVERLAP
            ) || 0;

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const start =
                points[index];

            const end =
                points[index + 1];

            //----------------------------------
            // Horizontal
            //----------------------------------

            if (
                start.y === end.y
            ) {

                const left =
                    Math.min(
                        start.x,
                        end.x
                    );

                const right =
                    Math.max(
                        start.x,
                        end.x
                    );

                if (
                    RoutingLaneManagerV2
                        .isHorizontalOccupied(
                            start.y,
                            left,
                            right
                        )
                ) {

                    cost += overlapCost;

                }

                continue;

            }

            //----------------------------------
            // Vertical
            //----------------------------------

            if (
                start.x === end.x
            ) {

                const top =
                    Math.min(
                        start.y,
                        end.y
                    );

                const bottom =
                    Math.max(
                        start.y,
                        end.y
                    );

                if (
                    RoutingLaneManagerV2
                        .isVerticalOccupied(
                            start.x,
                            top,
                            bottom
                        )
                ) {

                    cost += overlapCost;

                }

            }

        }

        return cost;

    }

    //----------------------------------
    // Shared Trunk Bonus
    //----------------------------------

    function getSharedTrunkBonus(
        points,
        existingRoutes
    ) {

        if (
            !RoutingConfigV2
                .COMB
                .SHARED_TRUNK
        ) {

            return 0;

        }

        const bonus =
            Number(
                RoutingConfigV2
                    .SCORE
                    .SHARED_TRUNK_BONUS
            ) || 0;

        if (
            bonus === 0 ||
            !Array.isArray(
                existingRoutes
            )
        ) {

            return 0;

        }

        let sharedSegments = 0;

        for (
            let routeIndex = 0;
            routeIndex <
                existingRoutes.length;
            routeIndex++
        ) {

            const route =
                normalizeRoute(
                    existingRoutes[
                        routeIndex
                    ]
                );

            if (
                route.length < 2
            ) {

                continue;

            }

            for (
                let candidateIndex = 0;
                candidateIndex <
                    points.length - 1;
                candidateIndex++
            ) {

                for (
                    let existingIndex = 0;
                    existingIndex <
                        route.length - 1;
                    existingIndex++
                ) {

                    const relation =
                        RoutingValidatorV2
                            .classifySegmentRelation(
                                points[
                                    candidateIndex
                                ],
                                points[
                                    candidateIndex + 1
                                ],
                                route[
                                    existingIndex
                                ],
                                route[
                                    existingIndex + 1
                                ]
                            );

                    if (
                        relation.type ===
                        "overlap"
                    ) {

                        sharedSegments++;

                    }

                }

            }

        }

        return (
            sharedSegments *
            bonus
        );

    }

    //----------------------------------
    // Parallel Lane Bonus
    //----------------------------------

    function getParallelLaneBonus(
        points
    ) {

        if (
            !RoutingConfigV2
                .COMB
                .ENABLED
        ) {

            return 0;

        }

        const bonus =
            Number(
                RoutingConfigV2
                    .SCORE
                    .PARALLEL_BONUS
            ) || 0;

        const spacing =
            Number(
                RoutingConfigV2
                    .COMB
                    .LANE_SPACING
            ) || 0;

        if (
            bonus === 0 ||
            spacing <= 0
        ) {

            return 0;

        }

        let matched = 0;

        const horizontalLanes =
            RoutingLaneManagerV2
                .getHorizontalLanes();

        const verticalLanes =
            RoutingLaneManagerV2
                .getVerticalLanes();

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const start =
                points[index];

            const end =
                points[index + 1];

            //----------------------------------
            // Horizontal Parallel Lane
            //----------------------------------

            if (
                start.y === end.y
            ) {

                for (
                    const laneY of
                    horizontalLanes.keys()
                ) {

                    if (
                        Math.abs(
                            start.y -
                            laneY
                        ) === spacing
                    ) {

                        matched++;

                        break;

                    }

                }

                continue;

            }

            //----------------------------------
            // Vertical Parallel Lane
            //----------------------------------

            if (
                start.x === end.x
            ) {

                for (
                    const laneX of
                    verticalLanes.keys()
                ) {

                    if (
                        Math.abs(
                            start.x -
                            laneX
                        ) === spacing
                    ) {

                        matched++;

                        break;

                    }

                }

            }

        }

        return (
            matched *
            bonus
        );

    }

    //----------------------------------
    // Short Segment Penalty
    //----------------------------------

    function getShortSegmentPenalty(
        points
    ) {

        const minimum =
            Number(
                RoutingConfigV2
                    .LINKS
                    .MIN_SEGMENT_LENGTH
            ) || 0;

        if (
            minimum <= 0
        ) {

            return 0;

        }

        const bendCost =
            Number(
                RoutingConfigV2
                    .SCORE
                    .BEND
            ) || 0;

        let penalty = 0;

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const length =
                RoutingGeometryV2
                    .segmentLength(
                        points[index],
                        points[index + 1]
                    );

            if (
                length > 0 &&
                length < minimum
            ) {

                penalty += bendCost;

            }

        }

        return penalty;

    }

    //----------------------------------
    // Rank Candidates
    //----------------------------------

    function rankCandidates(
        candidates,
        options = {}
    ) {

        if (
            !Array.isArray(candidates)
        ) {

            return [];

        }

        return candidates
            .map(
                (
                    points,
                    index
                ) => ({

                    index,

                    points,

                    score:
                        scoreRoute(
                            points,
                            options
                        )

                })
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    first.score -
                    second.score
            );

    }

    //----------------------------------
    // Best Candidate
    //----------------------------------

    function selectBest(
        candidates,
        options = {}
    ) {

        const ranked =
            rankCandidates(
                candidates,
                options
            );

        const best =
            ranked.find(
                candidate =>
                    Number.isFinite(
                        candidate.score
                    )
            );

        return best
            ? best.points
            : null;

    }

    //----------------------------------
    // Normalize Route
    //----------------------------------

    function normalizeRoute(route) {

        if (
            Array.isArray(route)
        ) {

            return route;

        }

        if (
            Array.isArray(
                route?.points
            )
        ) {

            return route.points;

        }

        if (
            Array.isArray(
                route
                    ?.geometry
                    ?.points
            )
        ) {

            return route
                .geometry
                .points;

        }

        return [];

    }

    //----------------------------------
    // Debug
    //----------------------------------

    function debugScore(
        points,
        score,
        validation
    ) {

        if (
            !RoutingConfigV2
                .DEBUG
                .ENABLED ||
            !RoutingConfigV2
                .DEBUG
                .DRAW_ROUTE_SCORE
        ) {

            return;

        }

        console.log(
            "[RoutingScorerV2]",
            {
                score,
                points,
                validation
            }
        );

    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {

        scoreRoute,

        getRouteLength,

        getBendCount,

        rankCandidates,

        selectBest

    };

})();

//———————————- // Expose //———————————-

window.RoutingScorerV2 = RoutingScorerV2;