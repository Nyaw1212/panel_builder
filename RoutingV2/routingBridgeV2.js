//----------------------------------
// Routing Bridge V2
//----------------------------------

const RoutingBridgeV2 = (() => {

    //----------------------------------
    // State
    //----------------------------------

    let installed = false;

    let originalUpdateLinkGeometry = null;

    //----------------------------------
    // Install Bridge
    //----------------------------------

    function install(options = {}) {

        if (installed) {
            return true;
        }

        if (
            options.replaceGlobal !== false &&
            typeof window.updateLinkGeometry === "function"
        ) {
            originalUpdateLinkGeometry =
                window.updateLinkGeometry;
        }

        if (options.replaceGlobal !== false) {
            window.updateLinkGeometry =
                updateLinkGeometry;
        }

        installed = true;

        return true;
    }

    //----------------------------------
    // Uninstall Bridge
    //----------------------------------

    function uninstall() {

        if (!installed) {
            return true;
        }

        if (
            originalUpdateLinkGeometry &&
            window.updateLinkGeometry ===
                updateLinkGeometry
        ) {
            window.updateLinkGeometry =
                originalUpdateLinkGeometry;
        }

        installed = false;

        return true;
    }

    //----------------------------------
    // Update Link Geometry
    //----------------------------------

    function updateLinkGeometry(
        link,
        options = {}
    ) {

        if (!link) {
            return null;
        }

        const geometry =
            ensureGeometry(link);

        const endpoints =
            resolveLinkEndpoints(
                link,
                options
            );

        if (!endpoints) {
            clearGeometry(link);

            return null;
        }

        const {
            startCenter,
            startExit,
            endExit,
            endCenter
        } = endpoints;

        const routeOptions =
            buildRouteOptions(
                link,
                options
            );

        //----------------------------------
        // Route between node exits
        //----------------------------------

        const routedPoints =
            SmartRouterV2.createRoute(
                startExit,
                endExit,
                routeOptions
            );

        if (
            !Array.isArray(routedPoints) ||
            routedPoints.length < 2
        ) {
            clearGeometry(link);

            return null;
        }

        //----------------------------------
        // Add exact node centers
        //----------------------------------

        let finalPoints = [
            clonePoint(startCenter),
            ...routedPoints.map(clonePoint),
            clonePoint(endCenter)
        ];

        finalPoints =
            removeDuplicatePoints(
                finalPoints
            );

        //----------------------------------
        // Preserve exact endpoint segments
        //----------------------------------

        finalPoints =
            normalizeEndpointSegments(
                finalPoints,
                startCenter,
                startExit,
                endExit,
                endCenter
            );

        finalPoints =
            RoutingOptimizerV2.optimize(
                finalPoints
            );

        //----------------------------------
        // Restore exact endpoints after
        // optimization
        //----------------------------------

        finalPoints[0] =
            clonePoint(startCenter);

        finalPoints[
            finalPoints.length - 1
        ] = clonePoint(endCenter);

        geometry.type = "polyline";
        geometry.points = finalPoints;

        geometry.startCenter =
            clonePoint(startCenter);

        geometry.startExit =
            clonePoint(startExit);

        geometry.endExit =
            clonePoint(endExit);

        geometry.endCenter =
            clonePoint(endCenter);

        geometry.router = "RoutingV2";
        geometry.valid = true;

        return geometry;

    }

    //----------------------------------
    // Route One Link
    //----------------------------------

    function routeLink(
        link,
        options = {}
    ) {
        return updateLinkGeometry(
            link,
            options
        );
    }

    //----------------------------------
    // Route Multiple Links
    //----------------------------------

    function routeLinks(
        links,
        options = {}
    ) {

        if (!Array.isArray(links)) {
            return [];
        }

        if (
            options.resetLanes !== false &&
            window.RoutingLaneManagerV2
        ) {
            RoutingLaneManagerV2.reset();
        }

        const routed = [];

        for (
            let index = 0;
            index < links.length;
            index++
        ) {

            const link = links[index];

            const geometry =
                updateLinkGeometry(
                    link,
                    {
                        ...options,

                        routeId:
                            getLinkId(
                                link,
                                index
                            ),

                        existingRoutes:
                            getExistingRoutes(
                                links,
                                link
                            )
                    }
                );

            routed.push({
                link,
                geometry
            });
        }

        return routed;

    }

    //----------------------------------
    // Rebuild All Geometry
    //----------------------------------

    function rebuildAll(
        links,
        options = {}
    ) {

        if (
            window.RoutingObstacleV2 &&
            typeof RoutingObstacleV2.refresh ===
                "function"
        ) {
            RoutingObstacleV2.refresh();
        }

        return routeLinks(
            links,
            {
                ...options,
                resetLanes: true
            }
        );

    }

    //----------------------------------
    // Resolve Link Endpoints
    //----------------------------------

    function resolveLinkEndpoints(
        link,
        options = {}
    ) {

        const startRef =
            getEndpointReference(
                link,
                "start"
            );

        const endRef =
            getEndpointReference(
                link,
                "end"
            );

        if (!startRef || !endRef) {
            return null;
        }

        const startCenter =
            resolveCenter(
                startRef,
                options
            );

        const endCenter =
            resolveCenter(
                endRef,
                options
            );

        const startExit =
            resolveExit(
                startRef,
                options
            );

        const endExit =
            resolveExit(
                endRef,
                options
            );

        if (
            !isPoint(startCenter) ||
            !isPoint(endCenter) ||
            !isPoint(startExit) ||
            !isPoint(endExit)
        ) {
            return null;
        }

        return {
            startCenter,
            startExit,
            endExit,
            endCenter
        };

    }

    //----------------------------------
    // Endpoint Reference
    //----------------------------------

    function getEndpointReference(
        link,
        side
    ) {

        const endpoint =
            link?.[side];

        if (!endpoint) {
            return null;
        }

        return {
            panelId:
                endpoint.panelId ??
                endpoint.nodeId ??
                endpoint.ownerId ??
                null,

            connectionId:
                endpoint.connectionId ??
                endpoint.portId ??
                endpoint.connectorId ??
                endpoint.id ??
                null,

            point:
                endpoint.point ??
                endpoint.position ??
                null,

            center:
                endpoint.center ??
                null,

            exit:
                endpoint.exit ??
                null,

            raw:
                endpoint
        };

    }

    //----------------------------------
    // Resolve Center
    //----------------------------------

    function resolveCenter(
        endpoint,
        options
    ) {

        if (isPoint(endpoint.center)) {
            return clonePoint(
                endpoint.center
            );
        }

        if (
            typeof options.getCenter ===
                "function"
        ) {
            const point =
                options.getCenter(
                    endpoint
                );

            if (isPoint(point)) {
                return clonePoint(point);
            }
        }

        if (
            typeof window.getConnectionCenter ===
                "function" &&
            endpoint.panelId != null &&
            endpoint.connectionId != null
        ) {
            const point =
                window.getConnectionCenter(
                    endpoint.panelId,
                    endpoint.connectionId
                );

            if (isPoint(point)) {
                return clonePoint(point);
            }
        }

        if (isPoint(endpoint.point)) {
            return clonePoint(
                endpoint.point
            );
        }

        return null;

    }

    //----------------------------------
    // Resolve Exit
    //----------------------------------

    function resolveExit(
        endpoint,
        options
    ) {

        if (isPoint(endpoint.exit)) {
            return clonePoint(
                endpoint.exit
            );
        }

        if (
            typeof options.getExit ===
                "function"
        ) {
            const point =
                options.getExit(
                    endpoint
                );

            if (isPoint(point)) {
                return clonePoint(point);
            }
        }

        if (
            typeof window.getNodeExitPoint ===
                "function" &&
            endpoint.panelId != null &&
            endpoint.connectionId != null
        ) {
            const point =
                window.getNodeExitPoint(
                    endpoint.panelId,
                    endpoint.connectionId
                );

            if (isPoint(point)) {
                return clonePoint(point);
            }
        }

        return resolveCenter(
            endpoint,
            options
        );

    }

    //----------------------------------
    // Route Options
    //----------------------------------

    function buildRouteOptions(
        link,
        options
    ) {

        return {
            ...options,

            routeId:
                options.routeId ??
                getLinkId(link),

            link,

            sourceObstacleId:
                options.sourceObstacleId ??
                link?.start?.panelId ??
                link?.start?.nodeId ??
                null,

            targetObstacleId:
                options.targetObstacleId ??
                link?.end?.panelId ??
                link?.end?.nodeId ??
                null,

            ignoredObstacleIds:
                buildIgnoredObstacleIds(
                    link,
                    options
                ),

            existingRoutes:
                options.existingRoutes ??
                getExistingRoutesFromGlobal(
                    link
                )
        };

    }

    //----------------------------------
    // Ignored Endpoint Obstacles
    //----------------------------------

    function buildIgnoredObstacleIds(
        link,
        options
    ) {

        const ids = new Set(
            Array.isArray(
                options.ignoredObstacleIds
            )
                ? options.ignoredObstacleIds
                : []
        );

        const startId =
            link?.start?.panelId ??
            link?.start?.nodeId;

        const endId =
            link?.end?.panelId ??
            link?.end?.nodeId;

        if (startId != null) {
            ids.add(startId);
        }

        if (endId != null) {
            ids.add(endId);
        }

        return Array.from(ids);

    }

    //----------------------------------
    // Existing Routes
    //----------------------------------

    function getExistingRoutesFromGlobal(
        currentLink
    ) {

        const collections = [
            window.links,
            window.Links,
            window.linkStore?.links,
            window.LinkStore?.links,
            window.PanelBuilderState?.links,
            window.AppState?.links
        ];

        for (
            let index = 0;
            index < collections.length;
            index++
        ) {

            const collection =
                collections[index];

            if (!Array.isArray(collection)) {
                continue;
            }

            return getExistingRoutes(
                collection,
                currentLink
            );
        }

        return [];

    }

    function getExistingRoutes(
        links,
        currentLink
    ) {

        if (!Array.isArray(links)) {
            return [];
        }

        return links
            .filter(
                link =>
                    link &&
                    link !== currentLink
            )
            .map(
                link => ({
                    id: getLinkId(link),
                    points:
                        link?.geometry?.points ??
                        []
                })
            )
            .filter(
                route =>
                    Array.isArray(
                        route.points
                    ) &&
                    route.points.length >= 2
            );

    }

    //----------------------------------
    // Geometry Helpers
    //----------------------------------

    function ensureGeometry(link) {

        if (
            typeof window.initializeLinkGeometry ===
                "function"
        ) {
            return window
                .initializeLinkGeometry(
                    link
                );
        }

        if (!link.geometry) {
            link.geometry = {
                type: "polyline",
                points: []
            };
        }

        if (
            !Array.isArray(
                link.geometry.points
            )
        ) {
            link.geometry.points = [];
        }

        return link.geometry;

    }

    function clearGeometry(link) {

        if (
            typeof window.clearLinkGeometry ===
                "function"
        ) {
            window.clearLinkGeometry(link);

            return;
        }

        const geometry =
            ensureGeometry(link);

        geometry.points = [];
        geometry.valid = false;

    }

    //----------------------------------
    // Endpoint Normalization
    //----------------------------------

    function normalizeEndpointSegments(
        points,
        startCenter,
        startExit,
        endExit,
        endCenter
    ) {

        let output =
            removeDuplicatePoints(
                points
            );

        if (
            !samePoint(
                output[0],
                startCenter
            )
        ) {
            output.unshift(
                clonePoint(startCenter)
            );
        }

        if (
            !samePoint(
                output[1],
                startExit
            )
        ) {
            output.splice(
                1,
                0,
                clonePoint(startExit)
            );
        }

        const lastIndex =
            output.length - 1;

        if (
            !samePoint(
                output[lastIndex],
                endCenter
            )
        ) {
            output.push(
                clonePoint(endCenter)
            );
        }

        const beforeLast =
            output.length - 2;

        if (
            !samePoint(
                output[beforeLast],
                endExit
            )
        ) {
            output.splice(
                beforeLast + 1,
                0,
                clonePoint(endExit)
            );
        }

        return removeDuplicatePoints(
            output
        );

    }

    //----------------------------------
    // Utilities
    //----------------------------------

    function getLinkId(
        link,
        fallback = null
    ) {

        return (
            link?.id ??
            link?.linkId ??
            link?.uuid ??
            fallback
        );

    }

    function clonePoint(point) {

        return {
            x: Number(point.x),
            y: Number(point.y)
        };

    }

    function isPoint(point) {

        return (
            point &&
            Number.isFinite(
                Number(point.x)
            ) &&
            Number.isFinite(
                Number(point.y)
            )
        );

    }

    function samePoint(
        first,
        second
    ) {

        return (
            isPoint(first) &&
            isPoint(second) &&
            Number(first.x) ===
                Number(second.x) &&
            Number(first.y) ===
                Number(second.y)
        );

    }

    function removeDuplicatePoints(
        points
    ) {

        if (
            window.RoutingGeometryV2 &&
            typeof RoutingGeometryV2
                .removeDuplicatePoints ===
                "function"
        ) {
            return RoutingGeometryV2
                .removeDuplicatePoints(
                    points
                );
        }

        const output = [];

        for (
            let index = 0;
            index < points.length;
            index++
        ) {

            const point =
                points[index];

            if (!isPoint(point)) {
                continue;
            }

            if (
                output.length === 0 ||
                !samePoint(
                    output[
                        output.length - 1
                    ],
                    point
                )
            ) {
                output.push(
                    clonePoint(point)
                );
            }
        }

        return output;

    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {

        install,

        uninstall,

        isInstalled() {
            return installed;
        },

        updateLinkGeometry,

        routeLink,

        routeLinks,

        rebuildAll,

        resolveLinkEndpoints,

        getExistingRoutes

    };

})();

//----------------------------------
// Expose
//----------------------------------

window.RoutingBridgeV2 =
    RoutingBridgeV2;