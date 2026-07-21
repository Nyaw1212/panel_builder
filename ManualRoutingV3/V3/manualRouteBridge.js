//----------------------------------
// Manual Route Bridge V3
//----------------------------------

(function () {
  "use strict";

  const original = {
    updateLinkGeometry: null,
  };

  let installed = false;

  function install(options = {}) {
    if (installed) return;

    installed = true;

    original.updateLinkGeometry =
      window.updateLinkGeometry;

    window.updateLinkGeometry =
      function updateLinkGeometryV3(link) {
        if (
          link?.routingMode === "manual" &&
          link.manualRoute?.points
        ) {
          ManualRouterEngineV3.syncGeometry(
            link,
          );

          return;
        }

        if (
          typeof original.updateLinkGeometry ===
          "function"
        ) {
          return original.updateLinkGeometry(
            link,
          );
        }
      };

    if (Array.isArray(window.links)) {
      ManualRouteSerializerV3.restoreProjectLinks(
        window.links,
      );

      window.links.forEach((link) => {
        if (
          link.routingMode === "manual"
        ) {
          ManualRouterEngineV3.syncGeometry(
            link,
          );
        }
      });
    }

    options.onInstalled?.();
  }

  function uninstall() {
    if (!installed) return;

    if (
      original.updateLinkGeometry
    ) {
      window.updateLinkGeometry =
        original.updateLinkGeometry;
    }

    installed = false;
  }

  window.ManualRouteBridgeV3 = {
    install,
    uninstall,

    isInstalled() {
      return installed;
    },
  };
})();
