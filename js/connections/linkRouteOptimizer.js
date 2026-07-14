//----------------------------------
// Route Optimizer
//----------------------------------

function optimizeRoute(points) {

    const route = [...points];

    //----------------------------------
    // Check Every Segment
    //----------------------------------

    for (let i = 0; i < route.length - 1; i++) {

        const obstacle = segmentHitsObstacle(

            route[i],
            route[i + 1]

        );

        if (!obstacle) {

            continue;

        }

        console.log(

            "Blocked Segment",

            i,

            obstacle

        );

        //----------------------------------
        // Build Detour
        //----------------------------------

        const replacement = rerouteSegment(

            route[i],
            route[i + 1],
            obstacle

        );

        //----------------------------------
        // Remove duplicated start/end
        //----------------------------------

        replacement.shift();

        replacement.pop();

        //----------------------------------
        // Insert New Corners
        //----------------------------------

        route.splice(

            i + 1,
            0,
            ...replacement

        );

        break;

    }

    return route;

}

//----------------------------------
// Expose
//----------------------------------

window.optimizeRoute = optimizeRoute;