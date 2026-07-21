//———————————- // Routing Optimizer V2 //———————————-

const RoutingOptimizerV2 = (() => {

    function optimize(route) {

        if (!Array.isArray(route) || route.length < 2) {
            return [];
        }

        let points = clone(route);

        points = RoutingGeometryV2.removeDuplicatePoints(points);
        points = RoutingGeometryV2.simplifyRoute(points);

        points = removeCollinear(points);
        points = removeTinySegments(points);
        points = snapOrthogonal(points);
        points = mergeStraightSegments(points);

        return points;
    }

    function removeCollinear(points) {

        if (points.length < 3) return points;

        const output = [points[0]];

        for (let i = 1; i < points.length - 1; i++) {

            const a = output[output.length - 1];
            const b = points[i];
            const c = points[i + 1];

            const sameX =
                a.x === b.x &&
                b.x === c.x;

            const sameY =
                a.y === b.y &&
                b.y === c.y;

            if (sameX || sameY) {
                continue;
            }

            output.push(b);
        }

        output.push(points.at(-1));

        return output;
    }

    function removeTinySegments(points) {

        const min =
            RoutingConfigV2.LINKS.MIN_SEGMENT_LENGTH || 0;

        if (min <= 0) return points;

        const output = [points[0]];

        for (let i = 1; i < points.length; i++) {

            const last = output.at(-1);
            const current = points[i];

            const len =
                RoutingGeometryV2.segmentLength(
                    last,
                    current
                );

            if (len >= min || i === points.length - 1) {
                output.push(current);
            }

        }

        return output;
    }

    function snapOrthogonal(points) {

        const out = clone(points);

        for (let i = 1; i < out.length; i++) {

            const prev = out[i - 1];
            const cur = out[i];

            if (
                Math.abs(cur.x - prev.x) <
                Math.abs(cur.y - prev.y)
            ) {
                cur.x = prev.x;
            } else {
                cur.y = prev.y;
            }

        }

        return out;
    }

    function mergeStraightSegments(points) {

        if (points.length < 3) return points;

        const out = [points[0]];

        for (let i = 1; i < points.length - 1; i++) {

            const prev = out.at(-1);
            const cur = points[i];
            const next = points[i + 1];

            const horizontal =
                prev.y === cur.y &&
                cur.y === next.y;

            const vertical =
                prev.x === cur.x &&
                cur.x === next.x;

            if (horizontal || vertical) {
                continue;
            }

            out.push(cur);

        }

        out.push(points.at(-1));

        return out;
    }

    function clone(points) {
        return points.map(p => ({
            x: p.x,
            y: p.y
        }));
    }

    return {
        optimize,
        removeCollinear,
        removeTinySegments,
        snapOrthogonal,
        mergeStraightSegments
    };

})();

window.RoutingOptimizerV2 = RoutingOptimizerV2;