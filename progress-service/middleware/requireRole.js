// usage: requireRole('formateur') or requireRole('apprenant')
module.exports = (role) => (req, res, next) => {
  if (req.user?.role !== role)
    return res.status(403).json({ error: `Role '${role}' required` });
  next();
};
