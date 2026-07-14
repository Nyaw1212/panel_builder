//----------------------------------
// Link Obstacle Manager
//----------------------------------

const OBSTACLE_MARGIN = 20;

//----------------------------------
// Get Obstacles
//----------------------------------

function getObstacles() {

    const obstacles = [];

    const cards = grid.querySelectorAll(".panel-card");

    const gridRect = grid.getBoundingClientRect();

    cards.forEach(card => {

        const rect = card.getBoundingClientRect();

        obstacles.push({

            left:
                rect.left -
                gridRect.left -
                OBSTACLE_MARGIN,

            top:
                rect.top -
                gridRect.top -
                OBSTACLE_MARGIN,

            right:
                rect.right -
                gridRect.left +
                OBSTACLE_MARGIN,

            bottom:
                rect.bottom -
                gridRect.top +
                OBSTACLE_MARGIN

        });

    });

    return obstacles;

}

//----------------------------------
// Debug
//----------------------------------

function logObstacles() {

    console.table(

        getObstacles()

    );

}

//----------------------------------
// Expose
//----------------------------------

window.getObstacles = getObstacles;
window.logObstacles = logObstacles;