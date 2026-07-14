console.log("createRoute()");

//----------------------------------
// Create Route
//----------------------------------

function createRoute(link, start, end) {

    //----------------------------------
    // Try Horizontal First
    //----------------------------------

    const horizontal = createHorizontalRoute(

        start,
        end

    );

    if (!routeHitsObstacle(horizontal)) {

        console.log("Horizontal Route");

        return horizontal;

    }

    //----------------------------------
    // Try Vertical First
    //----------------------------------

    const vertical = createVerticalRoute(

        start,
        end

    );

    if (!routeHitsObstacle(vertical)) {

        console.log("Vertical Route");

        return vertical;

    }

    //----------------------------------
    // Obstacle Found
    //----------------------------------

    console.log("Obstacle Route");

    return createObstacleRoute(

        start,
        end

    );

}