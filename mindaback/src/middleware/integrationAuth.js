// src/middleware/integrationAuth.js
//
// Machine-to-machine auth for the external Template-Sync API used by the Minda /
// SAP HANA integration. The app's normal cookie/JWT auth is for the browser UI
// and cannot be used by a server-to-server caller, so these endpoints are
// protected by a static API key instead.
//
// The caller must send the key in the `x-api-key` request header (query param
// `api_key` is also accepted as a fallback for quick testing).
//
// Set the key in the backend .env:  INTEGRATION_API_KEY=<long-random-string>

import { AsyncHandler } from "../utils/asyncHandler.js";
import { UnAuthorizedError } from "../utils/errorHandler.js";
import { config } from "../config.js";

export const IntegrationAuth = AsyncHandler(async (req, _res, next) => {
  const provided = req.headers["x-api-key"] || req.query.api_key;
  const expected = config.INTEGRATION_API_KEY || process.env.INTEGRATION_API_KEY;

  if (!expected) {
    // Fail closed: if the server has no key configured, do NOT expose the data.
    throw new UnAuthorizedError(
      "Integration API key is not configured on the server.",
      "IntegrationAuth() not configured"
    );
  }

  if (!provided || String(provided) !== String(expected)) {
    throw new UnAuthorizedError(
      "Invalid or missing integration API key.",
      "IntegrationAuth() invalid key"
    );
  }

  next();
});