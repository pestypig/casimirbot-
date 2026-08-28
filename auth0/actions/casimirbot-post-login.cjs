"use strict";

const MFA_ACR =
  "http://schemas.openid.net/pape/policies/2007/06/multi-factor";
const TENANT_CLAIM = "https://casimirbot.com/tenant_id";
const TENANT_ID = "dev-pfgv4lwpqy3soxoy";
const NATIVE_CLIENT_ID = "fN6cvAYs1yT2RNnVWjFLOKlZT8QMkmGs";

const clean = (value) =>
  typeof value === "string" ? value.trim() : "";

/**
 * Auth0 post-login Action for the CasimirBot native/public client.
 *
 * No factor, token, receipt, recovery code, or provider credential is read or
 * projected by this Action. Auth0 remains the factor authority.
 */
exports.onExecutePostLogin = async (event, api) => {
  api.accessToken.setCustomClaim(TENANT_CLAIM, TENANT_ID);
  const requestedAcrs = Array.isArray(event?.transaction?.acr_values)
    ? event.transaction.acr_values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
    : [];

  if (
    clean(event?.client?.client_id) !== NATIVE_CLIENT_ID ||
    requestedAcrs.length !== 1 ||
    requestedAcrs[0] !== MFA_ACR
  ) {
    return;
  }

  api.multifactor.enable("any", { allowRememberBrowser: false });
};
