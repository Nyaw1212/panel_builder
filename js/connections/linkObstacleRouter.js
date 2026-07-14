//----------------------------------
// Link Obstacle Router
//----------------------------------

const ROUTER_MARGIN = 30;

//----------------------------------
// Avoid Obstacles
//----------------------------------

function avoidObstacles(points) {

    if (!points || points.length < 2) {

        return points;

    }

    let route = [...points];

    //----------------------------------
    // Process Each Segment
    //----------------------------------

    for (let i = 0; i < route.length - 1; i++) {

        const a = route[i];
        const b = route[i + 1];

        const obstacle = findObstacle(a, b);

        if (!obstacle) {

            continue;

        }

        route = rerouteAround(

            route,
            i,
            obstacle

        );

        i = -1;

    }

    return route;

}

//----------------------------------
// Find Obstacle
//----------------------------------

function findObstacle(a, b) {

    for (const item of layout) {

        const rect = getPanelBounds(item);

        if (

            segmentIntersectsRect(

                a,
                b,
                rect

            )

        ) {

            return rect;

        }

    }

    return null;

}

//----------------------------------
// Panel Bounds
//----------------------------------

function getPanelBounds(item) {

    const cell = getCellRect(item.startCell);

    const width =
        item.width *
        (SETTINGS.cellSize + SETTINGS.gap);

    const height =
        item.height *
        (SETTINGS.cellSize + SETTINGS.gap);

    return {

        left:
            cell.x - ROUTER_MARGIN,

        top:
            cell.y - ROUTER_MARGIN,

        right:
            cell.x + width + ROUTER_MARGIN,

        bottom:
            cell.y + height + ROUTER_MARGIN

    };

}

//----------------------------------
// Segment vs Rectangle
//----------------------------------

function segmentIntersectsRect(a, b, r) {

    //----------------------------------
    // Vertical
    //----------------------------------

    if (a.x === b.x) {

        if (

            a.x < r.left ||

            a.x > r.right

        ) {

            return false;

        }

        const top =
            Math.min(a.y, b.y);

        const bottom =
            Math.max(a.y, b.y);

        return !(

            bottom < r.top ||

            top > r.bottom

        );

    }

    //----------------------------------
    // Horizontal
    //----------------------------------

    if (a.y === b.y) {

        if (

            a.y < r.top ||

            a.y > r.bottom

        ) {

            return false;

        }

        const left =
            Math.min(a.x, b.x);

        const right =
            Math.max(a.x, b.x);

        return !(

            right < r.left ||

            left > r.right

        );

    }

    return false;

}

//----------------------------------
// Reroute
//----------------------------------

function rerouteAround(

    route,
    index,
    rect

) {

    const a = route[index];
    const b = route[index + 1];

    //----------------------------------
    // Horizontal
    //----------------------------------

    if (a.y === b.y) {

        const y =

            Math.abs(a.y - rect.top) <

            Math.abs(a.y - rect.bottom)

                ?

                rect.top - ROUTER_MARGIN

                :

                rect.bottom + ROUTER_MARGIN;

        return [

            ...route.slice(0, index),

            a,

            {

                x: a.x,

                y

            },

            {

                x: b.x,

                y

            },

            b,

            ...route.slice(index + 2)

        ];

    }

    //----------------------------------
    // Vertical
    //----------------------------------

    const x =

        Math.abs(a.x - rect.left) <

        Math.abs(a.x - rect.right)

            ?

            rect.left - ROUTER_MARGIN

            :

            rect.right + ROUTER_MARGIN;

    return [

        ...route.slice(0, index),

        a,

        {

            x,

            y: a.y

        },

        {

            x,

            y: b.y

        },

        b,

        ...route.slice(index + 2)

    ];

}

//----------------------------------
// Expose
//----------------------------------

window.avoidObstacles = avoidObstacles;
window.segmentIntersectsRect = segmentIntersectsRect;
window.getPanelBounds = getPanelBounds;