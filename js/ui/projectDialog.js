//----------------------------------
// Project Dialog
//----------------------------------

let projectDialog = null;
let projectDialogSaveAsNew = false;

//----------------------------------
// Theme
//----------------------------------

const PROJECT_DIALOG_THEME = {
    overlay: "rgba(2, 8, 20, 0.76)",
    card: "#111827",
    cardAlt: "#0f172a",
    border: "#334155",
    borderHover: "#475569",
    text: "#f8fafc",
    mutedText: "#cbd5e1",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    secondary: "#1e293b",
    secondaryHover: "#334155"
};

//----------------------------------
// Style Helpers
//----------------------------------

function styleProjectDialogInput(input) {

    Object.assign(input.style, {
        width: "100%",
        boxSizing: "border-box",
        marginTop: "6px",
        marginBottom: "16px",
        padding: "11px 12px",
        background: PROJECT_DIALOG_THEME.cardAlt,
        color: PROJECT_DIALOG_THEME.text,
        border: `1px solid ${PROJECT_DIALOG_THEME.border}`,
        borderRadius: "7px",
        outline: "none",
        fontSize: "14px",
        fontFamily: "inherit",
        transition:
            "border-color .15s ease, box-shadow .15s ease"
    });

    input.addEventListener("focus", () => {
        input.style.borderColor =
            PROJECT_DIALOG_THEME.primary;

        input.style.boxShadow =
            "0 0 0 3px rgba(37, 99, 235, 0.20)";
    });

    input.addEventListener("blur", () => {
        input.style.borderColor =
            PROJECT_DIALOG_THEME.border;

        input.style.boxShadow =
            "none";
    });

}

function styleProjectDialogLabel(label) {

    Object.assign(label.style, {
        display: "block",
        color: PROJECT_DIALOG_THEME.mutedText,
        fontSize: "13px",
        fontWeight: "600"
    });

}

function styleProjectDialogButton(
    button,
    variant = "secondary"
) {

    const isPrimary =
        variant === "primary";

    const background =
        isPrimary
            ? PROJECT_DIALOG_THEME.primary
            : PROJECT_DIALOG_THEME.secondary;

    const hoverBackground =
        isPrimary
            ? PROJECT_DIALOG_THEME.primaryHover
            : PROJECT_DIALOG_THEME.secondaryHover;

    Object.assign(button.style, {
        minHeight: "38px",
        padding: "9px 16px",
        background,
        color: "#ffffff",
        border:
            isPrimary
                ? "1px solid #3b82f6"
                : `1px solid ${PROJECT_DIALOG_THEME.borderHover}`,
        borderRadius: "7px",
        fontWeight: "600",
        fontFamily: "inherit",
        cursor: "pointer",
        transition:
            "background .15s ease, transform .05s ease"
    });

    button.addEventListener("mouseenter", () => {
        button.style.background =
            hoverBackground;
    });

    button.addEventListener("mouseleave", () => {
        button.style.background =
            background;
    });

    button.addEventListener("mousedown", () => {
        button.style.transform =
            "translateY(1px)";
    });

    button.addEventListener("mouseup", () => {
        button.style.transform =
            "translateY(0)";
    });

}

//----------------------------------
// Normalize Text
//----------------------------------

function normalizeProjectDetailValue(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}

//----------------------------------
// Parse Pasted Project Details
//----------------------------------

