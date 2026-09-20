// True if `doc.createdBy` matches the given user id. Callers load the doc themselves
// (they need it loaded anyway to cascade-delete), so this stays a plain helper rather
// than an Express middleware.
export function isOwner(doc, userId) {
  return String(doc.createdBy) === String(userId)
}
