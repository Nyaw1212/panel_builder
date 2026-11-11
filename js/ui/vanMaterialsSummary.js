// ----------------------------------
// VAN Materials Summary
// ----------------------------------
//
// A fast, project-wide fitting review for Material Runs.  It deliberately
// stores only quantity deltas: changing a total never has to guess which run
// should lose (or gain) a fitting.

(function () {
    "use strict";

    const BUTTON_ID = "vanMaterialsSummaryButton";
    const OVERLAY_ID = "vanMaterialsSummaryOverlay";
    let overlay = null;
    let pickerOverlay = null;
    let pickerSearch = "";

    // Snapshot of the 50 most frequently used VAN fittings in Copy of
    // Project 101 / PROJECT_BOM. The picker stays fast and practical by
    // offering only these familiar, high-use choices.
    const COMMON_VAN_FITTING_USAGE = {
        "652RT": 100, "LB35WC&G": 89, "CHB6": 85, "TA2": 75,
        "SL6": 74, "SL3": 69, "383DC": 67, "CHB3": 65,
        "1X3 | GALNIP1X3": 63, "655RT": 61, "323": 61,
        "662RT": 59, "922S": 57, "2ELL90": 57, "326": 56,
        "DS100H1": 52, "1525DC": 50, "2X3 | GALNIP2X3": 46,
        "615860": 45, "1906": 42, "386DC": 42, "LB2": 41,
        "1522DC": 40, "665RT": 38, "G5": 38, "DS200H1": 36,
        "EMT290": 34, "252SRT": 24, "TA1": 23, "8422": 22,
        "255RT2": 21, "252DC2": 19, "CPL2": 16, "LT100NM": 16,
        "265RT": 15, "LB65WC&G": 15, "8407": 12, "5234TB": 12,
        "1XC | GALNIP1XCL": 12, "1ELL90": 11, "615880": 11,
        "GALNIP2XCL": 10, "LB1": 10, "2X8 | GALNIP2X8": 9,
        "252RT2": 8, "CHB2": 8, "651RT": 7, "1X6 | GALNIP1X6": 7,
        "GALNIP1X4": 6, "7031EG": 5
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function catalogNumber(value) {
        return String(value?.CatalogNumber || value?.catalogNumber || "").trim();
    }

    function materialList() {
        const list = typeof window.getMaterials === "function"
            ? window.getMaterials()
            : (window.materials || window.mml || window.MML || []);
        return Array.isArray(list) ? list : [];
    }

    function isVan(material) {
        return String(
            material?.InventoryCategory || material?.inventoryCategory || material?.category || ""
        ).trim().toUpperCase() === "VAN";
    }

    function materialImage(material, size = 54) {
        const catalog = catalogNumber(material);
        const driveId = String(material?.DriveFileID || "").trim();
        const local = catalog
            ? `images/materials/${encodeURIComponent(catalog)}.png`
            : "";
        const source = driveId && typeof window.getDriveImageUrl === "function"
            ? window.getDriveImageUrl(driveId, size)
            : local;

        if (!source) {
            return `<span class="van-material-image is-empty">No image</span>`;
        }

        return `<span class="van-material-image">
            <img
                src="${escapeHtml(source)}"
                alt=""
                data-fallback="${escapeHtml(local)}"
                onerror="if(this.dataset.fallback && !this.dataset.fallbackUsed){this.dataset.fallbackUsed='1';this.src=this.dataset.fallback;}else{this.closest('.van-material-image').classList.add('is-empty');this.remove();}"
            >
        </span>`;
    }

    function sourceRows() {
        const rows = new Map();
        const containers = [
            ...(typeof window.getProjectRuns === "function" ? window.getProjectRuns() : []),
            ...(typeof window.getProjectGutters === "function" ? window.getProjectGutters() : [])
        ];

        containers.forEach((container, index) => {
            const label = String(container?.name || `Run ${index + 1}`).trim();
            (Array.isArray(container?.fittings) ? container.fittings : []).forEach(fitting => {
                const catalog = catalogNumber(fitting);
                const qty = Math.max(0, Number(fitting?.qty ?? fitting?.Qty ?? 0) || 0);
                if (!catalog || !qty) return;

                const current = rows.get(catalog) || {
                    catalog,
                    material: structuredClone(fitting),
                    sourceQty: 0,
                    usedOn: new Set()
                };
                current.sourceQty += qty;
                current.usedOn.add(label);
                rows.set(catalog, current);
            });
        });

        return rows;
    }

    function adjustmentRows() {
        const rows = new Map();
        const values = typeof window.getVanMaterialAdjustments === "function"
            ? window.getVanMaterialAdjustments()
            : [];

        (Array.isArray(values) ? values : []).forEach(entry => {
            const material = entry?.material ?? entry;
            const catalog = catalogNumber(material);
            const qty = Number(entry?.qty ?? entry?.Qty ?? entry?.adjustment ?? 0);
            if (!catalog || !Number.isFinite(qty) || !qty) return;

            const current = rows.get(catalog) || {
                material: structuredClone(material),
                qty: 0
            };
            current.qty += qty;
            rows.set(catalog, current);
        });

        return rows;
    }

    function summaryRows() {
        const source = sourceRows();
        const adjustments = adjustmentRows();
        const keys = new Set([...source.keys(), ...adjustments.keys()]);

        return [...keys].map(catalog => {
            const base = source.get(catalog);
            const adjustment = adjustments.get(catalog);
            const material = adjustment?.material || base?.material || {};
            const sourceQty = Number(base?.sourceQty || 0);
            const change = Number(adjustment?.qty || 0);

            return {
                catalog,
                material,
                sourceQty,
                adjustment: change,
                finalQty: Math.max(0, sourceQty + change),
                usedOn: [...(base?.usedOn || [])]
            };
        }).filter(row => row.finalQty > 0 || row.adjustment !== 0)
            .sort((a, b) => a.catalog.localeCompare(b.catalog));
    }

    function saveTargetQuantity(row, rawValue) {
        const target = Math.max(0, Number(rawValue) || 0);
        const entries = typeof window.getVanMaterialAdjustments === "function"
            ? structuredClone(window.getVanMaterialAdjustments())
            : [];
        const catalog = row.catalog;
        const nextDelta = target - row.sourceQty;
        const index = entries.findIndex(entry => catalogNumber(entry?.material ?? entry) === catalog);

        if (Math.abs(nextDelta) < 0.000001) {
            if (index >= 0) entries.splice(index, 1);
        }
        else if (index >= 0) {
            entries[index] = {
                material: structuredClone(row.material),
                qty: nextDelta
            };
        }
        else {
            entries.push({ material: structuredClone(row.material), qty: nextDelta });
        }

        if (typeof window.setVanMaterialAdjustments === "function") {
            window.setVanMaterialAdjustments(entries);
        }

        refreshBOM();
        render();
    }

    function refreshBOM() {
        if (typeof window.updateToolbarMaterialTotal === "function") {
            window.updateToolbarMaterialTotal();
        }
        document.dispatchEvent(new CustomEvent("van-materials-summary-changed"));
    }

    function commonPickerMaterials() {
        const query = pickerSearch.trim().toUpperCase();

        return materialList().filter(material => {
            const catalog = catalogNumber(material);
            if (!isVan(material) || !COMMON_VAN_FITTING_USAGE[catalog]) return false;
            if (String(material?.Type || "").trim().toUpperCase() !== "FITTING") return false;
            if (!query) return true;

            return [catalog, material?.Description, material?.Size, material?.Color]
                .join(" ")
                .toUpperCase()
                .includes(query);
        }).sort((a, b) =>
            COMMON_VAN_FITTING_USAGE[catalogNumber(b)] -
            COMMON_VAN_FITTING_USAGE[catalogNumber(a)] ||
            catalogNumber(a).localeCompare(catalogNumber(b))
        );
    }

    function ensureOverlay() {
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.className = "van-summary-overlay";
        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    function ensurePickerOverlay() {
        if (pickerOverlay) return pickerOverlay;

        pickerOverlay = document.createElement("div");
        pickerOverlay.className = "van-picker-overlay";
        pickerOverlay.addEventListener("click", event => {
            if (event.target === pickerOverlay) closePicker();
        });
        document.body.appendChild(pickerOverlay);
        return pickerOverlay;
    }

    function renderPicker() {
        const host = ensurePickerOverlay();
        const materials = commonPickerMaterials();

        host.innerHTML = `
            <section class="van-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="vanPickerTitle">
                <header class="van-picker-header">
                    <div>
                        <h2 id="vanPickerTitle">Add VAN Material</h2>
                        <p>Common fitting materials, ranked from Copy of Project 101 PROJECT_BOM usage.</p>
                    </div>
                    <button class="van-picker-close" type="button" title="Close">×</button>
                </header>
                <div class="van-picker-search-wrap">
                    <input id="vanPickerSearch" type="search" value="${escapeHtml(pickerSearch)}" placeholder="Filter common fittings…" autofocus>
                    <span>${materials.length} common material${materials.length === 1 ? "" : "s"}</span>
                </div>
                <div class="van-picker-grid">
                    ${materials.length ? materials.map(material => {
                        const catalog = catalogNumber(material);
                        return `
                            <button class="van-picker-card" type="button" data-catalog="${escapeHtml(catalog)}" title="Add 1 × ${escapeHtml(material.Description || catalog)}">
                                ${materialImage(material, 110)}
                                <strong>${escapeHtml(catalog)}</strong>
                                <span>${escapeHtml(material.Description || material.description || "")}</span>
                                <em>${COMMON_VAN_FITTING_USAGE[catalog]} prior BOM uses · Add 1</em>
                            </button>
                        `;
                    }).join("") : `
                        <div class="van-picker-empty">No common VAN fittings match this filter.</div>
                    `}
                </div>
            </section>
        `;

        host.querySelector(".van-picker-close")?.addEventListener("click", closePicker);
        host.querySelector("#vanPickerSearch")?.addEventListener("input", event => {
            pickerSearch = event.target.value;
            const caret = event.target.selectionStart ?? pickerSearch.length;
            renderPicker();
            const search = host.querySelector("#vanPickerSearch");
            search?.focus();
            search?.setSelectionRange(caret, caret);
        });
        host.querySelectorAll(".van-picker-card").forEach(button => {
            button.addEventListener("click", () => {
                const material = materialList().find(item =>
                    catalogNumber(item) === button.dataset.catalog
                );
                if (!material) return;

                const existing = summaryRows().find(row =>
                    row.catalog === button.dataset.catalog
                );
                saveTargetQuantity(existing || {
                    catalog: button.dataset.catalog,
                    material,
                    sourceQty: 0
                }, (existing?.finalQty || 0) + 1);
                closePicker();
            });
        });
    }

    function openPicker() {
        pickerSearch = "";
        renderPicker();
        ensurePickerOverlay().style.display = "flex";
    }

    function closePicker() {
        if (pickerOverlay) pickerOverlay.style.display = "none";
    }

    function render() {
        const host = ensureOverlay();
        const rows = summaryRows();

        host.innerHTML = `
            <section class="van-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="vanSummaryTitle">
                <header class="van-summary-header">
                    <div>
                        <h2 id="vanSummaryTitle">VAN Materials Summary</h2>
                        <p>Review fittings once for the whole project. Quantity edits update the VAN BOM without changing any run.</p>
                    </div>
                    <button class="van-summary-close" type="button" title="Close">×</button>
                </header>
                <div class="van-summary-toolbar">
                    <button id="openVanMaterialPicker" class="van-summary-add-button" type="button">+ Add VAN material</button>
                    <span class="van-summary-add-note">Common fittings only · ranked from previous PROJECT_BOM use</span>
                    <button id="vanSummaryReset" class="van-summary-reset" type="button">Reset all summary changes</button>
                </div>
                <div class="van-summary-table-wrap">
                    <table class="van-summary-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Material</th>
                                <th>From template</th>
                                <th>Adjustment</th>
                                <th>Final VAN Qty</th>
                                <th>Used on</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length ? rows.map(row => `
                                <tr data-catalog="${escapeHtml(row.catalog)}">
                                    <td>${materialImage(row.material)}</td>
                                    <td><strong>${escapeHtml(row.catalog)}</strong><small>${escapeHtml(row.material.Description || row.material.description || "")}</small></td>
                                    <td>${row.sourceQty}</td>
                                    <td class="${row.adjustment > 0 ? "positive" : row.adjustment < 0 ? "negative" : ""}">${row.adjustment > 0 ? "+" : ""}${row.adjustment || "—"}</td>
                                    <td>
                                        <button type="button" class="van-qty-step" data-change="-1" aria-label="Remove one">−</button>
                                        <input class="van-final-qty" type="number" min="0" step="1" value="${row.finalQty}" aria-label="Final VAN quantity for ${escapeHtml(row.catalog)}">
                                        <button type="button" class="van-qty-step" data-change="1" aria-label="Add one">+</button>
                                    </td>
                                    <td>${row.usedOn.length ? escapeHtml(row.usedOn.join(", ")) : "Manual summary item"}</td>
                                    <td><button type="button" class="van-remove-all" title="Set final quantity to zero">×</button></td>
                                </tr>
                            `).join("") : `
                                <tr><td colspan="7" class="van-summary-empty">No run or gutter fittings yet. Search above to add a VAN material.</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <footer class="van-summary-footer">
                    <span>${rows.length} material${rows.length === 1 ? "" : "s"} in final VAN fitting BOM</span>
                    <button class="van-summary-done" type="button">Done</button>
                </footer>
            </section>
        `;

        host.querySelector(".van-summary-close")?.addEventListener("click", close);
        host.querySelector(".van-summary-done")?.addEventListener("click", close);
        host.querySelector("#openVanMaterialPicker")?.addEventListener("click", openPicker);
        host.querySelector("#vanSummaryReset")?.addEventListener("click", () => {
            if (typeof window.setVanMaterialAdjustments === "function") {
                window.setVanMaterialAdjustments([]);
            }
            refreshBOM();
            render();
        });
        host.querySelectorAll("tbody tr[data-catalog]").forEach(element => {
            const row = rows.find(item => item.catalog === element.dataset.catalog);
            if (!row) return;
            const input = element.querySelector(".van-final-qty");

            input?.addEventListener("change", () => saveTargetQuantity(row, input.value));
            input?.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    saveTargetQuantity(row, input.value);
                }
            });
            element.querySelectorAll(".van-qty-step").forEach(button => {
                button.addEventListener("click", () => {
                    saveTargetQuantity(row, row.finalQty + Number(button.dataset.change || 0));
                });
            });
            element.querySelector(".van-remove-all")?.addEventListener("click", () => {
                saveTargetQuantity(row, 0);
            });
        });
    }

    function open() {
        render();
        ensureOverlay().style.display = "flex";
    }

    function close() {
        if (overlay) overlay.style.display = "none";
    }

    function installButton() {
        document.querySelectorAll("#runsModal .runs-footer").forEach(footer => {
            if (footer.querySelector(`#${BUTTON_ID}`)) return;
            const button = document.createElement("button");
            button.id = BUTTON_ID;
            button.className = "runs-add van-summary-open-button";
            button.type = "button";
            button.textContent = "VAN Materials Summary";
            button.title = "Review and edit final VAN fitting quantities";
            button.addEventListener("click", open);
            const rule = footer.querySelector(".runs-rule");
            footer.insertBefore(button, rule || footer.lastElementChild);
        });
    }

    function injectStyles() {
        if (document.getElementById("vanMaterialsSummaryStyles")) return;
        const style = document.createElement("style");
        style.id = "vanMaterialsSummaryStyles";
        style.textContent = `
            .van-summary-open-button { background:#176c77 !important; border-color:#3bc5d0 !important; color:#fff !important; }
            .van-summary-overlay { position:fixed; inset:0; z-index:10070; display:none; align-items:center; justify-content:center; padding:22px; background:rgba(2,8,18,.76); }
            .van-summary-dialog { width:min(1420px,96vw); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; background:#0b172d; border:1px solid #3a70ab; border-radius:9px; color:#e7f1ff; box-shadow:0 20px 70px rgba(0,0,0,.6); }
            .van-summary-header { display:flex; justify-content:space-between; gap:18px; padding:18px 22px 14px; border-bottom:1px solid #29496f; }
            .van-summary-header h2 { margin:0; font-size:23px; } .van-summary-header p { margin:5px 0 0; color:#9eb6d2; font-size:13px; }
            .van-summary-close { width:34px; height:34px; border:0; border-radius:7px; background:#e52549; color:#fff; font-size:25px; cursor:pointer; }
            .van-summary-toolbar { display:flex; gap:14px; align-items:end; padding:14px 22px; background:#0d1d38; }
            .van-summary-add-button { border:1px solid #3bc5d0; border-radius:5px; padding:10px 15px; background:#176c77; color:#fff; font-weight:700; cursor:pointer; }
            .van-summary-add-note { flex:1; color:#9bb4d0; font-size:12px; }
            .van-summary-toolbar label { display:grid; gap:5px; flex:1; color:#9fb7d5; font-size:12px; font-weight:700; }
            .van-summary-toolbar input { width:100%; box-sizing:border-box; border:1px solid #456d9b; border-radius:5px; padding:9px 10px; background:#071120; color:#fff; }
            .van-summary-reset { border:1px solid #9a5c68; border-radius:5px; padding:9px 12px; background:#331923; color:#ffdce2; cursor:pointer; }
            .van-summary-results { display:flex; flex-wrap:wrap; gap:7px; max-height:130px; overflow:auto; padding:10px 22px; border-bottom:1px solid #29496f; }
            .van-summary-add-result { display:grid; grid-template-columns:46px auto 1fr auto; gap:9px; align-items:center; border:1px solid #3e668f; border-radius:5px; padding:7px 9px; background:#10213d; color:#eaf3ff; cursor:pointer; text-align:left; }
            .van-summary-add-result span { color:#b8c9dc; font-size:11px; } .van-summary-add-result em { color:#58dc93; font-style:normal; font-size:11px; font-weight:700; }
            .van-summary-search-hint { padding:9px 22px; color:#91a8c4; font-size:12px; border-bottom:1px solid #29496f; }
            .van-summary-table-wrap { overflow:auto; padding:0 22px; } .van-summary-table { width:100%; border-collapse:collapse; min-width:980px; }
            .van-summary-table th { position:sticky; top:0; background:#17345a; color:#cfe2ff; text-align:left; font-size:12px; letter-spacing:.04em; padding:11px 9px; }
            .van-summary-table td { border-bottom:1px solid #1d385c; padding:10px 9px; vertical-align:middle; font-size:13px; }
            .van-summary-table td strong, .van-summary-table td small { display:block; } .van-summary-table td small { color:#a9bed7; margin-top:3px; max-width:350px; }
            .van-material-image { display:flex; align-items:center; justify-content:center; width:54px; height:54px; overflow:hidden; border:1px solid #355a84; border-radius:5px; background:#fff; }
            .van-material-image img { width:100%; height:100%; object-fit:contain; } .van-material-image.is-empty { background:#10203a; color:#829bb9; font-size:9px; text-align:center; }
            .van-summary-table .positive { color:#66e3a0; font-weight:700; } .van-summary-table .negative { color:#ff999d; font-weight:700; }
            .van-summary-table input { width:56px; padding:6px; text-align:center; border:1px solid #4777aa; border-radius:4px; background:#071120; color:#fff; }
            .van-qty-step, .van-remove-all { border:1px solid #426891; border-radius:4px; min-width:28px; height:28px; background:#162b48; color:#fff; cursor:pointer; font-weight:700; }
            .van-remove-all { color:#ffb2bd; border-color:#80515e; } .van-summary-empty { color:#a9bed7; padding:28px !important; text-align:center; }
            .van-summary-footer { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:13px 22px; border-top:1px solid #29496f; color:#a9bed7; }
            .van-summary-done { min-width:100px; border:1px solid #65a5dd; border-radius:5px; padding:8px 18px; background:#286ca6; color:#fff; cursor:pointer; font-weight:700; }
            .van-picker-overlay { position:fixed; inset:0; z-index:10080; display:none; align-items:center; justify-content:center; padding:22px; background:rgba(1,7,15,.8); }
            .van-picker-dialog { width:min(1320px,96vw); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; background:#0b172d; border:1px solid #3a70ab; border-radius:9px; color:#e7f1ff; box-shadow:0 20px 70px rgba(0,0,0,.7); }
            .van-picker-header { display:flex; justify-content:space-between; gap:18px; padding:18px 22px 14px; border-bottom:1px solid #29496f; }
            .van-picker-header h2 { margin:0; font-size:22px; } .van-picker-header p { margin:5px 0 0; color:#9eb6d2; font-size:13px; }
            .van-picker-close { width:34px; height:34px; border:0; border-radius:7px; background:#e52549; color:#fff; font-size:25px; cursor:pointer; }
            .van-picker-search-wrap { display:flex; align-items:center; gap:14px; padding:14px 22px; background:#0d1d38; }
            .van-picker-search-wrap input { flex:1; border:1px solid #456d9b; border-radius:5px; padding:10px; background:#071120; color:#fff; }
            .van-picker-search-wrap span { color:#a7bed9; font-size:12px; white-space:nowrap; }
            .van-picker-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:11px; overflow:auto; padding:18px 22px 24px; }
            .van-picker-card { display:grid; grid-template-rows:110px auto minmax(30px,auto) auto; gap:6px; min-width:0; padding:10px; border:1px solid #365f8e; border-radius:7px; background:#10213d; color:#ecf5ff; text-align:left; cursor:pointer; }
            .van-picker-card:hover { border-color:#55d4dd; background:#153054; } .van-picker-card .van-material-image { width:100%; height:110px; }
            .van-picker-card strong { font-size:13px; } .van-picker-card span { color:#b5c7dd; font-size:11px; line-height:1.25; }
            .van-picker-card em { color:#64e2a1; font-size:10px; font-style:normal; font-weight:700; } .van-picker-empty { grid-column:1 / -1; padding:36px; color:#a6bbd4; text-align:center; }
        `;
        document.head.appendChild(style);
    }

    injectStyles();
    installButton();
    new MutationObserver(installButton).observe(document.body, { childList: true, subtree: true });
    window.openVanMaterialsSummary = open;
})();
