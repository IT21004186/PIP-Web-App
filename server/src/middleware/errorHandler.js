// Centralised Express error handler — must be registered last in app.js
function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
