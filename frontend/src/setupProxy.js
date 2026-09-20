const { createProxyMiddleware } = require("http-proxy-middleware");

// CRA's package.json proxy can be skipped in some CRACO/Webpack combinations.
// Register the API route explicitly so the browser and installed PWA can use
// one HTTPS origin while Docker forwards requests to FastAPI internally.
module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://backend:8001",
      changeOrigin: true,
      ws: true,
      logLevel: "warn",
    }),
  );
};
