import { config } from "../config.js";
import { UnAuthorizedError } from "../utils/errorHandler.js";

/**
 * Auth for the outbound template->SAP sync feed.
 *
 * Minda's engineers are not app users, so they don't have a login cookie.
 * They authenticate with a shared API key sent as the `x-api-key` header
 * (or `Authorization: ApiKey <key>`). Fails CLOSED: if SAP_SYNC_API_KEY is
 * not configured, every request is rejected.
 */
export const sapSyncApiKey = (req, _res, next) => {
  const configured = config.SAP_SYNC_API_KEY;
  if (!configured) {
    throw new UnAuthorizedError(
      "Sync feed disabled: SAP_SYNC_API_KEY is not configured on the server",
      "sapSyncApiKey() middleware"
    );
  }

  const headerKey =
    req.headers["x-api-key"] ||
    (req.headers.authorization?.startsWith("ApiKey ")
      ? req.headers.authorization.slice("ApiKey ".length).trim()
      : null);

  if (!headerKey || headerKey !== configured) {
    throw new UnAuthorizedError(
      "Invalid or missing API key",
      "sapSyncApiKey() middleware"
    );
  }

  next();
};
