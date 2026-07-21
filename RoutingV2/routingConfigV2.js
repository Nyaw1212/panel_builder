//----------------------------------
// Routing Config V2
//----------------------------------

const RoutingConfigV2 = Object.freeze({

    GRID: {
        ENABLED: true,
        CELL_SIZE: () => SETTINGS.cellSize,
        ROWS: () => SETTINGS.rows,
        COLUMNS: () => SETTINGS.columns
    },

    OBSTACLE: {
        PANEL_CLEARANCE: 20,
        NODE_CLEARANCE: 10,
        BORDER_CLEARANCE: 10
    },

    NODE: {
        EXIT_DISTANCE: 24,
        SNAP_TO_CENTER: true
    },

    ROUTE: {
        MAX_ITERATIONS: 5000,
        MAX_SEARCH_DISTANCE: 500,

        // Distance used to create safe visibility corridors around
        // connectors and expanded obstacle edges.
        SEARCH_SPACING: 16,

        ALLOW_DIAGONAL: false,
        COMPRESS_PATH: true,
        OPTIMIZE_PATH: true
    },

    COMB: {
        ENABLED: true,
        LANE_SPACING: 16,
        MIN_LANE_SPACING: 12,
        MAX_LANE_SPACING: 30,
        AUTO_EXPAND: true,
        SHARED_TRUNK: true
    },

    LINKS: {
        AVOID_OVERLAP: true,
        AVOID_INTERSECTION: true,
        PARALLEL_OFFSET: 12,
        MIN_SEGMENT_LENGTH: 10
    },

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

    OPTIMIZER: {
        REMOVE_DUPLICATES: true,
        REMOVE_STRAIGHT_POINTS: true,
        MERGE_SMALL_SEGMENTS: true,
        ALIGN_ORTHOGONAL: true
    },

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

window.RoutingConfigV2 = RoutingConfigV2;
