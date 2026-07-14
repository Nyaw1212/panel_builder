//----------------------------------
// Link Pathfinder
//----------------------------------

const PATH_DIRECTIONS = [

    { x: 0,  y: -1 }, // Up
    { x: 1,  y: 0  }, // Right
    { x: 0,  y: 1  }, // Down
    { x: -1, y: 0  }  // Left

];

//----------------------------------
// Find Path (BFS)
//----------------------------------

function findPath(start, end) {

    const grid = getObstacleGrid();

    if (!grid || !grid.length) {

        return [];

    }

    const rows = grid.length;
    const cols = grid[0].length;

    //----------------------------------
    // Queue
    //----------------------------------

    const queue = [];

    queue.push({

        x: start.x,

        y: start.y,

        path: [

            {

                x: start.x,

                y: start.y

            }

        ]

    });

    //----------------------------------
    // Visited
    //----------------------------------

    const visited = new Set();

    visited.add(

        `${start.x},${start.y}`

    );

    //----------------------------------
    // BFS
    //----------------------------------

    while (queue.length) {

        const current = queue.shift();

        //----------------------------------
        // Goal
        //----------------------------------

        if (

            current.x === end.x &&

            current.y === end.y

        ) {

            return current.path;

        }

        //----------------------------------
        // Explore
        //----------------------------------

        for (const dir of PATH_DIRECTIONS) {

            const nx = current.x + dir.x;
            const ny = current.y + dir.y;

            //----------------------------------
            // Bounds
            //----------------------------------

            if (

                nx < 0 ||

                ny < 0 ||

                nx >= cols ||

                ny >= rows

            ) {

                continue;

            }

            //----------------------------------
            // Blocked
            //----------------------------------

            if (

                grid[ny][nx] === 1

            ) {

                continue;

            }

            //----------------------------------
            // Visited
            //----------------------------------

            const key = `${nx},${ny}`;

            if (

                visited.has(key)

            ) {

                continue;

            }

            visited.add(key);

            //----------------------------------
            // Push
            //----------------------------------

            queue.push({

                x: nx,

                y: ny,

                path: [

                    ...current.path,

                    {

                        x: nx,

                        y: ny

                    }

                ]

            });

        }

    }

    //----------------------------------
    // No Route
    //----------------------------------

    return [];

}

//----------------------------------
// Debug
//----------------------------------

function debugPath(start, end) {

    const path = findPath(start, end);

    console.table(path);

    return path;

}

//----------------------------------
// Expose
//----------------------------------

window.findPath = findPath;
window.debugPath = debugPath;