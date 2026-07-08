//----------------------------------
// Find Material
//----------------------------------

function findMaterial(filter) {

    if (!Array.isArray(materials))
        return null;

    return materials.find(filter);

}

//----------------------------------
// Find Hub
//----------------------------------

function findHub(size) {

    return findMaterial(item =>

        item.Description?.toUpperCase().includes("HUB")

        &&

        item.Size === size

    );

}

//----------------------------------
// Find Connector
//----------------------------------

function findConnector(size) {

    return findMaterial(item =>

        item.Description?.toUpperCase().includes("CONNECTOR")

        &&

        item.Size === size

    );

}

//----------------------------------
// Find LB
//----------------------------------

function findLB90(size) {

    return findMaterial(item =>

        item.Description?.toUpperCase().includes("LB")

        &&

        item.Size === size

    );

}

//----------------------------------
// Expose
//----------------------------------

window.findMaterial = findMaterial;

window.findHub = findHub;

window.findConnector = findConnector;

window.findLB90 = findLB90;