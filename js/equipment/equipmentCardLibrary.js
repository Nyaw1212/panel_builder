//----------------------------------
// Equipment Card Library
//----------------------------------

function getEquipmentCardLibrary() {

    //----------------------------------
    // Current Component
    //----------------------------------

    const component =
        getSelectedEquipmentComponent();

    //----------------------------------
    // Materials
    //----------------------------------

    const materials =
        getMaterials();

    //----------------------------------
    // Filter
    //----------------------------------

    return materials.filter(material => {

        const nodeType =
            String(material.NodeType || "")
                .trim()
                .toUpperCase();

        switch (component) {

            case "BREAKER":
                return nodeType === "BREAKER";

            case "GROUND":
                return nodeType === "GT";

            default:
                return false;

        }

    });

}

//----------------------------------
// Expose
//----------------------------------

window.getEquipmentCardLibrary =
    getEquipmentCardLibrary;