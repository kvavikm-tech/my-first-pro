function createApiKeyMiddleware() {
  return function apiKeyMiddleware(req, res, next) {
    if (req.path === '/health') {
      return next();
    }

    const expectedApiKey = process.env.API_KEY;
    const providedApiKey = req.header('X-API-Key');

    if (!expectedApiKey) {
      return res.status(500).json({
        error: 'Server is missing API_KEY configuration.'
      });
    }

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  };
}

module.exports = {
  createApiKeyMiddleware,
};
