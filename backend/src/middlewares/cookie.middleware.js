/**
 * Custom cookie parser middleware to ensure req.cookies is always populated
 * without hard dependency on external packages.
 */
const cookieParser = (req, res, next) => {
  if (req.cookies) return next();

  req.cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        const name = parts[0].trim();
        const val = parts[1].trim();
        req.cookies[name] = decodeURIComponent(val);
      }
    });
  }

  next();
};

module.exports = cookieParser;
