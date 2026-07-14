//----------------------------------
// Create Route
//----------------------------------

function createRoute(start, end) {

    const points = [];

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    //----------------------------------
    // Horizontal First
    //----------------------------------

    if (dx >= dy) {

        const midX = (start.x + end.x) / 2;

        points.push(start);

        points.push({
            x: midX,
            y: start.y
        });

        points.push({
            x: midX,
            y: end.y
        });

        points.push(end);

    }

    //----------------------------------
    // Vertical First
    //----------------------------------

    else {

        const midY = (start.y + end.y) / 2;

        points.push(start);

        points.push({
            x: start.x,
            y: midY
        });

        points.push({
            x: end.x,
            y: midY
        });

        points.push(end);

    }

    return points;

}

window.createRoute = createRoute;