import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("authentication redesign contract", () => {
  it("keeps login and registration wired to the real authentication procedures", () => {
    const page = source("client/src/pages/AuthPage.tsx");

    expect(page).toContain("trpc.auth.login.useMutation");
    expect(page).toContain("trpc.auth.register.useMutation");
    expect(page).toContain("retryAtFromError");
    expect(page).toContain("formatRetryCountdown");
    expect(page).toContain("await refresh()");
    expect(page).toContain('navigate("/account")');
    expect(page).not.toContain("Login with Google");
    expect(page).not.toContain("Login with Apple");
    expect(page).not.toContain("Account created successfully!");
  });

  it("keeps registration intent keyboard-accessible without presenting it as role elevation", () => {
    const components = source("client/src/components/auth/AuthDesign.tsx");

    expect(components).toContain('type="radio"');
    expect(components).toContain('name="registrationIntent"');
    expect(components).toContain("Choosing a seller path does not grant seller access");
    expect(components).not.toContain("SUPER_ADMIN");
  });

  it("keeps recovery and verification bound to their real availability and token procedures", () => {
    const recovery = source("client/src/pages/PasswordRecoveryPage.tsx");

    expect(recovery).toContain("trpc.auth.passwordResetAvailability.useQuery");
    expect(recovery).toContain("trpc.auth.requestPasswordReset.useMutation");
    expect(recovery).toContain("trpc.auth.resetPassword.useMutation");
    expect(recovery).toContain("trpc.auth.verifyEmail.useMutation");
    expect(recovery).toContain("await refresh()");
    expect(recovery).toContain("Your password has been updated");
    expect(recovery).toContain("Password-recovery email is temporarily unavailable.");
    expect(recovery).not.toContain("Resend link");
  });

  it("uses scoped auth styling without restoring a global mood control", () => {
    const styles = source("client/src/components/auth/auth.css");

    expect(styles).toContain("--auth-primary:#00843d");
    expect(styles).toContain("@media(max-width:620px)");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
    expect(styles).not.toContain(".dark{");
    expect(styles).not.toContain("next-themes");
  });
});
