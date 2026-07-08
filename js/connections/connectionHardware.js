//----------------------------------
// Add Hardware
//----------------------------------

function addHardware(connection, material) {

    if (!connection) return;

    if (!material) return;

    connection.hardware.push(material);

}

//----------------------------------
// Remove Hardware
//----------------------------------

function removeHardware(connection, index) {

    if (!connection) return;

    connection.hardware.splice(index, 1);

}

//----------------------------------
// Clear Hardware
//----------------------------------

function clearHardware(connection) {

    if (!connection) return;

    connection.hardware = [];

}

//----------------------------------
// Get Hardware Count
//----------------------------------

function getHardwareCount(connection) {

    if (!connection) return 0;

    return connection.hardware.length;

}