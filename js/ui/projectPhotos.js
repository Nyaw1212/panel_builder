//----------------------------------
// Project Photos
//----------------------------------

let projectPhotosOverlay = null;
let projectPhotoZoomLevels = [100, 100, 100, 100];

function getProjectPhotoLinks() {

    const project = typeof getProjectState === "function"
        ? getProjectState()
        : null;

    if (!project) return ["", "", "", ""];

    if (!Array.isArray(project.photoLinks)) {
        project.photoLinks = [];
    }

    return Array.from({ length: 4 }, (_, index) =>
        String(project.photoLinks[index] || "").trim()
    );

}

function extractGoogleDriveFileId(value) {

    const source = String(value || "").trim();
    if (!source) return "";

    // Allow the file ID itself, as well as common Drive share, open, and
    // thumbnail links copied from a browser.
    if (/^[a-zA-Z0-9_-]{15,}$/.test(source)) {
        return source;
    }

    const fileMatch = source.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (fileMatch) return fileMatch[1];

    try {
        const url = new URL(source);
        const id = url.searchParams.get("id");
        return /^[a-zA-Z0-9_-]{15,}$/.test(String(id || ""))
            ? id
            : "";
    }
    catch {
        return "";
    }

}

function getProjectPhotoPreviewUrl(link) {

    const fileId = extractGoogleDriveFileId(link);

    if (!fileId) return "";

    return typeof getDriveImageUrl === "function"
        ? getDriveImageUrl(fileId, 1600)
        : `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;

}

function getProjectPhotoFallbackUrl(link) {

    const fileId = extractGoogleDriveFileId(link);

    if (!fileId) return "";

    return typeof getDriveImageFallbackUrl === "function"
        ? getDriveImageFallbackUrl(fileId)
        : `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;

}

function saveProjectPhotoLinks() {

    if (typeof saveDraft === "function") {
        saveDraft();
    }

}

function updateProjectPhotoLink(index, value, options = {}) {

    const project = typeof getProjectState === "function"
        ? getProjectState()
        : null;

    if (!project || index < 0 || index > 3) return;

    const links = getProjectPhotoLinks();
    const nextValue = String(value || "").trim();

    if (links[index] === nextValue) return;

    links[index] = nextValue;
    project.photoLinks = links;

    if (options.capture !== false &&
        window.HistoryManagerV2 &&
        typeof window.HistoryManagerV2.capture === "function") {
        window.HistoryManagerV2.capture("Project photo updated");
    }

    saveProjectPhotoLinks();

}

function ensureProjectPhotosModal() {

    if (projectPhotosOverlay) return projectPhotosOverlay;

    projectPhotosOverlay = document.createElement("div");
    projectPhotosOverlay.className = "project-photos-overlay";
    projectPhotosOverlay.addEventListener("click", event => {
        if (event.target === projectPhotosOverlay) {
            closeProjectPhotos();
        }
    });
    document.body.appendChild(projectPhotosOverlay);

    return projectPhotosOverlay;

}

function setProjectPhotoZoom(index, nextZoom) {

    projectPhotoZoomLevels[index] = Math.max(
        25,
        Math.min(300, Math.round(Number(nextZoom) || 100))
    );

    renderProjectPhotos();

}

