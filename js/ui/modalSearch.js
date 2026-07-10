//----------------------------------
// Filter Modal Search
//----------------------------------

function filterModalSearch(

    list,

    searchText = ""

) {

    const keywords = searchText

        .toLowerCase()

        .trim()

        .split(/\s+/)

        .filter(Boolean);

    return list.filter(item => {

        //----------------------------------
        // No Search
        //----------------------------------

        if (keywords.length === 0) {

            return true;

        }

        //----------------------------------
        // Search Fields
        //----------------------------------

        const haystack = [

            item.CatalogNumber,
            item.Description,
            item.Type,
            item.Size,
            item.NodeType,
            item.Color,
            item.Code,
            item.Supplier,
            item.Items,
            item.VendorCode

        ]

            .filter(value => value !== null && value !== undefined)

            .join(" ")

            .toLowerCase();

        //----------------------------------
        // Match All Keywords
        //----------------------------------

        return keywords.every(keyword =>

            haystack.includes(keyword)

        );

    });

}

//----------------------------------
// Expose
//----------------------------------

window.filterModalSearch = filterModalSearch;