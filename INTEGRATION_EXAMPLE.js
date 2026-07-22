//----------------------------------
// Panel Builder Manual Routing V3
//----------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const manualButton =
    document.getElementById("manualRouteButton");

  function findPanel(panelId) {
    const seen = new Set();

    return getLayout().find(item => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return String(item.id) === String(panelId);
    }) || null;
  }

  function findConnection(item, connectionId) {
    if (!item?.connections) return null;

    for (const side of CONNECTION_SIDES) {
      const connection = (item.connections[side] || []).find(
        entry => String(entry.id) === String(connectionId),
      );

      if (connection) return connection;
    }

    return null;
  }

  function refreshButton(enabled) {
    if (!manualButton) return;

    manualButton.classList.toggle(
      "manual-route-button--active",
      enabled,
    );

    manualButton.setAttribute(
      "aria-pressed",
      String(enabled),
    );

    manualButton.textContent = enabled
      ? "✏️ Manual: ON"
      : "✏️ Manual Link";
  }

  window.ManualRouting = initializeManualRoutingV3({
    svgSelector: "#svgLayer",
    gridSize: 12,

    resolveConnector(element) {
      const connectorElement = element.closest?.(
        "[data-connection-id]",
      );

      if (!connectorElement) return null;

      const panelId = connectorElement.dataset.panelId;
      const connectionId =
        connectorElement.dataset.connectionId;
      const item = findPanel(panelId);
      const connection = findConnection(item, connectionId);

      if (!item || !connection) return null;

      const point = getConnectionCenter(panelId, connectionId);
      if (!point) return null;

      return {
        panelId,
        connectionId,
        item,
        connection,
        point,
      };
    },

    resolveLink(element) {
      const path = element.closest?.("[data-link-id]");
      if (!path) return null;

      return getLink(path.dataset.linkId) || null;
    },

    createLink(startConnector) {
      return {
        id: crypto.randomUUID(),

        start: {
          panelId: startConnector.panelId,
          connectionId: startConnector.connectionId,
        },

        end: null,

        panels: {
          start: startConnector.item,
          end: null,
        },

        nodes: {
          start: startConnector.connection,
          end: null,
        },

        routingMode: "manual",

        manualRoute: {
          points: [],
          locked: false,
        },

        geometry: {
          type: "polyline",
          points: [],
        },

        length: 0,
        conduit: {
          type: "EMT",
          size: '2"',
        },
        assembly: [],
        materials: [],
      };
    },

    completeLink(link, endConnector) {
      if (
        String(link.start.connectionId) ===
        String(endConnector.connectionId)
      ) {
        return false;
      }

      link.end = {
        panelId: endConnector.panelId,
        connectionId: endConnector.connectionId,
      };

      link.panels.end = endConnector.item;
      link.nodes.end = endConnector.connection;

      link.nodes.start.links.push(link);
      link.nodes.end.links.push(link);

      getLinks().push(link);

      updateLinkLength(link);
      updateLinkAssembly(link);
      updateLinkMaterials(link);

      captureLinkHistory("Manual connection created");

      return true;
    },

    onRouteChanged(link, reason) {
      if (reason === "handle-complete") {
        captureLinkHistory("Manual route adjusted");
      }

      if (reason === "convert-to-manual") {
        captureLinkHistory("Connection converted to manual");
      }
    },

    onDrawingFinished() {
      drawLinks();
    },

    onLinkSelected(link) {
      if (link.routingMode === "manual") {
        ManualRouterEngineV3.select(link);
      }
    },

    onEnabledChanged(enabled) {
      refreshButton(enabled);
    },
  });

  manualButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    ManualRouting.toggle();
  });

  refreshButton(false);
});
