const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation Error', messages });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry', field: Object.keys(err.keyValue) });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
