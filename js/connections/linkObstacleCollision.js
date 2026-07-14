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
// Expose
//----------------------------------

window.segmentHitsObstacle = segmentHitsObstacle;
window.testSegment = testSegment;