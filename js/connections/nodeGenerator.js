//----------------------------------
// Generate Connection Nodes
//----------------------------------

function generateConnectionNodes(equipment) {

    const nodes = [];

    ["top", "bottom", "left", "right"].forEach(side => {

        const count = Number(equipment[side]) || 0;

        for (let i = 1; i <= count; i++) {

            nodes.push({

                id: `${side}-${i}`,

                side,

                index: i

            });

        }

    });

    return nodes;

}