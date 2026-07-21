//----------------------------------
// Routing Validator V2
//----------------------------------

const RoutingValidatorV2 = (() => {

    //----------------------------------
    // Validate Route
    //----------------------------------

    function validateRoute(
        points,
        options = {}
    ) {

        const result = {

            valid: true,

            points:
                Array.isArray(points)
                    ? points
                    : [],

            errors: [],

            warnings: [],

            collisions: [],

            intersections: [],

            overlaps: []

        };

        //----------------------------------
        // Basic Validation
        //----------------------------------

        if (
            !Array.isArray(points)
        ) {

            addError(
                result,
                "ROUTE_NOT_ARRAY",
                "Route must be an array."
            );

            return result;

        }

        if (
            points.length < 2
        ) {

            addError(
                result,
                "ROUTE_TOO_SHORT",
                "Route requires at least two points."
            );

            return result;

        }

        //----------------------------------
        // Point Validation
        //----------------------------------

        validatePoints(
            points,
            result
        );

        //----------------------------------
        // Orthogonal Validation
        //----------------------------------

        if (
            options.requireOrthogonal !==
            false
        ) {

            validateOrthogonalSegments(
                points,
                result
            );

        }

        //----------------------------------
        // Duplicate Points
        //----------------------------------

        validateDuplicatePoints(
            points,
            result
        );

        //----------------------------------
        // Minimum Segment Length
        //----------------------------------

        validateSegmentLengths(
            points,
            result
        );

        //----------------------------------
        // Obstacle Validation
        //----------------------------------

        if (
            options.checkObstacles !==
            false
        ) {

            validateObstacles(
                points,
                result,
                options
            );

        }

        //----------------------------------
        // Existing Routes
        //----------------------------------

        if (
            options.checkExistingRoutes !==
            false
        ) {

            validateExistingRoutes(
                points,
                result,
                options
            );

        }

        //----------------------------------
        // Final Status
        //----------------------------------

        result.valid =
            result.errors.length === 0;

        debugValidation(
            result
        );

        return result;

    }

    //----------------------------------
    // Validate Points
    //----------------------------------

    function validatePoints(
        points,
        result
    ) {

        points.forEach(
            (
                point,
                index
            ) => {

                if (
                    !isValidPoint(point)
                ) {

                    addError(
                        result,
                        "INVALID_POINT",
                        `Invalid route point at index ${index}.`,
                        {
                            index,
                            point
                        }
                    );

                }

            }
        );

    }

    //----------------------------------
    // Valid Point
    //----------------------------------

    function isValidPoint(point) {

        return Boolean(

            point &&

            Number.isFinite(
                point.x
            ) &&

            Number.isFinite(
                point.y
            )

        );

    }

    //----------------------------------
    // Orthogonal Segments
    //----------------------------------

    function validateOrthogonalSegments(
        points,
        result
    ) {

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const start =
                points[index];

            const end =
                points[index + 1];

            if (
                !isValidPoint(start) ||
                !isValidPoint(end)
            ) {

                continue;

            }

            if (
                !RoutingGeometryV2
                    .isOrthogonal(
                        start,
                        end
                    )
            ) {

                addError(
                    result,
                    "DIAGONAL_SEGMENT",
                    `Segment ${index} is not orthogonal.`,
                    {
                        index,
                        start,
                        end
                    }
                );

            }

        }

    }

    //----------------------------------
    // Duplicate Points
    //----------------------------------

    function validateDuplicatePoints(
        points,
        result
    ) {

        for (
            let index = 1;
            index < points.length;
            index++
        ) {

            const previous =
                points[index - 1];

            const current =
                points[index];

            if (
                !isValidPoint(previous) ||
                !isValidPoint(current)
            ) {

                continue;

            }

            if (
                pointsEqual(
                    previous,
                    current
                )
            ) {

                addWarning(
                    result,
                    "DUPLICATE_POINT",
                    `Duplicate point at index ${index}.`,
                    {
                        index,
                        point: current
                    }
                );

            }

        }

    }

    //----------------------------------
    // Segment Lengths
    //----------------------------------

    function validateSegmentLengths(
        points,
        result
    ) {

        const minimumLength =

            Number(
                RoutingConfigV2
                    ?.LINKS
                    ?.MIN_SEGMENT_LENGTH
            ) || 0;

        if (
            minimumLength <= 0
        ) {

            return;

        }

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const start =
                points[index];

            const end =
                points[index + 1];

            if (
                !isValidPoint(start) ||
                !isValidPoint(end)
            ) {

                continue;

            }

            const length =

                RoutingGeometryV2
                    .segmentLength(
                        start,
                        end
                    );

            if (
                length > 0 &&
                length < minimumLength
            ) {

                addWarning(
                    result,
                    "SHORT_SEGMENT",
                    `Segment ${index} is shorter than the configured minimum.`,
                    {
                        index,
                        start,
                        end,
                        length,
                        minimumLength
                    }
                );

            }

        }

    }

    //----------------------------------
    // Obstacle Validation
    //----------------------------------

    function validateObstacles(
        points,
        result,
        options
    ) {

        const ignoredObstacleIds =

            getIgnoredObstacleIds(
                options
            );

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            const start =
                points[index];

            const end =
                points[index + 1];

            if (
                !isValidPoint(start) ||
                !isValidPoint(end)
            ) {

                continue;

            }

            const obstacle =

                RoutingObstacleV2
                    .segmentHitsObstacle(
                        start,
                        end,
                        ignoredObstacleIds
                    );

            if (
                !obstacle
            ) {

                continue;

            }

            const collision = {

                segmentIndex:
                    index,

                start,

                end,

                obstacleId:
                    obstacle.id,

                obstacle

            };

            result.collisions.push(
                collision
            );

            addError(
                result,
                "OBSTACLE_COLLISION",
                `Segment ${index} intersects an obstacle.`,
                collision
            );

        }

    }

    //----------------------------------
    // Existing Route Validation
    //----------------------------------

    function validateExistingRoutes(
        points,
        result,
        options
    ) {

        const existingRoutes =

            normalizeExistingRoutes(
                options.existingRoutes
            );

        if (
            existingRoutes.length === 0
        ) {

            return;

        }

        const ignoredRouteIds =

            new Set(
                normalizeIds(
                    options.ignoredRouteIds
                )
            );

        for (
            const routeEntry of
            existingRoutes
        ) {

            if (
                ignoredRouteIds.has(
                    routeEntry.id
                )
            ) {

                continue;

            }

            compareRoutes(
                points,
                routeEntry,
                result
            );

        }

    }

    //----------------------------------
    // Compare Routes
    //----------------------------------

    function compareRoutes(
        candidatePoints,
        routeEntry,
        result
    ) {

        const routePoints =
            routeEntry.points;

        for (
            let candidateIndex = 0;
            candidateIndex <
                candidatePoints.length - 1;
            candidateIndex++
        ) {

            const candidateStart =
                candidatePoints[
                    candidateIndex
                ];

            const candidateEnd =
                candidatePoints[
                    candidateIndex + 1
                ];

            if (
                !isValidPoint(
                    candidateStart
                ) ||
                !isValidPoint(
                    candidateEnd
                )
            ) {

                continue;

            }

            for (
                let existingIndex = 0;
                existingIndex <
                    routePoints.length - 1;
                existingIndex++
            ) {

                const existingStart =
                    routePoints[
                        existingIndex
                    ];

                const existingEnd =
                    routePoints[
                        existingIndex + 1
                    ];

                if (
                    !isValidPoint(
                        existingStart
                    ) ||
                    !isValidPoint(
                        existingEnd
                    )
                ) {

                    continue;

                }

                const relation =

                    classifySegmentRelation(
                        candidateStart,
                        candidateEnd,
                        existingStart,
                        existingEnd
                    );

                if (
                    relation.type ===
                    "none"
                ) {

                    continue;

                }

                const details = {

                    routeId:
                        routeEntry.id,

                    candidateSegmentIndex:
                        candidateIndex,

                    existingSegmentIndex:
                        existingIndex,

                    candidateStart,

                    candidateEnd,

                    existingStart,

                    existingEnd,

                    relation

                };

                if (
                    relation.type ===
                    "overlap"
                ) {

                    result.overlaps.push(
                        details
                    );

                    addWarning(
                        result,
                        "ROUTE_OVERLAP",
                        "Candidate route overlaps an existing route.",
                        details
                    );

                    continue;

                }

                if (
                    relation.type ===
                    "intersection"
                ) {

                    result.intersections.push(
                        details
                    );

                    addWarning(
                        result,
                        "ROUTE_INTERSECTION",
                        "Candidate route intersects an existing route.",
                        details
                    );

                }

            }

        }

    }

    //----------------------------------
    // Classify Segment Relation
    //----------------------------------

    function classifySegmentRelation(
        a1,
        a2,
        b1,
        b2
    ) {

        const aHorizontal =
            nearlyEqual(
                a1.y,
                a2.y
            );

        const aVertical =
            nearlyEqual(
                a1.x,
                a2.x
            );

        const bHorizontal =
            nearlyEqual(
                b1.y,
                b2.y
            );

        const bVertical =
            nearlyEqual(
                b1.x,
                b2.x
            );

        //----------------------------------
        // Horizontal Overlap
        //----------------------------------

        if (
            aHorizontal &&
            bHorizontal &&
            nearlyEqual(
                a1.y,
                b1.y
            )
        ) {

            const overlap =
                getRangeOverlap(

                    a1.x,
                    a2.x,

                    b1.x,
                    b2.x

                );

            if (
                overlap.length > 0
            ) {

                return {

                    type:
                        "overlap",

                    orientation:
                        "horizontal",

                    from:
                        overlap.start,

                    to:
                        overlap.end,

                    length:
                        overlap.length

                };

            }

            return {
                type:
                    "none"
            };

        }

        //----------------------------------
        // Vertical Overlap
        //----------------------------------

        if (
            aVertical &&
            bVertical &&
            nearlyEqual(
                a1.x,
                b1.x
            )
        ) {

            const overlap =
                getRangeOverlap(

                    a1.y,
                    a2.y,

                    b1.y,
                    b2.y

                );

            if (
                overlap.length > 0
            ) {

                return {

                    type:
                        "overlap",

                    orientation:
                        "vertical",

                    from:
                        overlap.start,

                    to:
                        overlap.end,

                    length:
                        overlap.length

                };

            }

            return {
                type:
                    "none"
            };

        }

        //----------------------------------
        // Perpendicular Intersection
        //----------------------------------

        if (
            aHorizontal &&
            bVertical
        ) {

            return classifyPerpendicular(

                a1,
                a2,

                b1,
                b2

            );

        }

        if (
            aVertical &&
            bHorizontal
        ) {

            const relation =
                classifyPerpendicular(

                    b1,
                    b2,

                    a1,
                    a2

                );

            return {

                ...relation,

                reversed:
                    relation.type !==
                    "none"

            };

        }

        return {
            type:
                "none"
        };

    }

    //----------------------------------
    // Perpendicular Relation
    //----------------------------------

    function classifyPerpendicular(
        horizontalStart,
        horizontalEnd,
        verticalStart,
        verticalEnd
    ) {

        const horizontalLeft =

            Math.min(
                horizontalStart.x,
                horizontalEnd.x
            );

        const horizontalRight =

            Math.max(
                horizontalStart.x,
                horizontalEnd.x
            );

        const verticalTop =

            Math.min(
                verticalStart.y,
                verticalEnd.y
            );

        const verticalBottom =

            Math.max(
                verticalStart.y,
                verticalEnd.y
            );

        const intersection = {

            x:
                verticalStart.x,

            y:
                horizontalStart.y

        };

        const insideHorizontal =

            intersection.x >=
                horizontalLeft &&

            intersection.x <=
                horizontalRight;

        const insideVertical =

            intersection.y >=
                verticalTop &&

            intersection.y <=
                verticalBottom;

        if (
            !insideHorizontal ||
            !insideVertical
        ) {

            return {
                type:
                    "none"
            };

        }

        //----------------------------------
        // Shared Endpoint
        //----------------------------------

        const sharedEndpoint =

            pointsEqual(
                intersection,
                horizontalStart
            ) ||

            pointsEqual(
                intersection,
                horizontalEnd
            ) ||

            pointsEqual(
                intersection,
                verticalStart
            ) ||

            pointsEqual(
                intersection,
                verticalEnd
            );

        return {

            type:
                sharedEndpoint
                    ? "endpoint"
                    : "intersection",

            point:
                intersection

        };

    }

    //----------------------------------
    // Route Is Valid
    //----------------------------------

    function isRouteValid(
        points,
        options = {}
    ) {

        return validateRoute(
            points,
            options
        ).valid;

    }

    //----------------------------------
    // Route Is Orthogonal
    //----------------------------------

    function isRouteOrthogonal(
        points
    ) {

        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            return false;

        }

        return points
            .slice(
                0,
                -1
            )
            .every(
                (
                    point,
                    index
                ) =>
                    RoutingGeometryV2
                        .isOrthogonal(

                            point,

                            points[
                                index + 1
                            ]

                        )
            );

    }

    //----------------------------------
    // Existing Route Normalizer
    //----------------------------------

    function normalizeExistingRoutes(
        routes
    ) {

        if (
            !Array.isArray(routes)
        ) {

            return [];

        }

        return routes
            .map(
                (
                    route,
                    index
                ) => {

                    if (
                        Array.isArray(route)
                    ) {

                        return {

                            id:
                                index,

                            points:
                                route

                        };

                    }

                    if (
                        Array.isArray(
                            route?.points
                        )
                    ) {

                        return {

                            id:
                                route.id ??
                                index,

                            points:
                                route.points

                        };

                    }

                    if (
                        Array.isArray(
                            route
                                ?.geometry
                                ?.points
                        )
                    ) {

                        return {

                            id:
                                route.id ??
                                index,

                            points:
                                route
                                    .geometry
                                    .points

                        };

                    }

                    return null;

                }
            )
            .filter(Boolean);

    }

    //----------------------------------
    // Ignore Obstacle IDs
    //----------------------------------

    function getIgnoredObstacleIds(
        options
    ) {

        const ids = [

            ...normalizeIds(
                options
                    .ignoredObstacleIds
            ),

            ...normalizeIds(
                options
                    .sourceObstacleId
            ),

            ...normalizeIds(
                options
                    .targetObstacleId
            )

        ];

        return [

            ...new Set(ids)

        ];

    }

    //----------------------------------
    // Normalize IDs
    //----------------------------------

    function normalizeIds(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return [];

        }

        if (
            Array.isArray(value)
        ) {

            return value.filter(
                id =>
                    id !== undefined &&
                    id !== null
            );

        }

        return [value];

    }

    //----------------------------------
    // Range Overlap
    //----------------------------------

    function getRangeOverlap(
        aStart,
        aEnd,
        bStart,
        bEnd
    ) {

        const start =

            Math.max(

                Math.min(
                    aStart,
                    aEnd
                ),

                Math.min(
                    bStart,
                    bEnd
                )

            );

        const end =

            Math.min(

                Math.max(
                    aStart,
                    aEnd
                ),

                Math.max(
                    bStart,
                    bEnd
                )

            );

        return {

            start,

            end,

            length:
                Math.max(
                    0,
                    end - start
                )

        };

    }

    //----------------------------------
    // Point Equality
    //----------------------------------

    function pointsEqual(
        first,
        second
    ) {

        return (

            nearlyEqual(
                first.x,
                second.x
            ) &&

            nearlyEqual(
                first.y,
                second.y
            )

        );

    }

    //----------------------------------
    // Nearly Equal
    //----------------------------------

    function nearlyEqual(
        first,
        second
    ) {

        return (

            Math.abs(
                first -
                second
            ) <
            0.000001

        );

    }

    //----------------------------------
    // Error
    //----------------------------------

    function addError(
        result,
        code,
        message,
        details = null
    ) {

        result.errors.push({

            code,

            message,

            details

        });

        result.valid = false;

    }

    //----------------------------------
    // Warning
    //----------------------------------

    function addWarning(
        result,
        code,
        message,
        details = null
    ) {

        result.warnings.push({

            code,

            message,

            details

        });

    }

    //----------------------------------
    // Debug
    //----------------------------------

    function debugValidation(
        result
    ) {

        if (
            !RoutingConfigV2
                ?.DEBUG
                ?.ENABLED
        ) {

            return;

        }

        if (
            !result.valid
        ) {

            console.warn(
                "[RoutingValidatorV2]",
                result
            );

            return;

        }

        if (
            result.warnings.length > 0
        ) {

            console.log(
                "[RoutingValidatorV2]",
                result
            );

        }

    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {

        validateRoute,

        isRouteValid,

        isRouteOrthogonal,

        classifySegmentRelation

    };

})();

//----------------------------------
// Expose
//----------------------------------

window.RoutingValidatorV2 =
    RoutingValidatorV2;