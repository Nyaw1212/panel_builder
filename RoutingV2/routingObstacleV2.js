//----------------------------------
// Routing Obstacle V2
//----------------------------------

const RoutingObstacleV2 = (() => {

    let obstacleCache = [];

    //----------------------------------
    // Refresh Obstacles
    //----------------------------------

    function refresh() {

        obstacleCache =
            buildObstacles();

        debugLog(
            "Obstacles refreshed",
            obstacleCache
        );

        return getObstacles();

    }

    //----------------------------------
    // Build Obstacles
    //----------------------------------

    function buildObstacles() {

        const layout =
            typeof getLayout === "function"
                ? getLayout()
                : [];

        if (!Array.isArray(layout)) {

            return [];

        }

        const seen = new Set();

        return layout
            .filter(Boolean)
            .filter(item => {

                const id =
                    item.id ??
                    item.panelId ??
                    item.uid ??
                    item;

                if (seen.has(id)) {
                    return false;
                }

                seen.add(id);

                return true;

            })
            .map(createObstacleFromItem)
            .filter(Boolean);

    }

    //----------------------------------
    // Create Obstacle From Layout Item
    //----------------------------------

    function createObstacleFromItem(item) {

        const bounds =
            getItemBounds(item);

        if (!bounds) {

            return null;

        }

        const clearance =
            Number(
                RoutingConfigV2
                    ?.OBSTACLE
                    ?.PANEL_CLEARANCE
            ) || 0;

        return {

            id:
                item.id ??
                item.panelId ??
                item.uid ??
                null,

            item,

            original: cloneRect(bounds),

            left:
                bounds.left -
                clearance,

            top:
                bounds.top -
                clearance,

            right:
                bounds.right +
                clearance,

            bottom:
                bounds.bottom +
                clearance,

            width:
                bounds.width +
                clearance * 2,

            height:
                bounds.height +
                clearance * 2

        };

    }

    //----------------------------------
    // Get Item Bounds
    //----------------------------------

    function getItemBounds(item) {

        const domBounds =
            getDOMBounds(item);

        if (domBounds) {

            return domBounds;

        }

        return getLayoutBounds(item);

    }

    //----------------------------------
    // Get DOM Bounds
    //----------------------------------

    function getDOMBounds(item) {

        const element =
            findItemElement(item);

        if (!element) {

            return null;

        }

        const canvas =
            getRoutingCanvas();

        const elementRect =
            element.getBoundingClientRect();

        const canvasRect =
            canvas
                ? canvas.getBoundingClientRect()
                : {
                    left: 0,
                    top: 0
                };

        const scale =
            getCanvasScale(canvas);

        const left =
            (
                elementRect.left -
                canvasRect.left
            ) / scale.x;

        const top =
            (
                elementRect.top -
                canvasRect.top
            ) / scale.y;

        const width =
            elementRect.width /
            scale.x;

        const height =
            elementRect.height /
            scale.y;

        return createRect(

            left,

            top,

            width,

            height

        );

    }

    //----------------------------------
    // Find Item Element
    //----------------------------------

    function findItemElement(item) {

        //----------------------------------
        // Prefer the placed panel card.
        // Connection nodes also carry
        // data-panel-id and must not become
        // equipment obstacles.
        //----------------------------------

        if (
            Number.isFinite(
                Number(item.startCell)
            )
        ) {

            const cell = document.querySelector(
                `.cell[data-index="${item.startCell}"]`
            );

            const panel =
                cell?.querySelector(
                    ".panel-card"
                );

            if (panel) {
                return panel;
            }

        }

        const ids = [

            item.id,

            item.panelId,

            item.uid,

            item.elementId

        ].filter(Boolean);

        for (const id of ids) {

            const selectors = [

                `.panel-card[data-panel-id="${escapeSelector(id)}"]`,

                `[data-equipment-id="${escapeSelector(id)}"]`,

                `[data-item-id="${escapeSelector(id)}"]`,

                `#${escapeSelector(id)}`

            ];

            for (const selector of selectors) {

                const element =
                    document.querySelector(
                        selector
                    );

                if (element) {

                    return element;

                }

            }

        }

        return null;

    }

    //----------------------------------
    // Layout Bounds Fallback
    //----------------------------------

    function getLayoutBounds(item) {

        const cellSize =
            getCellSize();

        if (
            Number.isFinite(item.x) &&
            Number.isFinite(item.y) &&
            Number.isFinite(item.width) &&
            Number.isFinite(item.height)
        ) {

            return createRect(

                item.x,

                item.y,

                item.width,

                item.height

            );

        }

        if (
            !Number.isFinite(item.startCell)
        ) {

            return null;

        }

        const columns =
            getColumnCount();

        const startColumn =
            item.startCell %
            columns;

        const startRow =
            Math.floor(
                item.startCell /
                columns
            );

        const widthCells =
            Number(item.width) || 1;

        const heightCells =
            Number(item.height) || 1;

        return createRect(

            startColumn *
                cellSize,

            startRow *
                cellSize,

            widthCells *
                cellSize,

            heightCells *
                cellSize

        );

    }

    //----------------------------------
    // Create Rectangle
    //----------------------------------

    function createRect(
        left,
        top,
        width,
        height
    ) {

        const safeLeft =
            Number(left) || 0;

        const safeTop =
            Number(top) || 0;

        const safeWidth =
            Math.max(
                0,
                Number(width) || 0
            );

        const safeHeight =
            Math.max(
                0,
                Number(height) || 0
            );

        return {

            left:
                safeLeft,

            top:
                safeTop,

            right:
                safeLeft +
                safeWidth,

            bottom:
                safeTop +
                safeHeight,

            width:
                safeWidth,

            height:
                safeHeight

        };

    }

    //----------------------------------
    // Clone Rectangle
    //----------------------------------

    function cloneRect(rect) {

        return {

            left:
                rect.left,

            top:
                rect.top,

            right:
                rect.right,

            bottom:
                rect.bottom,

            width:
                rect.width,

            height:
                rect.height

        };

    }

    //----------------------------------
    // Get Obstacles
    //----------------------------------

    function getObstacles() {

        return obstacleCache.map(
            cloneObstacle
        );

    }

    //----------------------------------
    // Clone Obstacle
    //----------------------------------

    function cloneObstacle(obstacle) {

        return {

            ...obstacle,

            original:
                cloneRect(
                    obstacle.original
                )

        };

    }

    //----------------------------------
    // Point Inside Obstacle
    //----------------------------------

    function pointInsideObstacle(
        point,
        obstacle
    ) {

        if (
            !point ||
            !obstacle
        ) {

            return false;

        }

        return (

            point.x >= obstacle.left &&

            point.x <= obstacle.right &&

            point.y >= obstacle.top &&

            point.y <= obstacle.bottom

        );

    }

    //----------------------------------
    // Segment Hits Obstacle
    //----------------------------------

    function segmentHitsObstacle(
        start,
        end,
        ignoredIds = []
    ) {

        if (
            !start ||
            !end
        ) {

            return null;

        }

        const ignored =
            new Set(
                Array.isArray(ignoredIds)
                    ? ignoredIds
                    : [ignoredIds]
            );

        for (
            const obstacle of
            obstacleCache
        ) {

            if (
                ignored.has(
                    obstacle.id
                )
            ) {

                continue;

            }

            if (
                segmentIntersectsRect(
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
    // Route Hits Obstacle
    //----------------------------------

    function routeHitsObstacle(
        points,
        ignoredIds = []
    ) {

        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            return false;

        }

        for (
            let index = 0;
            index < points.length - 1;
            index++
        ) {

            if (
                segmentHitsObstacle(

                    points[index],

                    points[index + 1],

                    ignoredIds

                )
            ) {

                return true;

            }

        }

        return false;

    }

    //----------------------------------
    // Segment vs Rectangle
    //----------------------------------

    function segmentIntersectsRect(
        start,
        end,
        rect
    ) {

        if (
            pointInsideObstacle(
                start,
                rect
            ) ||
            pointInsideObstacle(
                end,
                rect
            )
        ) {

            return true;

        }

        //----------------------------------
        // Horizontal Segment
        //----------------------------------

        if (
            nearlyEqual(
                start.y,
                end.y
            )
        ) {

            const y =
                start.y;

            const left =
                Math.min(
                    start.x,
                    end.x
                );

            const right =
                Math.max(
                    start.x,
                    end.x
                );

            return (

                y >= rect.top &&

                y <= rect.bottom &&

                right >= rect.left &&

                left <= rect.right

            );

        }

        //----------------------------------
        // Vertical Segment
        //----------------------------------

        if (
            nearlyEqual(
                start.x,
                end.x
            )
        ) {

            const x =
                start.x;

            const top =
                Math.min(
                    start.y,
                    end.y
                );

            const bottom =
                Math.max(
                    start.y,
                    end.y
                );

            return (

                x >= rect.left &&

                x <= rect.right &&

                bottom >= rect.top &&

                top <= rect.bottom

            );

        }

        //----------------------------------
        // Generic Segment
        //----------------------------------

        const edges = [

            [
                {
                    x: rect.left,
                    y: rect.top
                },
                {
                    x: rect.right,
                    y: rect.top
                }
            ],

            [
                {
                    x: rect.right,
                    y: rect.top
                },
                {
                    x: rect.right,
                    y: rect.bottom
                }
            ],

            [
                {
                    x: rect.right,
                    y: rect.bottom
                },
                {
                    x: rect.left,
                    y: rect.bottom
                }
            ],

            [
                {
                    x: rect.left,
                    y: rect.bottom
                },
                {
                    x: rect.left,
                    y: rect.top
                }
            ]

        ];

        return edges.some(
            ([edgeStart, edgeEnd]) =>
                segmentsIntersect(

                    start,

                    end,

                    edgeStart,

                    edgeEnd

                )
        );

    }

    //----------------------------------
    // Segment Intersection
    //----------------------------------

    function segmentsIntersect(
        a,
        b,
        c,
        d
    ) {

        const orientation1 =
            orientation(
                a,
                b,
                c
            );

        const orientation2 =
            orientation(
                a,
                b,
                d
            );

        const orientation3 =
            orientation(
                c,
                d,
                a
            );

        const orientation4 =
            orientation(
                c,
                d,
                b
            );

        if (
            orientation1 !== orientation2 &&
            orientation3 !== orientation4
        ) {

            return true;

        }

        if (
            orientation1 === 0 &&
            pointOnSegment(
                a,
                c,
                b
            )
        ) {

            return true;

        }

        if (
            orientation2 === 0 &&
            pointOnSegment(
                a,
                d,
                b
            )
        ) {

            return true;

        }

        if (
            orientation3 === 0 &&
            pointOnSegment(
                c,
                a,
                d
            )
        ) {

            return true;

        }

        return (

            orientation4 === 0 &&

            pointOnSegment(
                c,
                b,
                d
            )

        );

    }

    //----------------------------------
    // Orientation
    //----------------------------------

    function orientation(
        a,
        b,
        c
    ) {

        const value =

            (
                b.y -
                a.y
            ) *
            (
                c.x -
                b.x
            ) -

            (
                b.x -
                a.x
            ) *
            (
                c.y -
                b.y
            );

        if (
            Math.abs(value) <
            0.000001
        ) {

            return 0;

        }

        return value > 0
            ? 1
            : 2;

    }

    //----------------------------------
    // Point On Segment
    //----------------------------------

    function pointOnSegment(
        start,
        point,
        end
    ) {

        return (

            point.x <=
                Math.max(
                    start.x,
                    end.x
                ) &&

            point.x >=
                Math.min(
                    start.x,
                    end.x
                ) &&

            point.y <=
                Math.max(
                    start.y,
                    end.y
                ) &&

            point.y >=
                Math.min(
                    start.y,
                    end.y
                )

        );

    }

    //----------------------------------
    // Canvas
    //----------------------------------

    function getRoutingCanvas() {

        return (

            document.getElementById(
                "canvasContainer"
            ) ||

            document.getElementById(
                "grid"
            ) ||

            null

        );

    }

    //----------------------------------
    // Canvas Scale
    //----------------------------------

    function getCanvasScale(canvas) {

        if (!canvas) {

            return {
                x: 1,
                y: 1
            };

        }

        const rect =
            canvas.getBoundingClientRect();

        return {

            x:
                canvas.offsetWidth
                    ? rect.width /
                      canvas.offsetWidth
                    : 1,

            y:
                canvas.offsetHeight
                    ? rect.height /
                      canvas.offsetHeight
                    : 1

        };

    }

    //----------------------------------
    // Cell Size
    //----------------------------------

    function getCellSize() {

        const configured =
            RoutingConfigV2
                ?.GRID
                ?.CELL_SIZE;

        if (
            typeof configured ===
            "function"
        ) {

            return (
                Number(
                    configured()
                ) || 140
            );

        }

        return (

            Number(configured) ||

            Number(
                window.SETTINGS
                    ?.cellSize
            ) ||

            140

        );

    }

    //----------------------------------
    // Column Count
    //----------------------------------

    function getColumnCount() {

        const configured =
            RoutingConfigV2
                ?.GRID
                ?.COLUMNS;

        if (
            typeof configured ===
            "function"
        ) {

            return (
                Number(
                    configured()
                ) || 1
            );

        }

        return (

            Number(configured) ||

            Number(
                window.SETTINGS
                    ?.columns
            ) ||

            1

        );

    }

    //----------------------------------
    // Utility
    //----------------------------------

    function nearlyEqual(
        a,
        b
    ) {

        return (
            Math.abs(
                a -
                b
            ) <
            0.000001
        );

    }

    function escapeSelector(value) {

        if (
            window.CSS &&
            typeof CSS.escape ===
                "function"
        ) {

            return CSS.escape(
                String(value)
            );

        }

        return String(value)
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "\\$&"
            );

    }

    function debugLog(
        ...values
    ) {

        if (
            RoutingConfigV2
                ?.DEBUG
                ?.ENABLED &&
            RoutingConfigV2
                ?.DEBUG
                ?.DRAW_OBSTACLES
        ) {

            console.log(
                "[RoutingObstacleV2]",
                ...values
            );

        }

    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {

        refresh,

        buildObstacles,

        getObstacles,

        getItemBounds,

        pointInsideObstacle,

        segmentHitsObstacle,

        routeHitsObstacle,

        segmentIntersectsRect

    };

})();

//----------------------------------
// Expose
//----------------------------------

window.RoutingObstacleV2 =
    RoutingObstacleV2;