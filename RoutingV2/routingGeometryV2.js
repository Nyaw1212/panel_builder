//----------------------------------
// Routing Geometry V2
//----------------------------------

const RoutingGeometryV2 = (() => {

    //----------------------------------
    // Node Center
    //----------------------------------

    function getNodeCenter(
        panelId,
        connectionId
    ) {

        return getConnectionCenter(

            panelId,

            connectionId

        );

    }

    //----------------------------------
    // Node Exit
    //----------------------------------

    function getNodeExit(
        panelId,
        connectionId
    ) {

        const center = getNodeCenter(

            panelId,

            connectionId

        );

        if (!center) {

            return null;

        }

        const side = getNodeSide(

            panelId,

            connectionId

        );

        const distance =

            RoutingConfigV2
                .NODE
                .EXIT_DISTANCE;

        switch (side) {

            case "top":

                return {

                    x: center.x,

                    y: center.y - distance

                };

            case "bottom":

                return {

                    x: center.x,

                    y: center.y + distance

                };

            case "left":

                return {

                    x: center.x - distance,

                    y: center.y

                };

            case "right":

                return {

                    x: center.x + distance,

                    y: center.y

                };

            default:

                return center;

        }

    }

    //----------------------------------
    // Node Direction
    //----------------------------------

    function getNodeDirection(
        panelId,
        connectionId
    ) {

        const side = getNodeSide(

            panelId,

            connectionId

        );

        switch (side) {

            case "top":

                return {

                    x: 0,

                    y: -1

                };

            case "bottom":

                return {

                    x: 0,

                    y: 1

                };

            case "left":

                return {

                    x: -1,

                    y: 0

                };

            case "right":

                return {

                    x: 1,

                    y: 0

                };

            default:

                return {

                    x: 0,

                    y: 0

                };

        }

    }

    //----------------------------------
    // Manhattan Distance
    //----------------------------------

    function getDistance(
        pointA,
        pointB
    ) {

        return (

            Math.abs(

                pointA.x -

                pointB.x

            ) +

            Math.abs(

                pointA.y -

                pointB.y

            )

        );

    }

    //----------------------------------
    // Orthogonal
    //----------------------------------

    function isOrthogonal(
        a,
        b
    ) {

        return (

            a.x === b.x ||

            a.y === b.y

        );

    }

    //----------------------------------
    // Segment Length
    //----------------------------------

    function segmentLength(
        a,
        b
    ) {

        return Math.hypot(

            b.x - a.x,

            b.y - a.y

        );

    }

    //----------------------------------
    // Clone Route
    //----------------------------------

    function cloneRoute(
        points
    ) {

        return points.map(

            point => ({

                x: point.x,

                y: point.y

            })

        );

    }

    //----------------------------------
    // Remove Duplicate Points
    //----------------------------------

    function removeDuplicatePoints(
        points
    ) {

        if (

            !Array.isArray(points)

        ) {

            return [];

        }

        const result = [];

        for (

            const point of points

        ) {

            const previous =

                result[result.length - 1];

            if (

                previous &&

                previous.x === point.x &&

                previous.y === point.y

            ) {

                continue;

            }

            result.push({

                x: point.x,

                y: point.y

            });

        }

        return result;

    }

    //----------------------------------
    // Remove Straight Points
    //----------------------------------

    function simplifyRoute(
        points
    ) {

        if (

            points.length < 3

        ) {

            return cloneRoute(points);

        }

        const output = [

            points[0]

        ];

        for (

            let i = 1;

            i < points.length - 1;

            i++

        ) {

            const previous =

                output[output.length - 1];

            const current =

                points[i];

            const next =

                points[i + 1];

            const vertical =

                previous.x === current.x &&

                current.x === next.x;

            const horizontal =

                previous.y === current.y &&

                current.y === next.y;

            if (

                vertical ||

                horizontal

            ) {

                continue;

            }

            output.push(current);

        }

        output.push(

            points[points.length - 1]

        );

        return output;

    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {

        getNodeCenter,

        getNodeExit,

        getNodeDirection,

        getDistance,

        isOrthogonal,

        segmentLength,

        cloneRoute,

        removeDuplicatePoints,

        simplifyRoute

    };

})();

//----------------------------------
// Expose
//----------------------------------

window.RoutingGeometryV2 =
    RoutingGeometryV2;