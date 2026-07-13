//----------------------------------
// Hovered Connection
//----------------------------------

let hoveredConnection = null;

//----------------------------------
// Set Hover
//----------------------------------

function setHoveredConnection(connection) {

    hoveredConnection = connection;

}

//----------------------------------
// Clear Hover
//----------------------------------

function clearHoveredConnection() {

    hoveredConnection = null;

}

//----------------------------------
// Get Hover
//----------------------------------

function getHoveredConnection() {

    return hoveredConnection;

}

//----------------------------------
// Has Hover
//----------------------------------

function hasHoveredConnection() {

    return hoveredConnection !== null;

}

//----------------------------------
// Expose
//----------------------------------

window.setHoveredConnection = setHoveredConnection;
window.clearHoveredConnection = clearHoveredConnection;
window.getHoveredConnection = getHoveredConnection;
window.hasHoveredConnection = hasHoveredConnection;