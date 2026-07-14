//----------------------------------
// Create Route
//----------------------------------

function createRoute(start, end) {

    const points = [];

    const EXIT = SETTINGS.cellSize * 0.40;

    //----------------------------------
    // Leave Start
    //----------------------------------

    const p1 = { ...start };
    const p2 = { ...end };

    //----------------------------------
    // Horizontal First
    //----------------------------------

    if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) {

        p1.x += end.x > start.x ? EXIT : -EXIT;
        p2.x += end.x > start.x ? -EXIT : EXIT;

        points.push(start);

        points.push(p1);

        points.push({

            x: p2.x,

            y: p1.y

        });

        points.push(p2);

        points.push(end);

    }

    //----------------------------------
    // Vertical First
    //----------------------------------

    else {

        p1.y += end.y > start.y ? EXIT : -EXIT;
        p2.y += end.y > start.y ? -EXIT : EXIT;

        points.push(start);

        points.push(p1);

        points.push({

            x: p1.x,

            y: p2.y

        });

        points.push(p2);

        points.push(end);

    }

    return points;

}

window.createRoute = createRoute;