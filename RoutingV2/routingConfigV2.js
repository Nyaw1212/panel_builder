//----------------------------------
// Routing Config V2
//----------------------------------

const RoutingConfigV2 = Object.freeze({

    //----------------------------------
    // Grid
    //----------------------------------

    GRID: {

        ENABLED: true,

        CELL_SIZE: () => SETTINGS.cellSize,

        ROWS: () => SETTINGS.rows,

        COLUMNS: () => SETTINGS.columns

    },

    //----------------------------------
    // Equipment Clearance
    //----------------------------------

    OBSTACLE: {

        PANEL_CLEARANCE: 20,

        NODE_CLEARANCE: 10,

        BORDER_CLEARANCE: 10

    },

    //----------------------------------
    // Node Exit
    //----------------------------------

    NODE: {

        EXIT_DISTANCE: 24,

        SNAP_TO_CENTER: true

    },

    //----------------------------------
    // Routing
    //----------------------------------

    ROUTE: {

        MAX_ITERATIONS: 5000,

        MAX_SEARCH_DISTANCE: 500,

        ALLOW_DIAGONAL: false,

        COMPRESS_PATH: true,

        OPTIMIZE_PATH: true

    },

    //----------------------------------
    // Comb Routing
    //----------------------------------

    COMB: {

        ENABLED: true,

        LANE_SPACING: 16,

        MIN_LANE_SPACING: 12,

        MAX_LANE_SPACING: 30,

        AUTO_EXPAND: true,

        SHARED_TRUNK: true

    },

    //----------------------------------
    // Link Separation
    //----------------------------------

    LINKS: {

        AVOID_OVERLAP: true,

        AVOID_INTERSECTION: true,

        PARALLEL_OFFSET: 12,

        MIN_SEGMENT_LENGTH: 10

    },

    //----------------------------------
    // Route Scoring
    //----------------------------------

    SCORE: {

        LENGTH: 1,

        BEND: 40,

        CLEARANCE: 80,

        INTERSECTION: 1000,

        OVERLAP: 5000,

        PANEL_COLLISION: 999999,

        SHARED_TRUNK_BONUS: -40,

        PARALLEL_BONUS: -10

    },

    //----------------------------------
    // Optimizer
    //----------------------------------

    OPTIMIZER: {

        REMOVE_DUPLICATES: true,

        REMOVE_STRAIGHT_POINTS: true,

        MERGE_SMALL_SEGMENTS: true,

        ALIGN_ORTHOGONAL: true

    },

    //----------------------------------
    // Debug
    //----------------------------------

    DEBUG: {

        ENABLED: false,

        DRAW_GRID: false,

        DRAW_OBSTACLES: false,

        DRAW_LANES: false,

        DRAW_ROUTE_SCORE: false,

        LOG_PATHS: false,

        LOG_CANDIDATES: false

    }

});

//----------------------------------
// Expose
//----------------------------------

window.RoutingConfigV2 = RoutingConfigV2;