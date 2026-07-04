import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoading = loginStatus === "logging-in";

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background px-6"
      data-ocid="login_page"
    >
      {/* Subtle ambient backdrop — pure monochrome, no glow */}
      <div
        className="absolute inset-0 pointer-events-none bg-muted/30"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo mark */}
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-subtle mb-8"
          aria-hidden="true"
        >
          <div className="w-7 h-7 rounded-lg bg-foreground" />
        </div>

        {/* Wordmark */}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground font-display">
          Aegis Quantum
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Institutional-grade trading intelligence.
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-border my-10" />

        {/* Login card */}
        <div
          className="w-full bg-card border border-border rounded-2xl shadow-elevated p-8 flex flex-col gap-6"
          data-ocid="login_panel"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary">
              <ShieldCheck className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Secure sign-in
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Authenticate with Internet Identity. No passwords, no keys —
              cryptographic proof only.
            </p>
          </div>

          <button
            type="button"
            onClick={() => login()}
            disabled={isLoading}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background font-medium text-sm transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60 disabled:cursor-not-allowed"
            data-ocid="login.internet_identity_button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                Continue with Internet Identity
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Secured by the Internet Computer
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
          By continuing you agree to operate Aegis Quantum for research and
          educational purposes only.
        </p>
      </div>
    </div>
  );
}
