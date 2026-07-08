//----------------------------------
// Connection Constants
//----------------------------------

const CONNECTION_SIDES = [
    "top",
    "right",
    "bottom",
    "left"
];

//----------------------------------
// Create Connection
//----------------------------------

function createConnection(side, offset = 0.5) {

    return {

        id: crypto.randomUUID(),

        side,

        offset,

        //----------------------------------
        // UI State
        //----------------------------------

        connected: false,

        //----------------------------------
        // Existing System
        //----------------------------------

        hardware: [],

        wires: [],

        //----------------------------------
        // New Node System
        //----------------------------------

        materials: [],

        links: [],

        //----------------------------------
        // Future
        //----------------------------------

        conduit: null,

        conduitLength: 0,

        notes: ""

    };

}

//----------------------------------
// Create Default Connections
//----------------------------------

function createDefaultConnections() {

    return {

        top: [],
        right: [],
        bottom: [],
        left: []

    };

}