function parseProjectDetails(text) {

    const raw =
        String(text || "").trim();

    if (!raw) {
        return null;
    }

    const knownLenders = [
        "concert",
        "propel",
        "solrite",
        "enfin",
        "goodleap",
        "everbright",
        "sungage"
    ];

    let values = [];

    if (raw.includes("\t")) {

        values =
            raw
                .split(/\t+/)
                .map(value => value.trim())
                .filter(Boolean);

    }
    else if (raw.includes("/")) {

        values =
            raw
                .split(/\s*\/\s*/)
                .map(value => value.trim())
                .filter(Boolean);

    }
    else {

        values =
            raw
                .split(/\r?\n| {2,}/)
                .map(value => value.trim())
                .filter(Boolean);

    }

    if (!values.length) {
        return null;
    }

    console.log(
        "Parsed Raw Values:",
        values
    );

    let lender = "";

    const lenderIndex =
        values.findIndex(value => {

            const normalizedValue =
                normalizeProjectDetailValue(value);

            return knownLenders.some(
                knownLender =>
                    normalizedValue === knownLender ||
                    normalizedValue.includes(knownLender)
            );

        });

    if (lenderIndex !== -1) {

        const normalizedLenderValue =
            normalizeProjectDetailValue(
                values[lenderIndex]
            );

        const matchedLender =
            knownLenders.find(
                knownLender =>
                    normalizedLenderValue === knownLender ||
                    normalizedLenderValue.includes(knownLender)
            );

        if (matchedLender) {

            lender =
                matchedLender
                    .charAt(0)
                    .toUpperCase() +
                matchedLender.slice(1);

        }

    }

    const streetClues = [
        " st",
        " street",
        " rd",
        " road",
        " ln",
        " lane",
        " dr",
        " drive",
        " ave",
        " avenue",
        " blvd",
        " boulevard",
        " ct",
        " court",
        " way",
        " pkwy",
        " parkway",
        " hwy",
        " highway",
        " cir",
        " circle",
        " pl",
        " place",
        " trl",
        " trail"
    ];

    const addressIndex =
        values.findIndex(value => {

            const normalizedValue =
                normalizeProjectDetailValue(value);

            const hasNumber =
                /\d+/.test(value);

            const hasStreetClue =
                streetClues.some(
                    clue =>
                        normalizedValue.includes(clue)
                );

            const hasCityStateZip =
                /,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?$/i
                    .test(value);

            return (
                hasNumber &&
                (
                    hasStreetClue ||
                    hasCityStateZip
                )
            );

        });

    function isDate(value) {

        return (
            /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
                .test(
                    String(value).trim()
                )
        );

    }

    const ignoredStatuses = [
        "new order",
        "revision",
        "revised",
        "cancelled",
        "canceled",
        "complete",
        "completed",
        "pending",
        "on hold",
        "approved",
        "ready",
        "in progress",
        "submitted"
    ];

    const jobName =
        values[0] || "";

    const address =
        addressIndex !== -1
            ? values[addressIndex]
            : values[1] || "";

    let electrician = "";

    const addressPosition =
        addressIndex !== -1
            ? addressIndex
            : 1;

    for (
        let index = addressPosition + 1;
        index < values.length;
        index++
    ) {

        const value =
            values[index];

        const normalizedValue =
            normalizeProjectDetailValue(value);

        if (
            !value ||
            isDate(value) ||
            index === lenderIndex ||
            ignoredStatuses.includes(
                normalizedValue
            )
        ) {
            continue;
        }

        electrician = value;

        break;

    }

    if (
        !electrician &&
        values.length >= 3
    ) {

        electrician =
            values[2] || "";

    }

    if (
        !lender &&
        values.length === 4
    ) {

        lender =
            values[3] || "";

    }

    return {
        jobName,
        address,
        electrician,
        lender
    };

}

//----------------------------------
// Apply Parsed Details
//----------------------------------

function applyParsedProjectDetails(
    parsed,
    fields
) {

    if (!parsed || !fields) {
        return;
    }

    fields.jobInput.value =
        parsed.jobName || "";

    fields.addressInput.value =
        parsed.address || "";

    fields.electricianInput.value =
        parsed.electrician || "";

    fields.lenderInput.value =
        parsed.lender || "";

}

//----------------------------------
// Show
//----------------------------------

