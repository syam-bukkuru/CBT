// Gate for any route that needs a logged-in user. The session stores a minimal
// { id, name, email } snapshot at login time, so this never hits the DB.
export default function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  req.user = req.session.user
  next()
}
