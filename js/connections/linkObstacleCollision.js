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

function intersectsObstacle(

    start,

    end,

    rect

) {

    //----------------------------------
    // Vertical Segment
    //----------------------------------

    if (start.x === end.x) {

        if (

            start.x < rect.left ||

            start.x > rect.right

        ) {

            return false;

        }

        const top = Math.min(

            start.y,

            end.y

        );

        const bottom = Math.max(

            start.y,

            end.y

        );

        return !(

            bottom < rect.top ||

            top > rect.bottom

        );

    }

    //----------------------------------
    // Horizontal Segment
    //----------------------------------

    if (start.y === end.y) {

        if (

            start.y < rect.top ||

            start.y > rect.bottom

        ) {

            return false;

        }

        const left = Math.min(

            start.x,

            end.x

        );

        const right = Math.max(

            start.x,

            end.x

        );

        return !(

            right < rect.left ||

            left > rect.right

        );

    }

    //----------------------------------
    // Ignore Diagonal
    //----------------------------------

    return false;

}

//----------------------------------
// Debug
//----------------------------------

function testSegment(start, end) {

    const obstacle =

        segmentHitsObstacle(

            start,

            end

        );

    console.log(

        obstacle

            ? "HIT"

            : "CLEAR",

        obstacle

    );

}

//----------------------------------
// Reroute Segment
//----------------------------------

function rerouteSegment(start, end, obstacle) {

    const OFFSET = 20;

    const topRoute = [

        start,

        {

            x: start.x,

            y: obstacle.top - OFFSET

        },

        {

            x: end.x,

            y: obstacle.top - OFFSET

        },

        end

    ];

    const bottomRoute = [

        start,

        {

            x: start.x,

            y: obstacle.bottom + OFFSET

        },

        {

            x: end.x,

            y: obstacle.bottom + OFFSET

        },

        end

    ];

    //----------------------------------
    // Choose Shorter
    //----------------------------------

    const topDistance =

        Math.abs(start.y - (obstacle.top - OFFSET)) +

        Math.abs(end.y - (obstacle.top - OFFSET));

    const bottomDistance =

        Math.abs(start.y - (obstacle.bottom + OFFSET)) +

        Math.abs(end.y - (obstacle.bottom + OFFSET));

    return (

        topDistance < bottomDistance

            ? topRoute

            : bottomRoute

    );

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
// Expose
//----------------------------------

window.segmentHitsObstacle = segmentHitsObstacle;
window.intersectsObstacle = intersectsObstacle;
window.testSegment = testSegment;
window.rerouteSegment = rerouteSegment;
window.routeHitsObstacle = routeHitsObstacle;