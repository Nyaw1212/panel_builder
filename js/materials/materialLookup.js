//----------------------------------
// Material Lookup
//----------------------------------

function getMaterial(catalogNumber) {

    if (!catalogNumber) {

        return null;

    }

    return window.materials.find(

        material =>

            material.CatalogNumber === catalogNumber ||

            material.catalogNumber === catalogNumber

    ) || null;

}

//----------------------------------
// Expose
//----------------------------------

window.getMaterial = getMaterial;