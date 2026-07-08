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

    }

};