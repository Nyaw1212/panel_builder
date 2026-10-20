//----------------------------------
// Project Photos
//----------------------------------

let projectPhotosOverlay = null;
let projectPhotoZoomLevels = [100, 100, 100, 100];
let activeProjectPhotoIndex = 0;

function isDetachedProjectPhotosWindow() {

    return new URLSearchParams(window.location.search).get("projectPhotos") === "1";

}

function getSavedProjectPhotoLinks() {

    try {
        const draft = JSON.parse(localStorage.getItem("PanelBuilderDraft") || "null");
        return Array.isArray(draft?.photoLinks) ? draft.photoLinks : [];
    }
    catch {
        return [];
    }

}

function getProjectPhotoLinks() {

    const project = typeof getProjectState === "function"
        ? getProjectState()
        : null;
    const savedLinks = getSavedProjectPhotoLinks();
    const stateLinks = Array.isArray(project?.photoLinks)
        ? project.photoLinks
        : [];
    const projectLinks = stateLinks.some(Boolean) || !savedLinks.some(Boolean)
        ? stateLinks
        : savedLinks;

    if (project && !Array.isArray(project.photoLinks)) {
        project.photoLinks = [];
    }

    return Array.from({ length: 4 }, (_, index) =>
        String(projectLinks[index] || "").trim()
    );

}

