# Manual Routing V3

Manual Routing V3 adds user-drawn orthogonal links to the existing Panel Builder.

It does **not** remove Routing V2. Links can use either:

```js
link.routingMode = "auto";
```

or:

```js
link.routingMode = "manual";
```

Manual routes always use horizontal and vertical segments.

## Included features

- Click-to-draw orthogonal links
- Click to place bend points
- Grid snapping
- Double-click or Enter to finish
- Escape to cancel
- Manual bend handles
- Convert automatic routes to manual
- Convert manual routes back to automatic
- Save/load helper
- Compatibility wrapper for `updateLinkGeometry()`

## Script order

Load your current `linkGeometry.js` and Routing V2 first. Then load Manual Routing V3 in this exact order:

```html
<link
  rel="stylesheet"
  href="V3/manualRoute.css"
/>

<script src="V3/manualRouteGrid.js"></script>
<script src="V3/manualRouteSnap.js"></script>
<script src="V3/manualRouteSegments.js"></script>
<script src="V3/manualRouteHitTest.js"></script>
<script src="V3/manualRouteSerializer.js"></script>
<script src="V3/manualRouteRenderer.js"></script>
<script src="V3/manualRouteHandles.js"></script>
<script src="V3/manualRouterEngine.js"></script>
<script src="V3/manualRouteInput.js"></script>
<script src="V3/manualRouteBridge.js"></script>
<script src="V3/manualRouteBootstrap.js"></script>
```

## Basic initialization

The application-specific part is resolving connectors and links from DOM elements.

```js
const ManualRouting = initializeManualRoutingV3({
  svgSelector: "#svgLayer",
  gridSize: 12,

  resolveConnector(element) {
    const connectorElement =
      element.closest("[data-connection-id]");

    if (!connectorElement) {
      return null;
    }

    const panelId =
      connectorElement.dataset.panelId;

    const connectionId =
      connectorElement.dataset.connectionId;

    return {
      panelId,
      connectionId,

      point:
        getConnectionCenter(
          panelId,
          connectionId,
        ),
    };
  },

  resolveLink(element) {
    const path =
      element.closest("[data-link-id]");

    if (!path) {
      return null;
    }

    return links.find(
      (link) =>
        String(link.id) ===
        String(path.dataset.linkId),
    );
  },

  createLink(startConnector) {
    const link = {
      id: crypto.randomUUID(),

      start: {
        panelId:
          startConnector.panelId,

        connectionId:
          startConnector.connectionId,
      },

      end: null,

      routingMode: "manual",

      geometry: {
        type: "polyline",
        points: [],
      },
    };

    links.push(link);

    return link;
  },

  completeLink(link, endConnector) {
    link.end = {
      panelId:
        endConnector.panelId,

      connectionId:
        endConnector.connectionId,
    };
  },

  onRouteChanged(link, reason) {
    console.log(
      "Manual route changed:",
      reason,
      link,
    );

    // Add your existing history/autosave hook here.
  },
});
```

Enable drawing:

```js
ManualRouting.enable();
```

Disable drawing:

```js
ManualRouting.disable();
```

## Convert an existing automatic link

```js
ManualRouting.convertToManual(
  links[0],
);
```

The current automatic geometry becomes editable manual geometry.

Return it to automatic routing:

```js
ManualRouting.convertToAuto(
  links[0],
);
```

## Required renderer metadata

For link selection, each SVG link path should have:

```html
data-link-id="THE_LINK_ID"
```

For connector resolution, connector DOM elements should expose:

```html
data-panel-id="PANEL_ID"
data-connection-id="CONNECTION_ID"
```

Adjust `resolveConnector()` and `resolveLink()` if your current DOM uses different attributes.

## Saving

The safest approach is to include these properties in each saved link:

```js
{
  routingMode: link.routingMode,
  manualRoute: link.manualRoute
}
```

Before saving a project, you may run:

```js
const linksToSave =
  ManualRouteSerializerV3.prepareProjectLinks(
    links,
  );
```

After loading:

```js
ManualRouteSerializerV3.restoreProjectLinks(
  links,
);
```

The bridge also restores `manualRoutingV3` automatically when installed.

## Important integration note

This package cannot know the exact internal functions your current link creator uses. The supplied callbacks isolate that application-specific portion:

- `resolveConnector`
- `resolveLink`
- `createLink`
- `completeLink`
- `onRouteChanged`

Everything else is already implemented.
