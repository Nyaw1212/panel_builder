console.log("modalEquipment.js Loaded");

//----------------------------------
// Equipment List
//----------------------------------

function getEquipmentModalList(list) {

    return list

        //----------------------------------
        // Only Placeable Equipment
        //----------------------------------

        .filter(item => item.Placeable)

        //----------------------------------
        // Favorites First
        //----------------------------------

        .sort((a, b) => {

            const favA = Boolean(a.Favorite);
            const favB = Boolean(b.Favorite);

            if (favA && !favB) return -1;
            if (!favA && favB) return 1;

            //----------------------------------
            // Alphabetical
            //----------------------------------

            return (a.CatalogNumber || "")
                .localeCompare(

                    b.CatalogNumber || ""

                );

        });

}

//----------------------------------
// Equipment Click
//----------------------------------

function handleEquipmentClick(item) {

    console.group("handleEquipmentClick");

    console.log("Item:", item.CatalogNumber);

    console.log("Current Cell:", currentCell);

    console.log("Current Preset:", getCurrentPreset());

    console.log("placeItem:", typeof placeItem);

    console.log("Calling placeItem...");

    const placedItem = placeItem(

        item,

        currentCell,

        getCurrentPreset()

    );

    console.log("Returned:", placedItem);

    console.groupEnd();

    if (!placedItem) {

        console.warn("placeItem returned null.");

        return;

    }

    //----------------------------------
    // Select Equipment
    //----------------------------------

    if (typeof setSelectedItem === "function") {

        setSelectedItem(placedItem);

    }
    else {

        selectedItem = placedItem;

    }

    //----------------------------------
    // Close Modal
    //----------------------------------

    modal.style.display = "none";

    //----------------------------------
    // Redraw
    //----------------------------------

    drawCanvas();

}

//----------------------------------
// Expose
//----------------------------------

window.getEquipmentModalList =
    getEquipmentModalList;

window.handleEquipmentClick =
    handleEquipmentClick;