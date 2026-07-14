//----------------------------------
// Link Obstacle Collision
//----------------------------------

//----------------------------------
// Segment Hits Obstacle
//----------------------------------

function segmentHitsObstacle(start, end) {

    const obstacles = getObstacles();

    for (const obstacle of obstacles) {

        if (

            intersectsObstacle(

                start,

                end,

                obstacle

            )

        ) {

            return obstacle;

        }

    }

    return null;

}

//----------------------------------
// Segment vs Rectangle
//----------------------------------

function intersectsObstacle(start, end, rect) {

    //----------------------------------
    // Vertical
    //----------------------------------

    if (start.x === end.x) {

        if (

            start.x < rect.left ||

            start.x > rect.right

        ) {

            return false;

        }

        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);

        return !(

            bottom < rect.top ||

            top > rect.bottom

        );

    }

    //----------------------------------
    // Horizontal
    //----------------------------------

    if (start.y === end.y) {

        if (

            start.y < rect.top ||

            start.y > rect.bottom

        ) {

            return false;

        }

        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);

        return !(

            right < rect.left ||

            left > rect.right

        );

    }

    //----------------------------------
    // Ignore diagonal
    //----------------------------------

    return false;

}

//----------------------------------
// Route Hits Obstacle
//----------------------------------

function routeHitsObstacle(points) {

    for (let i = 0; i < points.length - 1; i++) {

        if (

            segmentHitsObstacle(

                points[i],

                points[i + 1]

            )

        ) {

            return true;

        }

    }

    return false;

}

//----------------------------------
// Reroute Segment
//----------------------------------

function rerouteSegment(start, end, obstacle) {

    const OFFSET = 20;

    //----------------------------------
    // Above
    //----------------------------------

    const topY = obstacle.top - OFFSET;

    const topRoute = [

        start,

        {

            x: start.x,

            y: topY

        },

        {

            x: end.x,

            y: topY

        },

        end

    ];

    //----------------------------------
    // Below
    //----------------------------------

    const bottomY = obstacle.bottom + OFFSET;

    const bottomRoute = [

        start,

        {

            x: start.x,

            y: bottomY

        },

        {

            x: end.x,

            y: bottomY

        },

        end

    ];

    //----------------------------------
    // Choose Shorter
    //----------------------------------

    const topDistance =

        Math.abs(start.y - topY) +

        Math.abs(end.y - topY);

    const bottomDistance =

        Math.abs(start.y - bottomY) +

        Math.abs(end.y - bottomY);

    const route =

        topDistance < bottomDistance

            ? topRoute

            : bottomRoute;

    console.log("Detour Route", route);

    return route;

}

//----------------------------------
// Debug
//----------------------------------

function testSegment(start, end) {

    console.log(

        segmentHitsObstacle(

            start,

            end

        )

    );

}

//----------------------------------
// Expose
//----------------------------------

window.segmentHitsObstacle = segmentHitsObstacle;
window.intersectsObstacle = intersectsObstacle;
window.routeHitsObstacle = routeHitsObstacle;
window.rerouteSegment = rerouteSegment;
window.testSegment = testSegment;