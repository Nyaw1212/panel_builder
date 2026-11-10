// ----------------------------------
// VAN fitting guess prototype
// ----------------------------------
//
// This is intentionally a preview-only tool.  It never changes BOS,
// conduit, wire, or the selected template.  It lets the estimator describe
// the *families* of connector/coupling that are allowed, then shows the
// compatible MML alternatives and the simple automatic-item quantities.

(function () {
    "use strict";

    const FITTING_FAMILIES = {
        connector: {
            label: "Connectors used",
            sizes: {
                "2\"": ["RT", "DIECAST", "EMT", "LT"],
                "1\"": ["RT"]
            }
        },
        coupling: {
            label: "Couplings used",
            sizes: {
                "2\"": ["RT"],
                "1\"": ["RT", "LT"]
            }
        }
    };

    let overlay = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalized(value) {
        return String(value || "").trim().toUpperCase();
    }

    function normalizeSize(value) {
        return normalized(value).replace(/\s+/g, "");
    }

    function allCatalogMaterials() {
        const list = typeof window.getMaterials === "function"
            ? window.getMaterials()
            : window.materials;
        return Array.isArray(list) ? list : [];
    }

    function fittingKind(item) {
        const nodeType = normalized(item?.NodeType);
        const description = normalized(item?.Description);
        if (nodeType === "CONNECTOR" || /\bCONNECTOR\b|\bCONN\b/.test(description)) {
            return "connector";
        }
        if (nodeType === "COUPLING" || /\bCOUPLING\b|\bCOUPL\b/.test(description)) {
            return "coupling";
        }
        return "";
    }

    function fittingFamily(item) {
        const text = [
            item?.CatalogNumber,
            item?.Description,
            item?.Color,
            item?.Type
        ].map(normalized).join(" ");

        if (/DIE\s*CAST/.test(text)) return "DIECAST";
        if (/LIQUID|SEALTIGHT|\bL\/?T\b/.test(text)) return "LT";
        if (/\bRT\b|RAIN\s*TIGHT|RAINTIGHT/.test(text)) return "RT";
        if (/\bEMT\b/.test(text)) return "EMT";
        return "";
    }

    function fittingSize(item) {
        return normalizeSize(item?.Size);
    }

    function getRunAndGutterFittings() {
        const entries = [];
        const runs = typeof window.getProjectRuns === "function"
            ? window.getProjectRuns()
            : [];
        const gutters = typeof window.getProjectGutters === "function"
            ? window.getProjectGutters()
            : [];

        [...runs, ...gutters].forEach(container => {
            (Array.isArray(container?.fittings) ? container.fittings : [])
                .forEach(fitting => entries.push(fitting));
        });

        return entries;
    }

    function getFittingRequirements() {
        const requirements = new Map();

        getRunAndGutterFittings().forEach(item => {
            const kind = fittingKind(item);
            const size = fittingSize(item);
            if (!kind || !size || !FITTING_FAMILIES[kind]?.sizes?.[size]) return;

            const key = `${kind}|${size}`;
            const current = requirements.get(key) || {
                kind,
                size,
                qty: 0,
                sourceCatalogs: new Set()
            };
            current.qty += Math.max(0, Number(item?.qty ?? item?.Qty ?? 0));
            const catalog = String(item?.CatalogNumber || item?.catalogNumber || "").trim();
            if (catalog) current.sourceCatalogs.add(catalog);
            requirements.set(key, current);
        });

        return [...requirements.values()].filter(item => item.qty > 0);
    }

    function layoutItems() {
        const layout = typeof window.getLayout === "function"
            ? window.getLayout()
            : [];
        return Array.isArray(layout) ? layout : [];
    }

    function countDisconnects() {
        return layoutItems().filter(item => {
            const text = [item?.data?.NodeType, item?.data?.Type, item?.preset]
                .map(normalized)
                .join(" ");
            return /DISCONNECT|L-DISC|H-DISC/.test(text);
        }).length;
    }

    function countPanels() {
        return layoutItems().filter(item => {
            const text = [item?.data?.NodeType, item?.data?.Type, item?.preset]
                .map(normalized)
                .join(" ");
            return /PANEL|PANELBOARD|\bMDP\b/.test(text) && !/DISCONNECT/.test(text);
        }).length;
    }

    function findAutoMaterial(kind) {
        const tests = {
            lockRing: item => {
                const text = [item?.NodeType, item?.Description, item?.CatalogNumber]
                    .map(normalized).join(" ");
                return /LOCK\s*(RING|NUT)/.test(text) && !/PLASTIC|SEALING/.test(text);
            },
            groundClamp: item => {
                const text = [item?.NodeType, item?.Description, item?.CatalogNumber]
                    .map(normalized).join(" ");
                return /GROUND\s*CLAMP/.test(text);
            },
            plasticBushing: item => {
                const text = [item?.NodeType, item?.Description, item?.CatalogNumber]
                    .map(normalized).join(" ");
                return /PLASTIC.*BUSHING|BUSHING.*PLASTIC/.test(text);
            }
        };

        return allCatalogMaterials().find(item => tests[kind]?.(item)) || null;
    }

    function selectedFamilies(root, kind, size) {
        return [...root.querySelectorAll(
            `input[data-kind="${kind}"][data-size="${size}"]:checked`
        )].map(input => input.value);
    }

    function candidatesFor(kind, size, families) {
        return allCatalogMaterials().filter(item =>
            fittingKind(item) === kind &&
            fittingSize(item) === size &&
            families.includes(fittingFamily(item))
        );
    }

    function choiceRows() {
        return Object.entries(FITTING_FAMILIES).map(([kind, definition]) => {
            const sizes = Object.entries(definition.sizes).map(([size, families]) => `
                <tr>
                    <th>${escapeHtml(size)}</th>
                    <td>${families.map(family => `
                        <label class="van-fitting-choice">
                            <input type="checkbox" data-kind="${kind}" data-size="${size}" value="${family}" checked>
                            <span>${escapeHtml(family)}</span>
                        </label>
                    `).join("")}</td>
                </tr>
            `).join("");

            return `
                <section class="van-fitting-group">
                    <h3>${escapeHtml(definition.label)}</h3>
                    <table><thead><tr><th>Size</th><th>Allowed fitting families</th></tr></thead>
                    <tbody>${sizes}</tbody></table>
                </section>
            `;
        }).join("");
    }

    function renderPreview(root) {
        const requirements = getFittingRequirements();
        const rows = requirements.map(requirement => {
            const families = selectedFamilies(root, requirement.kind, requirement.size);
            const candidates = candidatesFor(requirement.kind, requirement.size, families);
            const matched = candidates.length
                ? candidates.map(item => String(item.CatalogNumber || "").trim()).filter(Boolean).join(", ")
                : "No matching MML material";
            const existing = [...requirement.sourceCatalogs].join(", ") || "Template fitting";

            return `
                <tr>
                    <td>${escapeHtml(requirement.kind)}</td>
                    <td>${escapeHtml(requirement.size)}</td>
                    <td>${requirement.qty}</td>
                    <td>${escapeHtml(existing)}</td>
                    <td>${escapeHtml(matched)}</td>
                </tr>
            `;
        }).join("");

        const disconnects = countDisconnects();
        const panels = countPanels();
        const automatic = [
            { label: "Lock rings", qty: disconnects, material: findAutoMaterial("lockRing") },
            { label: "Ground clamps", qty: disconnects, material: findAutoMaterial("groundClamp") },
            { label: "Plastic bushings", qty: panels, material: findAutoMaterial("plasticBushing") }
        ];

        const autoRows = automatic.map(item => `
            <tr>
                <td>${escapeHtml(item.label)}</td>
                <td>${item.qty}</td>
                <td>${escapeHtml(item.material?.CatalogNumber || "No matching MML material")}</td>
                <td>${escapeHtml(item.material?.Description || "Choose this manually if your catalog uses a different name.")}</td>
            </tr>
        `).join("");

        root.querySelector("[data-preview]").innerHTML = `
            <section class="van-fitting-preview-section">
                <h3>Connector and coupling draft</h3>
                <p>This preserves the current template quantities. It only lists compatible replacement choices; it has not changed the project.</p>
                ${rows ? `<div class="van-fitting-table-wrap"><table><thead><tr><th>Type</th><th>Size</th><th>Qty</th><th>Current template catalog</th><th>Allowed MML catalog choices</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="van-fitting-empty">No 1&quot;/2&quot; connector or coupling quantities are currently on the template runs. Add the fittings to the template first, then this tool can swap only their fitting family.</p>`}
            </section>
            <section class="van-fitting-preview-section">
                <h3>Automatic-item estimate</h3>
                <p>Counts are visible and intentionally editable in a later apply step: ${disconnects} disconnect${disconnects === 1 ? "" : "s"} and ${panels} panel${panels === 1 ? "" : "s"} detected on the canvas.</p>
                <div class="van-fitting-table-wrap"><table><thead><tr><th>Item</th><th>Rule qty</th><th>MML suggestion</th><th>Description</th></tr></thead><tbody>${autoRows}</tbody></table></div>
            </section>
        `;
    }

    function installStyles() {
        if (document.getElementById("vanFittingPrototypeStyles")) return;
        const style = document.createElement("style");
        style.id = "vanFittingPrototypeStyles";
        style.textContent = `
            .van-fitting-prototype{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(2,6,23,.78)}
            .van-fitting-prototype *{box-sizing:border-box}.van-fitting-dialog{width:min(1060px,100%);max-height:92vh;overflow:auto;padding:22px;border:1px solid #47658a;border-radius:14px;background:#101a2c;color:#edf6ff;box-shadow:0 26px 80px #000b}
            .van-fitting-header{display:flex;gap:16px;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.van-fitting-header h2{margin:0;font-size:22px}.van-fitting-header p{margin:6px 0 0;color:#a9bbd4;max-width:760px}.van-fitting-close{border:1px solid #64748b;border-radius:8px;background:#1e293b;color:white;padding:7px 11px;cursor:pointer}
            .van-fitting-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.van-fitting-group,.van-fitting-preview-section{border:1px solid #385170;border-radius:10px;background:#0c1525;padding:14px}.van-fitting-group h3,.van-fitting-preview-section h3{margin:0 0 10px;font-size:16px;color:#bfe4ff}.van-fitting-group table,.van-fitting-preview-section table{width:100%;border-collapse:collapse}.van-fitting-group th,.van-fitting-group td,.van-fitting-preview-section th,.van-fitting-preview-section td{padding:8px;border-bottom:1px solid #263b58;text-align:left;vertical-align:top}.van-fitting-group th,.van-fitting-preview-section th{color:#b9cce2;font-size:12px}.van-fitting-choice{display:inline-flex;align-items:center;gap:5px;margin:3px 10px 3px 0;padding:5px 7px;border:1px solid #395778;border-radius:6px;background:#13233a;font-size:12px;cursor:pointer}.van-fitting-choice:has(input:checked){border-color:#51b7ff;background:#11416a}.van-fitting-preview-section{margin-top:14px}.van-fitting-preview-section p{color:#a9bbd4;font-size:13px}.van-fitting-table-wrap{overflow:auto}.van-fitting-empty{padding:10px;border-left:3px solid #f0b429;background:#352b13;color:#fde7a4}.van-fitting-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.van-fitting-actions button{padding:9px 13px;border-radius:7px;border:1px solid #54769d;background:#1c3655;color:white;font-weight:700;cursor:pointer}.van-fitting-actions [data-build]{border-color:#1183ce;background:#056fae}@media(max-width:720px){.van-fitting-grid{grid-template-columns:1fr}.van-fitting-dialog{padding:14px}}
        `;
        document.head.appendChild(style);
    }

    function openVanFittingPrototype() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }

        installStyles();
        overlay = document.createElement("div");
        overlay.className = "van-fitting-prototype";
        overlay.innerHTML = `
            <section class="van-fitting-dialog" role="dialog" aria-modal="true" aria-labelledby="vanFittingPrototypeTitle">
                <header class="van-fitting-header">
                    <div><h2 id="vanFittingPrototypeTitle">VAN Fitting Guess — Prototype</h2><p>Choose the fitting families your installer used. This prototype only previews valid MML alternatives and automatic quantities; BOS, conduit, wire, and the template remain untouched.</p></div>
                    <button class="van-fitting-close" type="button" aria-label="Close">✕</button>
                </header>
                <div class="van-fitting-grid">${choiceRows()}</div>
                <div data-preview></div>
                <footer class="van-fitting-actions"><button type="button" data-close>Close</button><button type="button" data-build>Build fitting preview</button></footer>
            </section>
        `;

        const close = () => {
            overlay?.remove();
            overlay = null;
        };
        overlay.querySelector(".van-fitting-close").addEventListener("click", close);
        overlay.querySelector("[data-close]").addEventListener("click", close);
        overlay.querySelector("[data-build]").addEventListener("click", () => renderPreview(overlay));
        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });
        document.body.appendChild(overlay);
        renderPreview(overlay);
    }

    window.openVanFittingPrototype = openVanFittingPrototype;
})();
