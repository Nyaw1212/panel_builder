//----------------------------------
// Render Inspector
//----------------------------------

function renderLinkInspector(link) {

    inspectorBody.innerHTML = `

        ${renderInspectorPanels(link)}


        ${renderInspectorConduit(link)}

        ${renderInspectorAssembly(link)}

    `;

}