function createProjectPhotoPanel(index, link) {

    const panel = document.createElement("section");
    panel.className = "project-photo-panel";
    const header = document.createElement("header");
    header.className = "project-photo-panel-header";
    const title = document.createElement("strong");
    title.textContent = `Photo ${index + 1}`;
    const controls = document.createElement("div");
    controls.className = "project-photo-zoom-controls";

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.title = "Zoom out";
    decrease.addEventListener("click", () =>
        setProjectPhotoZoom(index, projectPhotoZoomLevels[index] - 25)
    );

    const zoom = document.createElement("span");
    zoom.textContent = `${projectPhotoZoomLevels[index]}%`;
    zoom.title = "Reset zoom";
    zoom.addEventListener("click", () => setProjectPhotoZoom(index, 100));

    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.title = "Zoom in";
    increase.addEventListener("click", () =>
        setProjectPhotoZoom(index, projectPhotoZoomLevels[index] + 25)
    );

    controls.append(decrease, zoom, increase);
    header.append(title, controls);

    const linkRow = document.createElement("div");
    linkRow.className = "project-photo-link-row";
    const input = document.createElement("input");
    input.type = "url";
    input.value = link;
    input.placeholder = "Paste Google Drive image link";
    input.setAttribute("aria-label", `Photo ${index + 1} Google Drive link`);
    input.addEventListener("input", () =>
        updateProjectPhotoLink(index, input.value, { capture: false })
    );
    input.addEventListener("change", () => {
        updateProjectPhotoLink(index, input.value);
        renderProjectPhotos();
    });
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
        }
    });

    const open = document.createElement("a");
    open.className = "project-photo-open";
    open.textContent = "Open";
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.href = link || "#";
    if (!link) {
        open.setAttribute("aria-disabled", "true");
        open.addEventListener("click", event => event.preventDefault());
    }

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "project-photo-clear";
    clear.textContent = "×";
    clear.title = `Remove Photo ${index + 1} link`;
    clear.addEventListener("click", () => {
        updateProjectPhotoLink(index, "");
        renderProjectPhotos();
    });

    linkRow.append(input, open, clear);

    const canvas = document.createElement("div");
    canvas.className = "project-photo-canvas";
    const preview = getProjectPhotoPreviewUrl(link);

    if (!preview) {
        const empty = document.createElement("div");
        empty.className = "project-photo-empty";
        empty.textContent = link
            ? "Use a Google Drive image link or file ID."
            : "Paste a Google Drive image link to preview it here.";
        canvas.appendChild(empty);
    }
    else {
        const image = document.createElement("img");
        image.className = "project-photo-image";
        image.src = preview;
        image.alt = `Project photo ${index + 1}`;
        image.style.width = `${projectPhotoZoomLevels[index]}%`;
        image.addEventListener("error", () => {
            const fallback = getProjectPhotoFallbackUrl(link);
            if (fallback && image.dataset.usedFallback !== "true") {
                image.dataset.usedFallback = "true";
                image.src = fallback;
                return;
            }

            canvas.innerHTML = "";
            const error = document.createElement("div");
            error.className = "project-photo-empty";
            error.textContent = "Preview unavailable. Make sure this Drive image is shared with your signed-in Google account.";
            canvas.appendChild(error);
        });
        canvas.appendChild(image);
    }

    panel.append(header, linkRow, canvas);
    return panel;

}

function renderProjectPhotos() {

    const overlay = ensureProjectPhotosModal();
    const links = getProjectPhotoLinks();

    overlay.innerHTML = "";
    const dialog = document.createElement("section");
    dialog.className = "project-photos-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Project Photos");

    const header = document.createElement("header");
    header.className = "project-photos-header";
    const heading = document.createElement("div");
    heading.innerHTML = "<h2>Project Photos</h2><p>Paste up to four Google Drive image links. Each panel zooms and scrolls independently.</p>";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "project-photos-close";
    close.innerHTML = "&times;";
    close.title = "Close Project Photos";
    close.addEventListener("click", closeProjectPhotos);
    header.append(heading, close);

    const grid = document.createElement("div");
    grid.className = "project-photos-grid";
    links.forEach((link, index) => grid.appendChild(createProjectPhotoPanel(index, link)));

    dialog.append(header, grid);
    overlay.appendChild(dialog);

}

function openProjectPhotos() {

    const overlay = ensureProjectPhotosModal();
    renderProjectPhotos();
    overlay.style.display = "flex";

}

function closeProjectPhotos() {

    if (projectPhotosOverlay) {
        projectPhotosOverlay.style.display = "none";
    }

}

window.openProjectPhotos = openProjectPhotos;
window.closeProjectPhotos = closeProjectPhotos;
