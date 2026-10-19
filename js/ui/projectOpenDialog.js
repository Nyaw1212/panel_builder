//----------------------------------
// Open Project Dialog
//----------------------------------

let openProjectDialog = null;
let projectList = [];
let selectedOpenProjectId = "";

function applyOpenProjectStyles(element, styles) {

    Object.assign(element.style, styles);
    return element;

}

function matchesOpenProjectSearch(project, search) {

    const needle = String(search || "").trim().toLowerCase();

    if (!needle) return true;

    return [
        project?.jobName,
        project?.address,
        project?.model,
        project?.lender,
        project?.electrician,
        project?.projectId
    ]
        .join(" ")
        .toLowerCase()
        .includes(needle);

}

function createOpenProjectDialog() {

    if (openProjectDialog) return openProjectDialog;

    openProjectDialog = document.createElement("div");
    openProjectDialog.id = "openProjectDialog";
    applyOpenProjectStyles(openProjectDialog, {
        position: "fixed",
        inset: "0",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
        background: "rgba(2, 8, 20, .72)",
        zIndex: "9999"
    });

    const card = applyOpenProjectStyles(document.createElement("section"), {
        width: "min(680px, 100%)",
        maxHeight: "min(720px, 92vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #334155",
        borderRadius: "12px",
        background: "#111827",
        color: "#f8fafc",
        boxShadow: "0 24px 70px rgba(0,0,0,.55)"
    });
    const header = applyOpenProjectStyles(document.createElement("header"), {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        padding: "18px 20px",
        borderBottom: "1px solid #334155"
    });
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    const subtitle = document.createElement("p");

    title.textContent = "Open Project";
    subtitle.textContent =
        "Search by job name, address, model, lender, or electrician.";
    applyOpenProjectStyles(title, { margin: "0", fontSize: "21px" });
    applyOpenProjectStyles(subtitle, {
        margin: "5px 0 0",
        color: "#cbd5e1",
        fontSize: "13px"
    });
    heading.append(title, subtitle);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close open project");
    applyOpenProjectStyles(closeButton, {
        width: "36px",
        height: "36px",
        border: "0",
        borderRadius: "8px",
        background: "#7f1d1d",
        color: "#fff",
        fontSize: "25px",
        lineHeight: "1",
        cursor: "pointer"
    });
    closeButton.addEventListener("click", hideOpenProjectDialog);
    header.append(heading, closeButton);

    const searchWrap = applyOpenProjectStyles(document.createElement("div"), {
        padding: "18px 20px 10px"
    });
    const label = document.createElement("label");
    const input = document.createElement("input");

    label.htmlFor = "projectSearchInput";
    label.textContent = "Find a saved project";
    applyOpenProjectStyles(label, {
        display: "block",
        marginBottom: "7px",
        color: "#cbd5e1",
        fontSize: "13px",
        fontWeight: "700"
    });
    input.id = "projectSearchInput";
    input.type = "search";
    input.autocomplete = "off";
    input.placeholder = "Type a job name or address…";
    applyOpenProjectStyles(input, {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #475569",
        borderRadius: "8px",
        padding: "12px 13px",
        background: "#0f172a",
        color: "#f8fafc",
        font: "inherit",
        outline: "none"
    });
    input.addEventListener("input", renderOpenProjectResults);
    searchWrap.append(label, input);

    const status = document.createElement("div");
    status.dataset.role = "status";
    applyOpenProjectStyles(status, {
        minHeight: "20px",
        padding: "0 20px 10px",
        color: "#94a3b8",
        fontSize: "12px"
    });

    const results = document.createElement("div");
    results.dataset.role = "results";
    applyOpenProjectStyles(results, {
        minHeight: "100px",
        maxHeight: "390px",
        overflow: "auto",
        padding: "0 20px 18px"
    });

    const footer = applyOpenProjectStyles(document.createElement("footer"), {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "14px 20px",
        borderTop: "1px solid #334155"
    });
    const cancelButton = document.createElement("button");
    const openButton = document.createElement("button");

    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    applyOpenProjectStyles(cancelButton, {
        border: "1px solid #475569",
        borderRadius: "7px",
        padding: "9px 14px",
        background: "#1e293b",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer"
    });
    cancelButton.addEventListener("click", hideOpenProjectDialog);

    openButton.type = "button";
    openButton.dataset.action = "open";
    openButton.textContent = "Open selected";
    openButton.disabled = true;
    applyOpenProjectStyles(openButton, {
        border: "1px solid #2563eb",
        borderRadius: "7px",
        padding: "9px 14px",
        background: "#2563eb",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
        opacity: ".5"
    });
    openButton.addEventListener("click", openSelectedProject);
    footer.append(cancelButton, openButton);

    card.append(header, searchWrap, status, results, footer);
    openProjectDialog.appendChild(card);
    openProjectDialog.addEventListener("click", event => {
        if (event.target === openProjectDialog) hideOpenProjectDialog();
    });
    document.body.appendChild(openProjectDialog);

    return openProjectDialog;

}

