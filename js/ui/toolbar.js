//----------------------------------
// Theme Manager
//----------------------------------

const PANEL_BUILDER_THEME_KEY = "panelBuilderTheme";
const PANEL_BUILDER_THEMES = ["standard", "smoke"];

function installThemeStyles() {
    if (document.getElementById("panelBuilderThemeStyles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "panelBuilderThemeStyles";
    style.textContent = `
        .theme-picker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
            padding: 5px 8px;
            border: 1px solid rgba(148, 163, 184, .32);
            border-radius: 10px;
            background: rgba(15, 23, 42, .34);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08);
        }

        .theme-picker-label {
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
        }

        #themeModeSelect {
            min-width: 112px;
            padding: 7px 30px 7px 10px;
            border: 1px solid rgba(148, 163, 184, .38);
            border-radius: 8px;
            color: inherit;
            background: rgba(15, 23, 42, .48);
            cursor: pointer;
            outline: none;
        }

        #themeModeSelect option {
            color: #111827;
            background: #ffffff;
        }

        body.theme-smoke {
            color: #f8fafc;
            background:
                radial-gradient(circle at 22% 12%, rgba(54, 69, 82, .34), transparent 34%),
                radial-gradient(circle at 82% 18%, rgba(120, 92, 62, .18), transparent 30%),
                linear-gradient(145deg, #090b0d 0%, #121619 45%, #080a0c 100%);
            background-attachment: fixed;
        }

        body.theme-smoke::before {
            content: "";
            position: fixed;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background:
                linear-gradient(115deg, rgba(255,255,255,.035), transparent 28%, rgba(255,255,255,.018) 58%, transparent 78%),
                repeating-linear-gradient(90deg, rgba(255,255,255,.008) 0 1px, transparent 1px 5px);
        }

        body.theme-smoke .workspace-toolbar,
        body.theme-smoke .sidebar,
        body.theme-smoke .workspace,
        body.theme-smoke .bom-panel,
        body.theme-smoke .link-inspector,
        body.theme-smoke .modal-content,
        body.theme-smoke .connection-assembly,
        body.theme-smoke .material-debug-panel-v2,
        body.theme-smoke .library-section,
        body.theme-smoke .equipment,
        body.theme-smoke .preset-card,
        body.theme-smoke .equipment-card,
        body.theme-smoke .link-inspector-panel {
            background: linear-gradient(
                145deg,
                rgba(36, 40, 43, .74),
                rgba(15, 18, 20, .62)
            ) !important;
            border-color: rgba(226, 232, 240, .18) !important;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, .09),
                inset 0 -1px 0 rgba(0, 0, 0, .4),
                0 14px 34px rgba(0, 0, 0, .28) !important;
            backdrop-filter: blur(18px) saturate(118%);
            -webkit-backdrop-filter: blur(18px) saturate(118%);
        }

        body.theme-smoke #canvasContainer,
        body.theme-smoke #grid {
            background-color: rgba(8, 11, 13, .68) !important;
        }

        body.theme-smoke #canvasContainer {
            border-color: rgba(226, 232, 240, .15) !important;
            box-shadow:
                inset 0 0 70px rgba(0, 0, 0, .36),
                0 16px 34px rgba(0, 0, 0, .24);
        }

        body.theme-smoke .workspace-toolbar button,
        body.theme-smoke .library-button,
        body.theme-smoke .tab,
        body.theme-smoke .chip,
        body.theme-smoke button:not(.delete-button) {
            color: #f8fafc;
            background: linear-gradient(
                145deg,
                rgba(72, 76, 79, .54),
                rgba(25, 28, 30, .58)
            );
            border-color: rgba(226, 232, 240, .2);
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, .1),
                0 7px 16px rgba(0, 0, 0, .2);
        }

        body.theme-smoke .workspace-toolbar button:hover,
        body.theme-smoke .library-button:hover,
        body.theme-smoke .tab:hover,
        body.theme-smoke .chip:hover {
            background: linear-gradient(
                145deg,
                rgba(92, 98, 102, .64),
                rgba(34, 38, 41, .68)
            );
            border-color: rgba(96, 165, 250, .58);
        }

        body.theme-smoke input,
        body.theme-smoke select,
        body.theme-smoke textarea {
            color: #f8fafc;
            background: rgba(8, 11, 13, .58) !important;
            border-color: rgba(226, 232, 240, .2) !important;
            box-shadow: inset 0 1px 7px rgba(0, 0, 0, .3);
        }

        body.theme-smoke input::placeholder,
        body.theme-smoke textarea::placeholder {
            color: rgba(226, 232, 240, .55);
        }

        body.theme-smoke h1,
        body.theme-smoke h2,
        body.theme-smoke h3,
        body.theme-smoke .library-title,
        body.theme-smoke .bom-title,
        body.theme-smoke .equipment-code {
            color: #f8fafc !important;
        }

        body.theme-smoke .equipment-desc,
        body.theme-smoke .material-description,
        body.theme-smoke .muted,
        body.theme-smoke label {
            color: rgba(226, 232, 240, .76) !important;
        }

        body.theme-smoke .equipment.selected,
        body.theme-smoke .tab.active,
        body.theme-smoke .chip.active,
        body.theme-smoke .manual-route-button--active {
            border-color: rgba(59, 130, 246, .9) !important;
            background: linear-gradient(
                145deg,
                rgba(30, 91, 166, .62),
                rgba(17, 45, 82, .68)
            ) !important;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, .14),
                0 0 20px rgba(37, 99, 235, .22) !important;
        }

        body.theme-smoke .equipment-image {
            background: radial-gradient(
                circle at 50% 30%,
                rgba(73, 79, 83, .92),
                rgba(14, 17, 19, .95) 72%
            ) !important;
            border-color: rgba(226, 232, 240, .2) !important;
        }

        @media (max-width: 900px) {
            .theme-picker {
                width: 100%;
                margin-left: 0;
                justify-content: space-between;
            }
        }
    `;

    document.head.appendChild(style);
}

function normalizeTheme(theme) {
    return PANEL_BUILDER_THEMES.includes(theme)
        ? theme
        : "standard";
}

function applyPanelBuilderTheme(theme, options = {}) {
    const normalizedTheme = normalizeTheme(theme);

    document.body.classList.toggle(
        "theme-smoke",
        normalizedTheme === "smoke"
    );

    document.body.dataset.theme = normalizedTheme;

    const select = document.getElementById("themeModeSelect");
    if (select && select.value !== normalizedTheme) {
        select.value = normalizedTheme;
    }

    if (options.persist !== false) {
        localStorage.setItem(
            PANEL_BUILDER_THEME_KEY,
            normalizedTheme
        );
    }

    window.dispatchEvent(new CustomEvent(
        "panelbuilderthemechange",
        { detail: { theme: normalizedTheme } }
    ));

    return normalizedTheme;
}

function createThemePicker(toolbar) {
    if (!toolbar || document.getElementById("themeModeSelect")) {
        return;
    }

    const wrapper = document.createElement("label");
    wrapper.className = "theme-picker";
    wrapper.htmlFor = "themeModeSelect";

    const label = document.createElement("span");
    label.className = "theme-picker-label";
    label.textContent = "🌓 Theme";

    const select = document.createElement("select");
    select.id = "themeModeSelect";
    select.setAttribute("aria-label", "Application theme");

    select.append(
        new Option("STD Mode", "standard"),
        new Option("Smoke Mode", "smoke")
    );

    const savedTheme = normalizeTheme(
        localStorage.getItem(PANEL_BUILDER_THEME_KEY)
    );

    select.value = savedTheme;
    select.addEventListener("change", () => {
        applyPanelBuilderTheme(select.value);
    });

    wrapper.append(label, select);
    toolbar.appendChild(wrapper);

    applyPanelBuilderTheme(savedTheme, { persist: false });
}

//----------------------------------
// Toolbar
//----------------------------------

function initializeToolbar() {
    installThemeStyles();

    const toolbar =
        document.querySelector(".workspace-toolbar");

    //----------------------------------
    // Buttons
    //----------------------------------

    const newButton =
        document.getElementById("newProjectButton");

    const saveButton =
        document.getElementById("saveButton");

    const openButton =
        document.getElementById("openProjectButton");

    const bomButton =
        document.getElementById("bomButton");

    const manualRouteButton =
        document.getElementById("manualRouteButton");

    createThemePicker(toolbar);

    //----------------------------------
    // New
    //----------------------------------

    if (newButton) {
        newButton.addEventListener("click", () => {
            console.log("New Project...");
            newProject();
        });
    }
    else {
        console.warn("New button not found.");
    }

    //----------------------------------
    // Save
    //----------------------------------

    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const project = getProjectState();

            if (!project.jobName) {
                console.log("Opening Save Dialog...");
                showProjectDialog();
                return;
            }

            console.log("Saving Project...");

            const result = await saveCurrentProject();
            console.log(result);

            if (result.success) {
                alert("Project Saved!");
            }
            else {
                alert("Save Failed.");
            }
        });
    }
    else {
        console.warn("Save button not found.");
    }

    //----------------------------------
    // Open
    //----------------------------------

    if (openButton) {
        openButton.addEventListener("click", () => {
            console.log("Opening Project Dialog...");
            showOpenProjectDialog();
        });
    }
    else {
        console.warn("Open button not found.");
    }

    //----------------------------------
    // BOM
    //----------------------------------

    if (bomButton) {
        bomButton.addEventListener("click", () => {
            console.log("Printing BOM...");
            printBOM();
        });
    }
    else {
        console.warn("BOM button not found.");
    }

    //----------------------------------
    // Manual Routing
    //----------------------------------

    if (manualRouteButton) {
        manualRouteButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            if (
                !window.ManualRouting ||
                typeof window.ManualRouting.toggle !== "function"
            ) {
                console.warn("Manual routing is not ready.");
                return;
            }

            window.ManualRouting.toggle();
        });
    }
    else {
        console.warn("Manual route button not found.");
    }
}

//----------------------------------
// Expose
//----------------------------------

window.applyPanelBuilderTheme = applyPanelBuilderTheme;
window.initializeToolbar = initializeToolbar;
