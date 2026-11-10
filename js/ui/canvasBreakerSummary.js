// Compact breaker labels for canvas panel cards.
// Kept outside canvas.js so it can be added without disturbing canvas rendering
// features such as the disconnect fuse display.
(function initializeCanvasBreakerSummary() {
  "use strict";

  const summaryClass = "canvas-breaker-summary-addon";
  let refreshQueued = false;

  function getBreakerAmperage(material, catalogNumber) {
    if (typeof window.getBreakerAmperage === "function") {
      const amperage = Number(window.getBreakerAmperage(material));
      if (amperage > 0) return amperage;
    }

    const direct = Number(
      material?.Amperage ?? material?.Amps ?? material?.Amp ?? material?.Rating
    );
    if (direct > 0) return direct;

    const description = [
      material?.Description,
      material?.Type,
      material?.Size
    ].join(" ");
    const descriptionMatch = description.match(/(\d{1,3})\s*A(?:MP)?\b/i);
    if (descriptionMatch) return Number(descriptionMatch[1]);

    const catalogMatch = String(catalogNumber || "")
      .trim()
      .toUpperCase()
      .match(/^(?:BR|CHP|CHF|CSR)([1-4])(\d{2,4})/);

    return catalogMatch ? Number(catalogMatch[2]) : 0;
  }

  function getPanelBreakerSummary(item) {
    const materials = typeof window.getMaterials === "function"
      ? window.getMaterials()
      : [];
    const catalog = new Map(
      (Array.isArray(materials) ? materials : [])
        .map(material => [
          String(material?.CatalogNumber || "").trim().toUpperCase(),
          material
        ])
    );
    const grouped = new Map();

    (Array.isArray(item?.materials) ? item.materials : []).forEach(entry => {
      if (entry?.panelSlot?.section !== "branch") return;

      const catalogNumber = String(
        entry?.catalogNumber || entry?.CatalogNumber || ""
      ).trim();
      const material = catalog.get(catalogNumber.toUpperCase()) || entry;
      const amperage = getBreakerAmperage(material, catalogNumber);

      if (!amperage) return;

      const poles = Math.max(1, Number(
        entry?.panelSlot?.span ||
        (typeof window.getBreakerPoleCount === "function"
          ? window.getBreakerPoleCount(material)
          : 2)
      ));
      const label = poles === 2 ? `${amperage}A` : `${amperage}A${poles}P`;

      grouped.set(label, {
        label,
        amperage,
        poles,
        quantity: (grouped.get(label)?.quantity || 0) + 1
      });
    });

    return [...grouped.values()].sort((left, right) =>
      right.amperage - left.amperage || right.poles - left.poles
    );
  }

  function getCanvasItem(card, layout) {
    const itemId = String(card.dataset.itemId || "");
    const byId = layout.find(item => String(item?.id || "") === itemId);

    if (byId) return byId;

    const cell = card.closest(".cell");
    const cellIndex = Number(cell?.dataset?.index);

    return Number.isFinite(cellIndex)
      ? layout.find(item => Number(item?.startCell) === cellIndex)
      : null;
  }

  function renderCanvasBreakerSummaries() {
    const layout = typeof window.getLayout === "function"
      ? window.getLayout()
      : [];

    if (!Array.isArray(layout)) return;

    document.querySelectorAll(".panel-card").forEach(card => {
      card.querySelector(`.${summaryClass}`)?.remove();

      const breakers = getPanelBreakerSummary(getCanvasItem(card, layout));
      if (!breakers.length) return;

      const summary = document.createElement("div");
      summary.className = summaryClass;
      summary.title = `Installed breakers: ${breakers
        .map(entry => `${entry.label}${entry.quantity > 1 ? ` × ${entry.quantity}` : ""}`)
        .join(" · ")}`;
      summary.style.cssText = [
        "position:absolute",
        "left:50%",
        "bottom:-34px",
        "z-index:40",
        "display:flex",
        "flex-wrap:wrap",
        "justify-content:center",
        "gap:5px",
        "width:max-content",
        "max-width:calc(100% + 50px)",
        "transform:translateX(-50%)",
        "pointer-events:none"
      ].join(";");

      breakers.forEach(entry => {
        const badge = document.createElement("span");
        badge.textContent = entry.quantity > 1
          ? `${entry.label} ×${entry.quantity}`
          : entry.label;
        badge.style.cssText = [
          "padding:3px 8px",
          "border:1px solid rgba(134,239,172,.58)",
          "border-radius:5px",
          "color:#bbf7d0",
          "background:rgba(20,83,45,.86)",
          "font-size:16px",
          "font-weight:800",
          "line-height:1.15",
          "white-space:nowrap",
          "text-shadow:0 1px 3px rgba(0,0,0,.8)"
        ].join(";");
        summary.appendChild(badge);
      });

      card.appendChild(summary);
    });
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;

    requestAnimationFrame(() => {
      refreshQueued = false;
      renderCanvasBreakerSummaries();
    });
  }

  function watchCanvas() {
    const grid = document.getElementById("grid");
    if (!grid) {
      requestAnimationFrame(watchCanvas);
      return;
    }

    new MutationObserver(mutations => {
      const changesCanvasCards = mutations.some(mutation =>
        [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
          node.nodeType !== Node.ELEMENT_NODE ||
          !node.classList.contains(summaryClass)
        )
      );

      if (changesCanvasCards) queueRefresh();
    }).observe(grid, {
      childList: true,
      subtree: true
    });
    queueRefresh();
  }

  // Panel breaker buttons mutate panel materials in place. Schedule a refresh
  // after those clicks without changing the established canvas implementation.
  document.addEventListener("click", event => {
    if (event.target.closest(".panel-breaker-matrix-choice, .panel-slot-remove")) {
      setTimeout(queueRefresh, 0);
    }
  }, true);

  window.refreshCanvasBreakerSummaries = queueRefresh;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchCanvas, { once: true });
  } else {
    watchCanvas();
  }
}());
