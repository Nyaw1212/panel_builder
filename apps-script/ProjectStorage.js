//----------------------------------
// Project JSON Storage
//----------------------------------

const PROJECT_JSON_FOLDER_NAME = "PanelBuilder Project JSON";
const PROJECT_JSON_FOLDER_PROPERTY = "PANELBUILDER_PROJECT_JSON_FOLDER_ID";

function getProjectJsonFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const savedFolderId = String(
    properties.getProperty(PROJECT_JSON_FOLDER_PROPERTY) || ""
  ).trim();

  if (savedFolderId) {
    try {
      return DriveApp.getFolderById(savedFolderId);
    }
    catch (err) {
      Logger.log(
        "Saved project JSON folder is unavailable; creating a new folder. " +
        err.message
      );
    }
  }

  const folders = DriveApp.getFoldersByName(PROJECT_JSON_FOLDER_NAME);
  const folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(PROJECT_JSON_FOLDER_NAME);

  properties.setProperty(
    PROJECT_JSON_FOLDER_PROPERTY,
    folder.getId()
  );

  return folder;
}

function saveProjectJsonFile_(projectId, project, existingFileId) {
  const normalizedProjectId = String(projectId || "").trim();

  if (!normalizedProjectId) {
    throw new Error("Project ID is required for JSON storage.");
  }

  const json = JSON.stringify(project);
  const fileName = normalizedProjectId + ".json";
  const normalizedFileId = String(existingFileId || "").trim();

  if (normalizedFileId) {
    try {
      const file = DriveApp.getFileById(normalizedFileId);
      file.setName(fileName);
      file.setContent(json);
      return file.getId();
    }
    catch (err) {
      Logger.log(
        "Existing project JSON file is unavailable; creating a replacement. " +
        err.message
      );
    }
  }

  const folder = getProjectJsonFolder_();
  const blob = Utilities.newBlob(
    json,
    "application/json",
    fileName
  );

  return folder.createFile(blob).getId();
}

function readProjectJsonFile_(fileId) {
  const normalizedFileId = String(fileId || "").trim();

  if (!normalizedFileId) {
    return null;
  }

  try {
    const text = DriveApp
      .getFileById(normalizedFileId)
      .getBlob()
      .getDataAsString("UTF-8");

    return parseProjectJSON(text);
  }
  catch (err) {
    Logger.log(
      "Unable to read project JSON file " +
      normalizedFileId +
      ": " +
      err.message
    );

    return null;
  }
}

function deleteProjectJsonFile_(fileId) {
  const normalizedFileId = String(fileId || "").trim();

  if (!normalizedFileId) {
    return;
  }

  try {
    DriveApp.getFileById(normalizedFileId).setTrashed(true);
  }
  catch (err) {
    Logger.log(
      "Unable to trash project JSON file " +
      normalizedFileId +
      ": " +
      err.message
    );
  }
}
