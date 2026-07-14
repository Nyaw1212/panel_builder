//----------------------------------
// Route Builder
//----------------------------------

function createHorizontalRoute(start, end) {

    const EXIT = SETTINGS.cellSize * 0.40;

    const p1 = { ...start };
    const p2 = { ...end };

    p1.x += end.x > start.x ? EXIT : -EXIT;
    p2.x += end.x > start.x ? -EXIT : EXIT;

    return [

        start,

        p1,

        {
            x: p2.x,
            y: p1.y
        },

        p2,

        end

    ];

}

//----------------------------------

function createVerticalRoute(start, end) {

    const EXIT = SETTINGS.cellSize * 0.40;

    const p1 = { ...start };
    const p2 = { ...end };

    p1.y += end.y > start.y ? EXIT : -EXIT;
    p2.y += end.y > start.y ? -EXIT : EXIT;

    return [

        start,

        p1,

        {
            x: p1.x,
            y: p2.y
        },

        p2,

        end

    ];

}

//----------------------------------

function createObstacleRoute(start, end) {

    const horizontal = createHorizontalRoute(

        start,

        end

    );

    //----------------------------------
    // Find First Hit
    //----------------------------------

    for (let i = 0; i < horizontal.length - 1; i++) {

        const obstacle = segmentHitsObstacle(

            horizontal[i],

            horizontal[i + 1]

        );

        if (!obstacle) {

            continue;

        }

        //----------------------------------
        // Route Above
        //----------------------------------

        const y = obstacle.top - 40;

        return [

            start,

            {
                x: start.x,
                y
            },

            {
                x: end.x,
                y
            },

            end

        ];

    }

    //----------------------------------
    // Fallback
    //----------------------------------

    return horizontal;

}

//----------------------------------

window.createHorizontalRoute =
    createHorizontalRoute;

window.createVerticalRoute =
    createVerticalRoute;

window.createObstacleRoute =
    createObstacleRoute;