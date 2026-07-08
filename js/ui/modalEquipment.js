//----------------------------------
// Equipment List
//----------------------------------

function getEquipmentModalList(list) {

    return list

        .filter(item => item.Placeable)

        .filter(item => item.Favorite)

        .sort((a, b) =>

            a.CatalogNumber.localeCompare(

                b.CatalogNumber

            )

        );

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