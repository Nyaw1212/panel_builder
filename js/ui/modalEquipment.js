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

    const placedItem =

        placeItem(

            item,

            currentCell

        );

    if (!placedItem) {

        return;

    }

    selectedItem = placedItem;

    modal.style.display = "none";

    drawCanvas();

}

//----------------------------------
// Expose
//----------------------------------

window.getEquipmentModalList =
    getEquipmentModalList;

window.handleEquipmentClick =
    handleEquipmentClick;