function renderOpenProjectResults() {

    if (!openProjectDialog) return;

    const input = openProjectDialog.querySelector("#projectSearchInput");
    const results = openProjectDialog.querySelector("[data-role='results']");
    const status = openProjectDialog.querySelector("[data-role='status']");
    const openButton = openProjectDialog.querySelector("[data-action='open']");

    if (!input || !results || !status || !openButton) return;

    const matches = projectList.filter(project =>
        matchesOpenProjectSearch(project, input.value)
    );

    status.textContent = projectList.length
        ? String(matches.length) + " of " + String(projectList.length) +
            " saved project" + (projectList.length === 1 ? "" : "s")
        : "No saved projects found.";
    openButton.disabled = !selectedOpenProjectId;
    openButton.style.opacity = selectedOpenProjectId ? "1" : ".5";
    results.replaceChildren();

    if (!matches.length) {
        const empty = document.createElement("div");
        empty.textContent = projectList.length
            ? "No projects match this search."
            : "No saved projects found.";
        applyOpenProjectStyles(empty, {
            padding: "24px 12px",
            border: "1px dashed #475569",
            borderRadius: "8px",
            color: "#94a3b8",
            textAlign: "center"
        });
        results.appendChild(empty);
        return;
    }

    matches.forEach(project => {
        const selected = String(project.projectId || "") === selectedOpenProjectId;
        const button = document.createElement("button");
        const jobName = document.createElement("strong");
        const details = document.createElement("small");
        const detailText = [
            project.address,
            project.model,
            project.lender
        ]
            .filter(Boolean)
            .join(" · ");

        button.type = "button";
        button.dataset.projectId = String(project.projectId || "");
        applyOpenProjectStyles(button, {
            width: "100%",
            margin: "0 0 8px",
            padding: "12px 13px",
            border: selected ? "1px solid #38bdf8" : "1px solid #334155",
            borderRadius: "8px",
            background: selected ? "#0c4a6e" : "#0f172a",
            color: "#f8fafc",
            textAlign: "left",
            cursor: "pointer"
        });
        jobName.textContent = String(project.jobName || "Untitled Project");
        applyOpenProjectStyles(jobName, {
            display: "block",
            fontSize: "14px"
        });
        details.textContent = detailText || "No address or template details";
        applyOpenProjectStyles(details, {
            display: "block",
            marginTop: "4px",
            color: "#cbd5e1",
            fontSize: "12px"
        });
        button.append(jobName, details);
        button.addEventListener("click", () => {
            selectedOpenProjectId = String(button.dataset.projectId || "");
            renderOpenProjectResults();
        });
        button.addEventListener("dblclick", openSelectedProject);
        results.appendChild(button);
    });

}

async function openSelectedProject() {

    const project = projectList.find(item =>
        String(item?.projectId || "") === selectedOpenProjectId
    );

    if (!project) {
        alert("Unable to load this saved project.");
        return;
    }

    let savedProject = project.project;

    // A list row can occasionally arrive before its JSON has been parsed.
    // Load the selected row directly instead of making the search result
    // unusable in that case.
    if (!savedProject && typeof loadProject === "function") {
        const loaded = await loadProject(project.jobName, project.address);
        savedProject = loaded?.found ? loaded.project : null;
    }

    if (!savedProject) {
        alert("This project could not be loaded from the project sheet.");
        return;
    }

    clearDraft();
    await deserializeProject(savedProject);
    hideOpenProjectDialog();

}

async function showOpenProjectDialog() {

    const dialog = createOpenProjectDialog();
    const input = dialog.querySelector("#projectSearchInput");
    const status = dialog.querySelector("[data-role='status']");

    selectedOpenProjectId = "";
    if (input) input.value = "";
    if (status) status.textContent = "Loading saved projects…";
    dialog.style.display = "flex";

    // Always refresh here. The old dialog could keep an empty startup cache
    // indefinitely, even after projects were saved in the sheet.
    projectList = typeof refreshProjectCache === "function"
        ? await refreshProjectCache()
        : await getCachedProjects();

    projectList = Array.isArray(projectList) ? projectList : [];
    renderOpenProjectResults();
    input?.focus();

}

function hideOpenProjectDialog() {

    if (openProjectDialog) openProjectDialog.style.display = "none";

}

window.showOpenProjectDialog = showOpenProjectDialog;
window.hideOpenProjectDialog = hideOpenProjectDialog;
