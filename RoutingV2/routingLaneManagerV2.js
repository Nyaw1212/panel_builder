//———————————- // Routing Lane Manager V2 //———————————-

const RoutingLaneManagerV2 = (() => {

    const horizontalLanes = new Map();
    const verticalLanes = new Map();

    function reset() {
        horizontalLanes.clear();
        verticalLanes.clear();
    }

    function registerRoute(route, routeId = null) {
        if (!Array.isArray(route) || route.length < 2) return;

        for (let i = 0; i < route.length - 1; i++) {
            const a = route[i];
            const b = route[i + 1];

            if (a.y === b.y) {
                registerHorizontal(a, b, routeId);
            } else if (a.x === b.x) {
                registerVertical(a, b, routeId);
            }
        }
    }

    function registerHorizontal(a, b, routeId) {
        const key = a.y;
        if (!horizontalLanes.has(key)) horizontalLanes.set(key, []);
        horizontalLanes.get(key).push({
            left: Math.min(a.x, b.x),
            right: Math.max(a.x, b.x),
            routeId
        });
    }

    function registerVertical(a, b, routeId) {
        const key = a.x;
        if (!verticalLanes.has(key)) verticalLanes.set(key, []);
        verticalLanes.get(key).push({
            top: Math.min(a.y, b.y),
            bottom: Math.max(a.y, b.y),
            routeId
        });
    }

    function isHorizontalOccupied(y,left,right){
        const lanes=horizontalLanes.get(y);
        if(!lanes) return false;
        return lanes.some(l=>!(right<l.left||left>l.right));
    }

    function isVerticalOccupied(x,top,bottom){
        const lanes=verticalLanes.get(x);
        if(!lanes) return false;
        return lanes.some(l=>!(bottom<l.top||top>l.bottom));
    }

    function findFreeHorizontalLane(y,left,right){
        const spacing=RoutingConfigV2.COMB.LANE_SPACING;
        let candidate=y;
        while(isHorizontalOccupied(candidate,left,right)){
            candidate+=spacing;
        }
        return candidate;
    }

    function findFreeVerticalLane(x,top,bottom){
        const spacing=RoutingConfigV2.COMB.LANE_SPACING;
        let candidate=x;
        while(isVerticalOccupied(candidate,top,bottom)){
            candidate+=spacing;
        }
        return candidate;
    }

    return {
        reset,
        registerRoute,
        findFreeHorizontalLane,
        findFreeVerticalLane,
        isHorizontalOccupied,
        isVerticalOccupied,
        getHorizontalLanes:()=>horizontalLanes,
        getVerticalLanes:()=>verticalLanes
    };

})();

window.RoutingLaneManagerV2=RoutingLaneManagerV2;