function extractGoogleDriveFileId(value) {

    const source = String(value || "").trim();
    if (!source) return "";

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

    if (/^data:image\//i.test(String(link || ""))) {
        return link;
    }

    const fileId = extractGoogleDriveFileId(link);
    if (!fileId) return "";

    return typeof getDriveImageUrl === "function"
        ? getDriveImageUrl(fileId, 1600)
        : `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;

}

function getProjectPhotoFallbackUrl(link) {

    if (/^data:image\//i.test(String(link || ""))) {
        return "";
    }

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

function getDroppedProjectPhotoLink(dataTransfer) {

    if (!dataTransfer) return "";

    const uriList = dataTransfer.getData("text/uri-list")
        .split(/\r?\n/)
        .find(value => value && !value.startsWith("#"));
    const plainText = dataTransfer.getData("text/plain").trim();
    const html = dataTransfer.getData("text/html");
    const href = html.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const candidates = [uriList, plainText, href]
        .map(value => String(value || "").trim())
        .filter(Boolean);

    for (const value of candidates) {
        if (extractGoogleDriveFileId(value)) return value;

        const url = value.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
        if (url && extractGoogleDriveFileId(url)) return url;
    }

    return "";

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
    document.addEventListener("paste", event => {
        if (projectPhotosOverlay.style.display !== "flex") return;

        const imageItem = Array.from(event.clipboardData?.items || [])
            .find(item => item.type.startsWith("image/"));
        const imageFile = imageItem?.getAsFile();

        if (!imageFile) return;

        event.preventDefault();
        pasteClipboardProjectPhoto(imageFile, activeProjectPhotoIndex);
    });
    document.body.appendChild(projectPhotosOverlay);

    return projectPhotosOverlay;

}

function pasteClipboardProjectPhoto(file, index) {

    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        const imageData = String(reader.result || "");
        if (!/^data:image\//i.test(imageData)) return;

        updateProjectPhotoLink(index, imageData);
        renderProjectPhotos();
    });
    reader.readAsDataURL(file);

}

function setProjectPhotoZoom(index, nextZoom) {

    projectPhotoZoomLevels[index] = Math.max(
        25,
        Math.min(300, Math.round(Number(nextZoom) || 100))
    );

    const image = projectPhotosOverlay?.querySelector(
        `[data-photo-index="${index}"] .project-photo-image`
    );

    if (image) {
        image.style.width = `${projectPhotoZoomLevels[index]}%`;
    }

}

function createProjectPhotoPanel(index, link) {

    const panel = document.createElement("section");
    panel.className = "project-photo-panel";
    panel.dataset.photoIndex = String(index);
    panel.tabIndex = 0;

    if (index === activeProjectPhotoIndex) {
        panel.classList.add("is-active");
    }

    panel.addEventListener("click", () => {
        activeProjectPhotoIndex = index;
        projectPhotosOverlay?.querySelectorAll(".project-photo-panel").forEach(item => {
            item.classList.toggle("is-active", Number(item.dataset.photoIndex) === index);
        });
    });
    panel.addEventListener("focus", () => {
        activeProjectPhotoIndex = index;
    });

    const canvas = document.createElement("div");
    canvas.className = "project-photo-canvas";
    canvas.title = "Click this panel, then Ctrl + V to paste a screenshot. Ctrl + mouse wheel zooms this photo.";

    panel.addEventListener("dragover", event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        panel.classList.add("is-drop-target");
    });
    panel.addEventListener("dragleave", event => {
        if (!panel.contains(event.relatedTarget)) {
            panel.classList.remove("is-drop-target");
        }
    });
    panel.addEventListener("drop", event => {
        event.preventDefault();
        panel.classList.remove("is-drop-target");

        const droppedLink = getDroppedProjectPhotoLink(event.dataTransfer);
        if (!droppedLink) {
            panel.classList.add("is-drop-invalid");
            window.setTimeout(() => panel.classList.remove("is-drop-invalid"), 700);
            return;
        }

        updateProjectPhotoLink(index, droppedLink);
        renderProjectPhotos();
    });
    canvas.addEventListener("wheel", event => {
        if (!event.ctrlKey) return;

        event.preventDefault();
        setProjectPhotoZoom(
            index,
            projectPhotoZoomLevels[index] + (event.deltaY < 0 ? 25 : -25)
        );
    }, { passive: false });

    const preview = getProjectPhotoPreviewUrl(link);

    if (!preview) {
        const empty = document.createElement("div");
        empty.className = "project-photo-empty";
        const hint = document.createElement("span");
        hint.textContent = link
            ? "Paste a screenshot or valid Google Drive image link"
            : "Click this panel, then Ctrl + V a screenshot";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "project-photo-link-input";
        input.placeholder = "Or paste Drive link, then Enter";
        input.setAttribute("aria-label", `Google Drive link for photo ${index + 1}`);

        const submitLink = () => {
            const value = input.value.trim();

            if (!extractGoogleDriveFileId(value)) {
                panel.classList.add("is-drop-invalid");
                input.focus();
                input.select();
                window.setTimeout(() => panel.classList.remove("is-drop-invalid"), 700);
                return;
            }

            updateProjectPhotoLink(index, value);
            renderProjectPhotos();
        };

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                submitLink();
            }
        });
        input.addEventListener("change", submitLink);
        input.addEventListener("paste", () => {
            window.setTimeout(submitLink, 0);
        });

        empty.append(hint, input);
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
            error.textContent = "Preview unavailable. Check that the Drive image is shared with your signed-in Google account.";
            canvas.appendChild(error);
        });
        canvas.appendChild(image);
    }

    panel.appendChild(canvas);

    if (link) {
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "project-photo-clear";
        clear.textContent = "×";
        clear.title = `Remove photo ${index + 1}`;
        clear.setAttribute("aria-label", `Remove photo ${index + 1}`);
        clear.addEventListener("click", () => {
            updateProjectPhotoLink(index, "");
            renderProjectPhotos();
        });
        panel.appendChild(clear);
    }

    return panel;

}

function detachProjectPhotos() {

    saveProjectPhotoLinks();

    const url = new URL(window.location.href);
    url.searchParams.set("projectPhotos", "1");

    const photoWindow = window.open(
        url.toString(),
        "panelBuilderProjectPhotos",
        "popup=yes,width=1500,height=950,resizable=yes,scrollbars=no"
    );

    if (!photoWindow) {
        alert("Your browser blocked the photo window. Allow pop-ups for Panel Builder, then try Detach again.");
        return;
    }

    photoWindow.focus();

}

function renderProjectPhotos() {

    const overlay = ensureProjectPhotosModal();
    const links = getProjectPhotoLinks();
    const detached = isDetachedProjectPhotosWindow();

    overlay.innerHTML = "";
    const dialog = document.createElement("section");
    dialog.className = "project-photos-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Project Photos");

    const header = document.createElement("header");
    header.className = "project-photos-header";
    const heading = document.createElement("div");
    heading.innerHTML = "<h2>Project Photos</h2><p>Click a panel, Ctrl + V screenshot · Paste or drop Drive links · Ctrl + wheel zooms</p>";
    header.appendChild(heading);

    if (!detached) {
        const detach = document.createElement("button");
        detach.type = "button";
        detach.className = "project-photos-detach";
        detach.textContent = "↗ Detach";
        detach.title = "Open this photo board in its own window";
        detach.addEventListener("click", detachProjectPhotos);
        header.appendChild(detach);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "project-photos-close";
    close.innerHTML = "&times;";
    close.title = detached ? "Close photo window" : "Close Project Photos";
    close.addEventListener("click", closeProjectPhotos);
    header.appendChild(close);

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

    if (isDetachedProjectPhotosWindow() && window.opener) {
        window.close();
        return;
    }

    if (projectPhotosOverlay) {
        projectPhotosOverlay.style.display = "none";
    }

}

function openDetachedProjectPhotosOnLoad() {

    if (!isDetachedProjectPhotosWindow()) return;

    // The popup shares the local draft with the main window. Waiting until the
    // application finishes restoring it makes the four panels appear populated.
    window.addEventListener("load", () => {
        window.setTimeout(openProjectPhotos, 500);
    }, { once: true });

}

window.openProjectPhotos = openProjectPhotos;
window.closeProjectPhotos = closeProjectPhotos;

openDetachedProjectPhotosOnLoad();