function showProjectDialog(options = {}) {

    projectDialogSaveAsNew = options.saveAsNew === true;

    if (projectDialog) {

        const project =
            getProjectState();

        document
            .getElementById("projectJobName")
            .value =
            projectDialogSaveAsNew && project.jobName
                ? `${project.jobName} Copy`
                : project.jobName || "";

        document
            .getElementById("projectAddress")
            .value =
            project.address || "";

        document
            .getElementById("projectElectrician")
            .value =
            project.electrician || "";

        document
            .getElementById("projectLender")
            .value =
            project.lender || "";

        document
            .getElementById("projectModel")
            .value =
            project.model || "";

        document
            .getElementById("projectPasteDetails")
            .value = "";

        document
            .getElementById("projectDialogTitle")
            .textContent = projectDialogSaveAsNew
                ? "Save Project as New"
                : "Save Project";

        document
            .getElementById("projectDialogSaveButton")
            .textContent = projectDialogSaveAsNew
                ? "Save as New"
                : "Save";

        projectDialog.style.display =
            "flex";

        return;

    }

    projectDialog =
        document.createElement("div");

    projectDialog.id =
        "projectDialog";

    KeyboardManagerV2.register(
    projectDialog,
    {
        close: hideProjectDialog,

        save: () => {
            saveButton.click();
        },

        confirm: () => {
            saveButton.click();
        },

        closeOnOverlay: true,
        closeOnEscape: true,
        enterToConfirm: true,
        ctrlEnterToConfirm: true,
        priority: 100
    }
);

    Object.assign(
        projectDialog.style,
        {
            position: "fixed",
            inset: "0",
            width: "100vw",
            height: "100vh",
            boxSizing: "border-box",
            padding: "20px",
            background:
                PROJECT_DIALOG_THEME.overlay,
            backdropFilter:
                "blur(5px)",
            WebkitBackdropFilter:
                "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "9999"
        }
    );

    const card =
        document.createElement("div");

    Object.assign(card.style, {
        width: "460px",
        maxWidth: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxSizing: "border-box",
        background:
            "linear-gradient(180deg, #111827 0%, #0b1120 100%)",
        color: PROJECT_DIALOG_THEME.text,
        border:
            `1px solid ${PROJECT_DIALOG_THEME.border}`,
        borderRadius: "12px",
        padding: "24px",
        boxShadow:
            "0 22px 70px rgba(0, 0, 0, 0.58)",
        scrollbarWidth: "thin",
        scrollbarColor:
            "#475569 #0b1120"
    });

    const title =
        document.createElement("h2");

    title.textContent =
        projectDialogSaveAsNew
            ? "Save Project as New"
            : "Save Project";

    title.id =
        "projectDialogTitle";

    Object.assign(title.style, {
        margin: "0 0 20px 0",
        color: PROJECT_DIALOG_THEME.text,
        fontSize: "20px",
        fontWeight: "700"
    });

    const pasteLabel =
        document.createElement("label");

    pasteLabel.textContent =
        "Paste Project Details";

    styleProjectDialogLabel(
        pasteLabel
    );

    const pasteInput =
        document.createElement("textarea");

    pasteInput.id =
        "projectPasteDetails";

    pasteInput.rows =
        4;

    pasteInput.placeholder =
        "Paste tab-separated data or:\nJob Name / Address / Electrician / Lender";

    styleProjectDialogInput(
        pasteInput
    );

    pasteInput.style.resize =
        "vertical";

    const parseButton =
        document.createElement("button");

    parseButton.type =
        "button";

    parseButton.textContent =
        "Parse Details";

    styleProjectDialogButton(
        parseButton,
        "secondary"
    );

    Object.assign(
        parseButton.style,
        {
            width: "100%",
            marginBottom: "20px"
        }
    );

    const jobLabel =
        document.createElement("label");

    jobLabel.textContent =
        "Project Name";

    styleProjectDialogLabel(
        jobLabel
    );

    const jobInput =
        document.createElement("input");

    jobInput.id =
        "projectJobName";

    jobInput.type =
        "text";

    jobInput.placeholder =
        "Enter Project Name";

    styleProjectDialogInput(
        jobInput
    );

    const addressLabel =
        document.createElement("label");

    addressLabel.textContent =
        "Address";

    styleProjectDialogLabel(
        addressLabel
    );

    const addressInput =
        document.createElement("input");

    addressInput.id =
        "projectAddress";

    addressInput.type =
        "text";

    addressInput.placeholder =
        "Enter Address";

    styleProjectDialogInput(
        addressInput
    );

    const electricianLabel =
        document.createElement("label");

    electricianLabel.textContent =
        "Electrician";

    styleProjectDialogLabel(
        electricianLabel
    );

    const electricianInput =
        document.createElement("input");

    electricianInput.id =
        "projectElectrician";

    electricianInput.type =
        "text";

    electricianInput.placeholder =
        "Enter Electrician";

    styleProjectDialogInput(
        electricianInput
    );

    const lenderLabel =
        document.createElement("label");

    lenderLabel.textContent =
        "Lender";

    styleProjectDialogLabel(
        lenderLabel
    );

    const lenderInput =
        document.createElement("input");

    lenderInput.id =
        "projectLender";

    lenderInput.type =
        "text";

    lenderInput.placeholder =
        "Enter Lender";

    styleProjectDialogInput(
        lenderInput
    );

    const modelLabel =
        document.createElement("label");

    modelLabel.textContent =
        "Model";

    styleProjectDialogLabel(
        modelLabel
    );

    const modelInput =
        document.createElement("input");

    modelInput.id =
        "projectModel";

    modelInput.type =
        "text";

    modelInput.placeholder =
        "Enter Model";

    styleProjectDialogInput(
        modelInput
    );

    const fields = {
        jobInput,
        addressInput,
        electricianInput,
        lenderInput,
        modelInput
    };

    parseButton.onclick = () => {

        const parsed =
            parseProjectDetails(
                pasteInput.value
            );

        if (!parsed) {

            alert(
                "Unable to parse the pasted details."
            );

            return;

        }

        applyParsedProjectDetails(
            parsed,
            fields
        );

        console.log(
            "Parsed Project Details",
            parsed
        );

    };

    pasteInput.addEventListener(
        "paste",
        () => {

            setTimeout(
                () => {

                    const parsed =
                        parseProjectDetails(
                            pasteInput.value
                        );

                    if (!parsed) {
                        return;
                    }

                    applyParsedProjectDetails(
                        parsed,
                        fields
                    );

                },
                0
            );

        }
    );

    const project =
        getProjectState();

    jobInput.value =
        projectDialogSaveAsNew && project.jobName
            ? `${project.jobName} Copy`
            : project.jobName || "";

    addressInput.value =
        project.address || "";

    electricianInput.value =
        project.electrician || "";

    lenderInput.value =
        project.lender || "";

    modelInput.value =
        project.model || "";

    const buttonRow =
        document.createElement("div");

    Object.assign(
        buttonRow.style,
        {
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "4px"
        }
    );

    const cancelButton =
        document.createElement("button");

    cancelButton.type =
        "button";

    cancelButton.textContent =
        "Cancel";

    styleProjectDialogButton(
        cancelButton,
        "secondary"
    );

    cancelButton.onclick =
        hideProjectDialog;

    const saveButton =
        document.createElement("button");

    saveButton.type =
        "button";

    saveButton.textContent =
        projectDialogSaveAsNew
            ? "Save as New"
            : "Save";

    saveButton.id =
        "projectDialogSaveButton";

    styleProjectDialogButton(
        saveButton,
        "primary"
    );

    saveButton.onclick =
        async () => {

            const saveAsNew = projectDialogSaveAsNew;

            const jobName =
                jobInput.value.trim();

            const address =
                addressInput.value.trim();

            const electrician =
                electricianInput
                    .value
                    .trim();

            const lender =
                lenderInput
                    .value
                    .trim();

            const model =
                modelInput
                    .value
                    .trim();

            if (!jobName) {

                alert(
                    "Project Name is required."
                );

                jobInput.focus();

                return;

            }

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

            saveButton.style.opacity =
                "0.7";

            saveButton.style.cursor =
                "wait";

            try {

                setProjectState({
                    ...getProjectState(),
                    jobName,
                    address,
                    electrician,
                    lender,
                    model
                });

                console.log(
                    "Project State"
                );

                console.log(
                    getProjectState()
                );

                const result =
                    await saveCurrentProject({ saveAsNew });

                console.log(result);

                if (result.success) {

                    hideProjectDialog();

                    alert(
                        saveAsNew
                            ? "New project saved!"
                            : "Project Saved!"
                    );

                }
                else {

                    alert(
                        result.message ||
                        "Save Failed."
                    );

                }

            }
            catch (error) {

                console.error(
                    "Project Save Failed:",
                    error
                );

                alert(
                    error?.message ||
                    "Save Failed."
                );

            }
            finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    projectDialogSaveAsNew
                        ? "Save as New"
                        : "Save";

                saveButton.style.opacity =
                    "1";

                saveButton.style.cursor =
                    "pointer";

            }

        };

    projectDialog.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                projectDialog
            ) {

                hideProjectDialog();

            }

        }
    );

    projectDialog.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                hideProjectDialog();
            }

        }
    );

    buttonRow.appendChild(
        cancelButton
    );

    buttonRow.appendChild(
        saveButton
    );

    card.appendChild(title);
    card.appendChild(pasteLabel);
    card.appendChild(pasteInput);
    card.appendChild(parseButton);
    card.appendChild(jobLabel);
    card.appendChild(jobInput);
    card.appendChild(addressLabel);
    card.appendChild(addressInput);
    card.appendChild(electricianLabel);
    card.appendChild(electricianInput);
    card.appendChild(lenderLabel);
    card.appendChild(lenderInput);
    card.appendChild(modelLabel);
    card.appendChild(modelInput);
    card.appendChild(buttonRow);

    projectDialog.appendChild(card);

    document.body.appendChild(
        projectDialog
    );

    jobInput.focus();

}

//----------------------------------
// Hide
//----------------------------------

function hideProjectDialog() {

    if (!projectDialog) {
        return;
    }

    projectDialog.style.display =
        "none";

}

//----------------------------------
// Expose
//----------------------------------

window.showProjectDialog =
    showProjectDialog;

window.hideProjectDialog =
    hideProjectDialog;

window.parseProjectDetails =
    parseProjectDetails;
