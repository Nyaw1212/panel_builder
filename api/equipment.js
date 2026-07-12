//----------------------------------
// Configuration
//----------------------------------

const CONFIG = {

    // true  = Load local JSON files
    // false = Load Google Apps Script API

    useMock: false

};

//----------------------------------
// API
//----------------------------------

window.API = {

    //----------------------------------
    // Equipment
    //----------------------------------

    async getEquipment() {

        return await this.getMML();

    },

    //----------------------------------
    // MML
    //----------------------------------

    async getMML() {

        //----------------------------------
        // Mock Data
        //----------------------------------

        if (CONFIG.useMock) {

            const response = await fetch("./Mock/MML.json");

            if (!response.ok) {

                throw new Error("Unable to load Mock/MML.json");

            }

            return await response.json();

        }

        //----------------------------------
        // Live Data
        //----------------------------------

        return await getMaterials();

    },

    //----------------------------------
    // Presets
    //----------------------------------

    async getPresets() {

        if (CONFIG.useMock) {

            const response = await fetch("./Mock/PRESETS.json");

            if (!response.ok) {

                throw new Error("Unable to load Mock/PRESETS.json");

            }

            return await response.json();

        }

        return await getPresets();

    }

};