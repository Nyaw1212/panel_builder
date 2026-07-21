//----------------------------------
// Manual Route Serializer V3
//----------------------------------

(function () {
  "use strict";

  function serialize(link) {
    if (!link) return null;

    return {
      routingMode:
        link.routingMode || "auto",

      manualRoute:
        link.manualRoute
          ? {
              points:
                ManualRouteSegmentsV3.clean(
                  link.manualRoute.points || [],
                ),

              locked:
                Boolean(link.manualRoute.locked),
            }
          : null,
    };
  }

  function deserialize(link, data) {
    if (!link || !data) return link;

    link.routingMode =
      data.routingMode || "auto";

    if (data.manualRoute) {
      link.manualRoute = {
        points:
          ManualRouteSegmentsV3.enforceOrthogonal(
            data.manualRoute.points || [],
          ),

        locked:
          Boolean(data.manualRoute.locked),
      };
    }

    return link;
  }

  function prepareProjectLinks(links = []) {
    return links.map((link) => ({
      ...link,
      manualRoutingV3:
        serialize(link),
    }));
  }

  function restoreProjectLinks(links = []) {
    links.forEach((link) => {
      if (link.manualRoutingV3) {
        deserialize(
          link,
          link.manualRoutingV3,
        );
      }
    });

    return links;
  }

  window.ManualRouteSerializerV3 = {
    serialize,
    deserialize,
    prepareProjectLinks,
    restoreProjectLinks,
  };
})();
