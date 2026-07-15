//----------------------------------
// Link Transition
//----------------------------------

//----------------------------------
// Get Start Transition
//----------------------------------

function getStartTransition(startExit, firstGridPoint, side) {
  if (!startExit || !firstGridPoint) {
    return null;
  }

  switch (side) {
    //----------------------------------
    // Vertical Exit
    //----------------------------------

    case "top":

    case "bottom":
      return {
        x: startExit.x,

        y: firstGridPoint.y,
      };

    //----------------------------------
    // Horizontal Exit
    //----------------------------------

    case "left":

    case "right":
      return {
        x: firstGridPoint.x,

        y: startExit.y,
      };
  }

  return null;
}

//----------------------------------
// Get End Transition
//----------------------------------

function getEndTransition(lastGridPoint, endExit, side) {
  if (!lastGridPoint || !endExit) {
    return null;
  }

  switch (side) {
    //----------------------------------
    // Vertical Entry
    //----------------------------------

    case "top":

    case "bottom":
      return {
        x: endExit.x,

        y: lastGridPoint.y,
      };

    //----------------------------------
    // Horizontal Entry
    //----------------------------------

    case "left":

    case "right":
      return {
        x: lastGridPoint.x,

        y: endExit.y,
      };
  }

  return null;
}

//----------------------------------
// Get Node Side
//----------------------------------

function getNodeSide(panelId, connectionId) {
  const node = getRegisteredConnectionNode(panelId, connectionId);

  if (!node) {
    return null;
  }

  return node.dataset.side;
}

//----------------------------------
// Expose
//----------------------------------

window.getStartTransition = getStartTransition;
window.getEndTransition = getEndTransition;
window.getNodeSide = getNodeSide;
