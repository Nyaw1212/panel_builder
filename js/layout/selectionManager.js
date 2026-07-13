//----------------------------------
// Selection Manager
//----------------------------------

const SelectionManager = (() => {

    //----------------------------------
    // State
    //----------------------------------

    const selectedItems = new Set();

    //----------------------------------
    // Clear
    //----------------------------------

    function clear() {

        selectedItems.clear();

    }

    //----------------------------------
    // Select
    //----------------------------------

    function select(item) {

        clear();

        if (item) {

            selectedItems.add(item.id);

        }

    }

    //----------------------------------
    // Add
    //----------------------------------

    function add(item) {

        if (item) {

            selectedItems.add(item.id);

        }

    }

    //----------------------------------
    // Remove
    //----------------------------------

    function remove(item) {

        if (item) {

            selectedItems.delete(item.id);

        }

    }

    //----------------------------------
    // Toggle
    //----------------------------------

    function toggle(item) {

        if (!item) return;

        if (selectedItems.has(item.id)) {

            selectedItems.delete(item.id);

        }
        else {

            selectedItems.add(item.id);

        }

    }

    //----------------------------------
    // Is Selected
    //----------------------------------

    function isSelected(item) {

        return item
            ? selectedItems.has(item.id)
            : false;

    }

    //----------------------------------
    // Get Selected IDs
    //----------------------------------

    function getSelectedIds() {

        return [...selectedItems];

    }

    //----------------------------------
    // Get Selected Items
    //----------------------------------

    function getSelectedItems() {

        return getLayout()

            .filter(item =>

                item &&

                selectedItems.has(item.id)

            )

            .filter((item, index, array) =>

                array.findIndex(i => i.id === item.id) === index

            );

    }

    //----------------------------------
    // Count
    //----------------------------------

    function getCount() {

        return selectedItems.size;

    }

    //----------------------------------
    // Has Selection
    //----------------------------------

    function hasSelection() {

        return selectedItems.size > 0;

    }

    //----------------------------------
    // Expose
    //----------------------------------

    return {

        clear,
        select,
        add,
        remove,
        toggle,
        isSelected,
        getSelectedItems,
        getSelectedIds,
        getCount,
        hasSelection

    };

})();

//----------------------------------
// Expose
//----------------------------------

window.SelectionManager = SelectionManager;