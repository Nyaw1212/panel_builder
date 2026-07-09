const PRESETS = {

    FD200: [
        { CatalogNumber: "DG224NRK", Qty: 1 },
        { CatalogNumber: "FRNR200", Qty: 2 }
    ],

    FD150: [
        { CatalogNumber: "DG223NRK", Qty: 1 },
        { CatalogNumber: "FRNR150", Qty: 2 }
    ],

    FD100: [
        { CatalogNumber: "DG223NRB", Qty: 1 },
        { CatalogNumber: "FRNR100", Qty: 2 }
    ]

};

function getPreset(code) {

    return structuredClone(PRESETS[code] || []);

}