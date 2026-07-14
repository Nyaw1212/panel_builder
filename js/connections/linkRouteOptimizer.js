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

        console.log("Blocked Segment", i);

        //----------------------------------
        // Build Detour
        //----------------------------------

        const replacement = rerouteSegment(

            route[i],
            route[i + 1],
            obstacle

        );

        console.log("Old Route", [...route]);
        console.log("Replacement", replacement);

        //----------------------------------
        // Insert Only Interior Points
        //----------------------------------

        const interior = replacement.slice(1, -1);

        route.splice(

            i + 1,
            0,
            ...interior

        );

        console.log("New Route", [...route]);

        break;

    }

    return route;

}

//----------------------------------
// Expose
//----------------------------------

window.optimizeRoute = optimizeRoute;