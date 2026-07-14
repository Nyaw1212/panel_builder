//----------------------------------
// Link Route Utils
//----------------------------------

//----------------------------------
// Compress Grid Path
//----------------------------------

function compressGridPath(cells) {

    //----------------------------------
    // Nothing to Compress
    //----------------------------------

    if (!cells || cells.length <= 2) {

        return cells || [];

    }

    const result = [

        cells[0]

    ];

    let lastDX = null;
    let lastDY = null;

    //----------------------------------
    // Keep Only Corners
    //----------------------------------

    for (let i = 1; i < cells.length; i++) {

        const dx =

            cells[i].x -

            cells[i - 1].x;

        const dy =

            cells[i].y -

            cells[i - 1].y;

        //----------------------------------
        // Direction Changed
        //----------------------------------

        if (

            lastDX !== null &&

            (

                dx !== lastDX ||

                dy !== lastDY

            )

        ) {

            result.push(

                cells[i - 1]

            );

        }

        lastDX = dx;
        lastDY = dy;

    }

    //----------------------------------
    // Always Keep Last Cell
    //----------------------------------

    result.push(

        cells[cells.length - 1]

    );

    return result;

}

//----------------------------------
// Remove Duplicate Points
//----------------------------------

function removeDuplicatePoints(points) {

    if (!points || points.length <= 1) {

        return points || [];

    }

    const cleaned = [];

    for (const point of points) {

        const last = cleaned[

            cleaned.length - 1

        ];

        if (

            !last ||

            last.x !== point.x ||

            last.y !== point.y

        ) {

            cleaned.push(point);

        }

    }

    return cleaned;

}

//----------------------------------
// Remove Collinear Points
//----------------------------------

function removeCollinearPoints(points) {

    if (!points || points.length <= 2) {

        return points || [];

    }

    const result = [

        points[0]

    ];

    for (

        let i = 1;

        i < points.length - 1;

        i++

    ) {

        const a = result[

            result.length - 1

        ];

        const b = points[i];
        const c = points[i + 1];

        //----------------------------------
        // Vertical
        //----------------------------------

        if (

            a.x === b.x &&

            b.x === c.x

        ) {

            continue;

        }

        //----------------------------------
        // Horizontal
        //----------------------------------

        if (

            a.y === b.y &&

            b.y === c.y

        ) {

            continue;

        }

        result.push(b);

    }

    result.push(

        points[points.length - 1]

    );

    return result;

}

//----------------------------------
// Optimize Pixel Route
//----------------------------------

function optimizePixelRoute(points) {

    let route =

        removeDuplicatePoints(

            points

        );

    route =

        removeCollinearPoints(

            route

        );

    return route;

}

//----------------------------------
// Expose
//----------------------------------

window.compressGridPath = compressGridPath;
window.removeDuplicatePoints = removeDuplicatePoints;
window.removeCollinearPoints = removeCollinearPoints;
window.optimizePixelRoute = optimizePixelRoute;