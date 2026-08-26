import React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

const DEFAULT_RETURN_TO =
  "/desktop?panels=account-session&focus=account-session";

export const auth0AccountStartHref = (returnTo = DEFAULT_RETURN_TO): string =>
  `/api/auth/auth0/start?return_to=${encodeURIComponent(returnTo)}`;

export function Auth0SignInButton({
  returnTo = DEFAULT_RETURN_TO,
}: {
  returnTo?: string;
}) {
  const outcome =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("auth0_account");
  const error = outcome && outcome !== "linked" ? outcome : null;

  return (
    <div className="space-y-2">
      <a
        href={auth0AccountStartHref(returnTo)}
        className="inline-flex items-center gap-2 rounded border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-400/20"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Sign in with Auth0
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <p className="text-[11px] leading-4 text-slate-500">
        Uses public-client PKCE and an HttpOnly CasimirBot session. OAuth tokens
        are exchanged and verified by the server and are not returned to this
        page or an AI client.
      </p>
      {outcome === "linked" ? (
        <p className="text-xs text-emerald-300" role="status">
          Auth0 profile session connected.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          Auth0 profile sign-in did not complete ({error.replaceAll("_", " ")}).
        </p>
      ) : null}
    </div>
  );
}

export default Auth0SignInButton;
