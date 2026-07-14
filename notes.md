Current Modal Refactor Plan
modalAssembly.js
Displays the current connection assembly.
Renders fitting cards (image + catalog number + remove button).
Handles removing fittings.
Apply Assembly button.
modalFilters.js
Left-side filter panel.
OUTPUT filters (#, LB, T, C, PC).
INPUT filters (#, LB, T, C, PC).
Updates active filters only.
modalLibrary.js
Displays available fittings.
Shows image, catalog number, description.
Clicking a fitting adds it to the assembly.
modalSearch.js
Live search box.
Filters library by catalog number or description.
Works together with filter buttons.
modalLayout.js
Creates the three floating windows.
Controls opening/closing the modal.
Positions:
Assembly
Filters
Library
Existing Data
connection.materials
Stores the selected assembly.
openMaterialModal(connection)
Opens the modal.
connection.materials.push()
Adds fitting.
connection.materials.splice()
Removes fitting.
UI Layout

Assembly Window

Current fittings
Remove button
Apply Assembly

Filter Window

OUTPUT buttons
INPUT buttons

Library Window

Search
Filtered fitting list
Click to add
Flow
Open Connection
      ↓
Open Modal
      ↓
Select Filters
      ↓
Search Library
      ↓
Click Fitting
      ↓
Assembly Updates
      ↓
Apply Assembly
      ↓
Save to connection.materials

This keeps each JS file focused on a single responsibility and makes the modal much easier to maintain and extend.