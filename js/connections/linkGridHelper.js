//----------------------------------
// Grid Helper
//----------------------------------

//----------------------------------
// Find Nearest Free Cell
//----------------------------------

function findNearestFreeCell(start) {

    //----------------------------------
    // Already Free
    //----------------------------------

    if (!isBlocked(start.x, start.y)) {

        return start;

    }

    //----------------------------------
    // Spiral Search
    //----------------------------------

    const MAX_RADIUS = 10;

    for (let radius = 1; radius <= MAX_RADIUS; radius++) {

        //----------------------------------
        // Top / Bottom
        //----------------------------------

        for (let x = -radius; x <= radius; x++) {

            const top = {

                x: start.x + x,

                y: start.y - radius

            };

            if (!isBlocked(top.x, top.y)) {

                return top;

            }

            const bottom = {

                x: start.x + x,

                y: start.y + radius

            };

            if (!isBlocked(bottom.x, bottom.y)) {

                return bottom;

            }

        }

        //----------------------------------
        // Left / Right
        //----------------------------------

        for (let y = -radius + 1; y <= radius - 1; y++) {

            const left = {

                x: start.x - radius,

                y: start.y + y

            };

            if (!isBlocked(left.x, left.y)) {

                return left;

            }

            const right = {

                x: start.x + radius,

                y: start.y + y

            };

            if (!isBlocked(right.x, right.y)) {

                return right;

            }

        }

    }

    //----------------------------------
    // Nothing Found
    //----------------------------------

    return start;

}

//----------------------------------
// Expose
//----------------------------------

window.findNearestFreeCell = findNearestFreeCell;