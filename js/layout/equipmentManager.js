//----------------------------------
// Equipment Manager
//----------------------------------

/**
 * Returns true if item exists.
 */
function isValidEquipment(item) {

    return Boolean(item);

}

//----------------------------------
// Replace Preset
//----------------------------------

function replacePreset(item, preset) {

    console.group("Replace Preset");

    if (!isValidEquipment(item)) {

        console.error("Invalid Equipment");

        console.groupEnd();

        return false;

    }

    console.log("Preset Received:", preset);

    console.log("Current window.presets");

    console.table(window.presets);

    const materials = getPresetMaterials(preset);

    console.log("Preset Materials");

    console.table(materials);

    item.preset = preset;

    item.materials = structuredClone(materials);

    console.log("Equipment After Preset");

    console.log(item);

    console.groupEnd();

    return true;

}

//----------------------------------
// Replace Materials
//----------------------------------

function replaceMaterials(item, materials) {

    if (!isValidEquipment(item)) {

        return false;

    }

    item.materials = structuredClone(materials);

    return true;

}

//----------------------------------
// Add Material
//----------------------------------

function addMaterial(item, material) {

    if (!isValidEquipment(item)) {

        return false;

    }

    item.materials.push(

        structuredClone(material)

    );

    return true;

}

//----------------------------------
// Remove Material
//----------------------------------

function removeMaterial(item, catalogNumber) {

    if (!isValidEquipment(item)) {

        return false;

    }

    item.materials = item.materials.filter(

        material =>

            material.catalogNumber !== catalogNumber

    );

    return true;

}

//----------------------------------
// Update Material Qty
//----------------------------------

function updateMaterialQty(
    item,
    catalogNumber,
    qty
) {

    if (!isValidEquipment(item)) {

        return false;

    }

    const material = item.materials.find(

        material =>

            material.catalogNumber === catalogNumber

    );

    if (!material) {

        return false;

    }

    material.qty = qty;

    return true;

}

//----------------------------------
// Get Materials
//----------------------------------

function getEquipmentMaterials(item) {

    if (!isValidEquipment(item)) {

        return [];

    }

    return item.materials;

}

//----------------------------------
// Duplicate Equipment
//----------------------------------

function duplicateEquipment(item) {

    if (!isValidEquipment(item)) {

        return null;

    }

    return structuredClone(item);

}

//----------------------------------
// Rotate Equipment
//----------------------------------

function rotateEquipment(item) {

    if (!isValidEquipment(item)) {

        return false;

    }

    item.rotation =

        ((item.rotation || 0) + 90) % 360;

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.replacePreset = replacePreset;
window.replaceMaterials = replaceMaterials;
window.addMaterial = addMaterial;
window.removeMaterial = removeMaterial;
window.updateMaterialQty = updateMaterialQty;
window.getEquipmentMaterials = getEquipmentMaterials;
window.duplicateEquipment = duplicateEquipment;
window.rotateEquipment = rotateEquipment;