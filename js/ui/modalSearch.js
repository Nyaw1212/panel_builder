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

        if (keywords.length === 0) {

            return true;

        }

        const haystack = [

            item.CatalogNumber,

            item.Description,

            item.Type,

            item.Size

        ]

            .filter(Boolean)

            .join(" ")

            .toLowerCase();

        return keywords.every(keyword =>

            haystack.includes(keyword)

        );

    });

}

//----------------------------------
// Expose
//----------------------------------

window.filterModalSearch = filterModalSearch;   