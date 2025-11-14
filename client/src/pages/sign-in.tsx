import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setSessionUser } from "@/lib/auth/session";
import { useLocalSession } from "@/hooks/useLocalSession";
import {
  DEMO_PASSWORD,
  DEMO_USERNAME,
  validateDemoCredentials,
} from "@/lib/auth/demoCredentials";

export default function SignInPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useLocalSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = useMemo(() => {
    if (typeof window === "undefined") return "/helix-noise-gens";
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("redirect");
    if (candidate && candidate.startsWith("/")) {
      return candidate;
    }
    return "/helix-noise-gens";
  }, []);

  useEffect(() => {
    if (user) {
      setLocation(redirectTarget);
    }
  }, [redirectTarget, setLocation, user]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = validateDemoCredentials(username, password);
    if (session) {
      setSessionUser(session);
      toast({
        title: "Signed in",
        description: "Demo access granted. You can now upload originals.",
      });
      setLocation(redirectTarget);
      return;
    }
    setError(`Invalid credentials. Use ${DEMO_USERNAME}/${DEMO_PASSWORD} for the demo account.`);
    toast({
      title: "Sign in failed",
      description: `Use ${DEMO_USERNAME}/${DEMO_PASSWORD} for the demo account.`,
      variant: "destructive",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_25px_80px_-40px_rgba(56,189,248,0.7)]">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-sky-300">Helix Bridge</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Sign in to continue</h1>
          <p className="mt-1 text-sm text-slate-400">
            Use the demo credentials{" "}
            <span className="font-semibold text-slate-200">
              {DEMO_USERNAME}/{DEMO_PASSWORD}
            </span>{" "}
            to enable uploads while the real auth flow is under construction.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="demo-username">Username</Label>
            <Input
              id="demo-username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              placeholder={DEMO_USERNAME}
              className="mt-1 bg-slate-900/60"
              required
            />
          </div>
          <div>
            <Label htmlFor="demo-password">Password</Label>
            <Input
              id="demo-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              placeholder={DEMO_PASSWORD}
              className="mt-1 bg-slate-900/60"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" className="w-full">
            Enter Helix
          </Button>
        </form>
      </div>
    </div>
  );
}
