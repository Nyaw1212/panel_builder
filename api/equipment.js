window.API = {

    //----------------------------------
    // Equipment
    //----------------------------------

    async getEquipment() {

        const response =
            await fetch("./Mock/MML.json");

        if (!response.ok) {

            throw new Error("Unable to load MML.json");

        }

        return await response.json();

    },

    //----------------------------------
    // MML
    //----------------------------------

    async getMML() {

        const response =
            await fetch("./Mock/MML.json");

        if (!response.ok) {

            throw new Error("Unable to load MML.json");

        }

        return await response.json();

    },

    //----------------------------------
    // Presets
    //----------------------------------

    async getPresets() {

        const response =
            await fetch("./Mock/PRESETS.json");

        if (!response.ok) {

            throw new Error("Unable to load PRESETS.json");

        }

        return await response.json();

    }

};