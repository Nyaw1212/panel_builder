//----------------------------------
// Panel Builder Integration Example
//----------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    window.ManualRouting =
      initializeManualRoutingV3({
        svgSelector:
          "#svgLayer",

        gridSize: 12,

        resolveConnector(element) {
          const connectorElement =
            element.closest(
              "[data-connection-id]",
            );

          if (!connectorElement) {
            return null;
          }

          const panelId =
            connectorElement.dataset.panelId;

          const connectionId =
            connectorElement.dataset.connectionId;

          const point =
            getConnectionCenter(
              panelId,
              connectionId,
            );

          if (!point) {
            return null;
          }

          return {
            panelId,
            connectionId,
            point,
          };
        },

        resolveLink(element) {
          const path =
            element.closest(
              "[data-link-id]",
            );

          if (!path) {
            return null;
          }

          return links.find(
            (link) =>
              String(link.id) ===
              String(
                path.dataset.linkId,
              ),
          );
        },

        createLink(
          startConnector,
        ) {
          const link = {
            id:
              crypto.randomUUID(),

            start: {
              panelId:
                startConnector.panelId,

              connectionId:
                startConnector.connectionId,
            },

            end: null,

            routingMode:
              "manual",

            manualRoute: {
              points: [],
              locked: false,
            },

            geometry: {
              type:
                "polyline",

              points: [],
            },
          };

          links.push(link);

          return link;
        },

        completeLink(
          link,
          endConnector,
        ) {
          link.end = {
            panelId:
              endConnector.panelId,

            connectionId:
              endConnector.connectionId,
          };
        },

        onRouteChanged(
          link,
          reason,
        ) {
          console.log(
            "Manual route update",
            reason,
            link,
          );

          // Optional:
          // HistoryManagerV2.capture(...)
          // scheduleAutoSave(...)
        },
      });

    //----------------------------------
    // Example Toolbar Button
    //----------------------------------

    document
      .querySelector(
        "#manualRouteButton",
      )
      ?.addEventListener(
        "click",
        () => {
          ManualRouting.toggle();
        },
      );
  },
);
