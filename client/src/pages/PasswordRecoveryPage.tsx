import { AuthHeader, AuthInput, AuthLayout, AuthPasswordInput, AuthStatus, AuthSubmitButton, PasswordStrength } from "@/components/auth/AuthDesign";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availability = trpc.auth.passwordResetAvailability.useQuery();
  const request = trpc.auth.requestPasswordReset.useMutation({ onSuccess: data => setSubmitted(data.passwordResetEmailAvailable) });
  const unavailable = availability.data?.passwordResetEmailAvailable === false || request.data?.passwordResetEmailAvailable === false;
  const submit = (event: FormEvent) => { event.preventDefault(); request.mutate({ email: email.trim().toLowerCase() }); };

  return <AuthLayout backHref="/login" backLabel="Back to login"><div className="auth-center-intro"><div className="auth-icon-callout"><KeyRound size={26} /></div><AuthHeader eyebrow="ACCOUNT RECOVERY" title="Reset your password" description="Use your marketplace email to start a secure password reset." /></div>
    {availability.isLoading ? <div className="auth-form"><AuthStatus tone="info" title="Checking password-recovery availability.">Please wait before requesting a reset link.</AuthStatus></div> : null}
    {availability.isError ? <div className="auth-form"><AuthStatus tone="error" title="We could not check password-recovery availability.">Try again before requesting a reset link. Normal-recipient delivery remains subject to the configured provider boundary.</AuthStatus><button className="auth-submit" type="button" onClick={() => availability.refetch()}>Try again</button></div> : null}
    {!availability.isLoading && !availability.isError && unavailable ? <div className="auth-form"><AuthStatus tone="warning" title="Password-recovery email is temporarily unavailable.">ESUT Marketplace cannot currently deliver reset links to ordinary email addresses. Please use the official marketplace support channel for account-recovery assistance.</AuthStatus><Link className="auth-submit" href="/login">Return to login</Link></div> : null}
    {!availability.isLoading && !availability.isError && !unavailable && submitted ? <div className="auth-success"><div className="auth-success__icon"><Mail size={29} /></div><h1>Check your inbox</h1><p>If an account matches this address, a password-reset link has been sent. The link expires after one hour.</p><Link className="auth-submit" href="/login">Return to login</Link></div> : null}
    {!availability.isLoading && !availability.isError && !unavailable && !submitted ? <form className="auth-form" onSubmit={submit}><AuthInput label="Email address" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" icon="email" required /><p className="auth-recovery-copy">For privacy, the same response is shown whether or not an account matches this email.</p>{request.isError ? <AuthStatus tone="error" title="We could not request a reset link.">{request.error.message}</AuthStatus> : null}<AuthSubmitButton pending={request.isPending}>Send reset link</AuthSubmitButton></form> : null}
  </AuthLayout>;
}

export function ResetPasswordPage() {
  const [location] = useLocation();
  const token = new URLSearchParams(location.split("?")[1] ?? "").get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { refresh } = useAuth();
  const reset = trpc.auth.resetPassword.useMutation({ onSuccess: async () => { await refresh(); setCompleted(true); }, onError: failure => setError(failure.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(null); if (password.length < 10) return setError("Choose a password with at least 10 characters."); if (password !== confirm) return setError("Passwords do not match."); reset.mutate({ token, password }); };

  return <AuthLayout backHref="/login" backLabel="Back to login"><div className="auth-center-intro"><div className="auth-icon-callout"><ShieldCheck size={27} /></div><AuthHeader eyebrow="PASSWORD SECURITY" title="Choose a new password" description="Use a password of at least 10 characters. Reset links expire after one hour." /></div>
    {!token ? <div className="auth-form"><AuthStatus tone="error" title="This reset link is incomplete.">The required reset token is missing. Request a new link from the login screen.</AuthStatus><Link className="auth-submit" href="/forgot-password">Request a reset link</Link></div> : completed ? <div className="auth-success"><div className="auth-success__icon"><CheckCircle2 size={30} /></div><h1>Your password has been updated</h1><p>You are signed in with your newly secured password.</p><Link className="auth-submit" href="/account">Continue to ESUT Marketplace</Link></div> : <form className="auth-form" onSubmit={submit}><AuthPasswordInput label="New password" autoComplete="new-password" value={password} onChange={event => { setPassword(event.target.value); setError(null); }} placeholder="At least 10 characters" required /><PasswordStrength password={password} /><AuthPasswordInput label="Confirm new password" autoComplete="new-password" value={confirm} onChange={event => { setConfirm(event.target.value); setError(null); }} placeholder="Re-enter your new password" required />{error ? <AuthStatus tone="error" title="We could not reset your password.">{error}</AuthStatus> : null}<AuthSubmitButton pending={reset.isPending}>Reset password</AuthSubmitButton></form>}
  </AuthLayout>;
}

export function VerifyEmailPage() {
  const [location] = useLocation();
  const token = new URLSearchParams(location.split("?")[1] ?? "").get("token") ?? "";
  const verify = trpc.auth.verifyEmail.useMutation();
  useEffect(() => { if (token && !verify.isPending && !verify.isSuccess) verify.mutate({ token }); }, [token]);
  const title = !token ? "Verification link unavailable" : verify.isPending ? "Verifying your email" : verify.isSuccess ? "Your email is verified" : "This verification link is invalid or expired";
  const description = !token ? "A verification link requires a valid token." : verify.isPending ? "Please wait while we confirm this secure token." : verify.isSuccess ? "Your email has been verified. You can continue to your marketplace account." : "Request a new verification link after email delivery has been enabled for ordinary marketplace recipients.";
  return <AuthLayout backHref="/login" backLabel="Back to login"><div className="auth-success"><div className="auth-success__icon">{verify.isSuccess ? <CheckCircle2 size={30} /> : <ShieldCheck size={30} />}</div><h1>{title}</h1><p>{description}</p>{verify.isPending ? null : <Link className="auth-submit" href={verify.isSuccess ? "/account" : "/login"}>{verify.isSuccess ? "Open my account" : "Return to login"}</Link>}</div></AuthLayout>;
}
