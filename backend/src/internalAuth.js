function requireInternalKey(req, res, next) {
  if (process.env.REQUIRE_INTERNAL_API_KEY === 'false') return next();

  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'INTERNAL_API_KEY is not configured' });
  }

  const provided = req.get('x-internal-key');
  if (provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = requireInternalKey;
