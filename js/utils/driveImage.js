// ----------------------------------
// Google Drive image URLs
// ----------------------------------
// Drive's /thumbnail endpoint can fail inside an embedded web app even when
// the Drive image exists. This is the direct image host used by Drive itself.

function getDriveImageUrl(fileId, width = 300) {
  const id = String(fileId || "").trim();
  if (!id) return "";

  const safeWidth = Math.max(32, Math.min(1600, Number(width) || 300));
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${safeWidth}`;
}

function getDriveImageFallbackUrl(fileId) {
  const id = String(fileId || "").trim();
  if (!id) return "";

  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}

window.getDriveImageUrl = getDriveImageUrl;
window.getDriveImageFallbackUrl = getDriveImageFallbackUrl;
