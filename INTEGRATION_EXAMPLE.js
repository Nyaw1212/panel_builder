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

//----------------------------------
// Include Equipment Card Materials
//----------------------------------

const baseSerializeMaterialSummary =
  window.serializeMaterialSummary;

window.serializeMaterialSummary =
  function serializeMaterialSummaryWithEquipmentComponents() {
    const summary =
      baseSerializeMaterialSummary();

    const map = new Map(
      (summary || []).map(
        item => [
          String(
            item.CatalogNumber || "",
          ),
          item,
        ],
      ),
    );

    const seen = new Set();

    getLayout().forEach(
      equipment => {
        if (!equipment) return;

        if (
          seen.has(
            equipment.id,
          )
        ) {
          return;
        }

        seen.add(
          equipment.id,
        );

        (
          equipment.materials || []
        ).forEach(
          component => {
            const catalogNumber =
              String(
                component.CatalogNumber ??
                component.catalogNumber ??
                "",
              ).trim();

            if (!catalogNumber) {
              return;
            }

            const source =
              typeof getMaterial ===
              "function"
                ? getMaterial(
                    catalogNumber,
                  )
                : null;

            const material =
              source || component;

            const qty =
              Number(
                component.qty ??
                component.Qty ??
                1,
              ) || 0;

            if (!qty) {
              return;
            }

            const existing =
              map.get(
                catalogNumber,
              );

            if (existing) {
              existing.Qty =
                Number(
                  existing.Qty || 0,
                ) + qty;

              return;
            }

            const row = {
              CatalogNumber:
                catalogNumber,

              Description:
                material.Description ??
                material.description ??
                "",

              Type:
                material.Type ??
                material.type ??
                "",

              InventoryCategory:
                String(
                  material.InventoryCategory ??
                  material.inventoryCategory ??
                  material.category ??
                  "BOS",
                )
                  .trim()
                  .toUpperCase(),

              Supplier:
                material.Supplier ??
                material.supplier ??
                "",

              VendorCode:
                material.VendorCode ??
                material.vendorCode ??
                "",

              Price:
                Number(
                  material.Price ??
                  material.price ??
                  0,
                ) || 0,

              Qty:
                qty,
            };

            map.set(
              catalogNumber,
              row,
            );
          },
        );
      },
    );

    return Array.from(
      map.values(),
    ).sort(
      (a, b) =>
        String(
          a.CatalogNumber || "",
        ).localeCompare(
          String(
            b.CatalogNumber || "",
          ),
        ),
    );
  };
