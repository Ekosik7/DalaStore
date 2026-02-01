export function notFound(req, res) {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Server Error";
  res.status(status).json({ error: message });
}
