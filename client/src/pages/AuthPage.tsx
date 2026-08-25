import { useAuth } from "@/_core/hooks/useAuth";
import {
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthModeNav,
  AuthPasswordInput,
  AuthStatus,
  AuthSubmitButton,
  PasswordStrength,
  RegistrationIntentGroup,
  type RegistrationIntent,
} from "@/components/auth/AuthDesign";
import { formatRetryCountdown, retryAtFromError, secondsUntilRetry } from "@/lib/lockoutCountdown";
import { trpc } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const nigerianPhonePattern = /^(?:0|\+?234)[7-9]\d{9}$/;
const compactPhone = (value: string) => value.trim().replace(/[\s()-]/g, "");
type FieldErrors = Partial<Record<"firstName" | "lastName" | "phone" | "email" | "password" | "confirmPassword", string>>;

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { isAuthenticated, user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const isRegister = mode === "register";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationIntent, setRegistrationIntent] = useState<RegistrationIntent>("BUYER");
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const remainingSeconds = secondsUntilRetry(retryAt, now);
  const isLocked = !isRegister && remainingSeconds > 0;

  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  useEffect(() => {
    if (retryAt && remainingSeconds === 0) setRetryAt(null);
  }, [retryAt, remainingSeconds]);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setRetryAt(null);
      setSubmitError(null);
      await refresh();
      navigate("/account");
    },
    onError: error => {
      const lockedUntil = retryAtFromError(error);
      if (lockedUntil) {
        setNow(Date.now());
        setRetryAt(lockedUntil);
        setSubmitError(null);
        return;
      }
      setSubmitError(error.message || "We could not sign you in. Check your details and try again.");
    },
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setSubmitError(null);
      await refresh();
      navigate("/account");
    },
    onError: error => setSubmitError(error.message || "We could not create your account. Please try again."),
  });

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) errors.email = "Enter a valid email address, for example name@example.com.";
    if (!password) errors.password = "Enter your password to continue.";
    if (!isRegister) return errors;
    if (firstName.trim().length < 2) errors.firstName = "Enter your first name.";
    if (lastName.trim().length < 2) errors.lastName = "Enter your last name.";
    if (!nigerianPhonePattern.test(compactPhone(phone))) errors.phone = "Enter a valid Nigerian mobile number.";
    if (password.length < 10) errors.password = "Choose a password with at least 10 characters.";
    if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    return errors;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;
    setSubmitError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const cleanEmail = email.trim().toLowerCase();
    if (isRegister) register.mutate({ firstName: firstName.trim(), lastName: lastName.trim(), phone: compactPhone(phone), email: cleanEmail, password, registrationIntent });
    else login.mutate({ email: cleanEmail, password });
  };

  const update = <Key extends keyof FieldErrors>(key: Key, setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (fieldErrors[key]) setFieldErrors(current => ({ ...current, [key]: undefined }));
    if (submitError) setSubmitError(null);
  };

  if (loading) return <AuthLayout><div className="auth-success"><div className="auth-success__icon"><CheckCircle2 size={28} /></div><h1>Checking your account</h1><p>We are confirming your secure marketplace session.</p></div></AuthLayout>;
  if (isAuthenticated) return <AuthLayout><div className="auth-success"><div className="auth-success__icon"><CheckCircle2 size={30} /></div><h1>You are already signed in</h1><p>Welcome back, {user?.name ?? "ESUT Marketplace member"}. Your account is ready.</p><Link className="auth-submit" href="/account">Open my account</Link></div></AuthLayout>;

  const pending = login.isPending || register.isPending;
  return <AuthLayout>
    <AuthHeader eyebrow={isRegister ? "CREATE YOUR MARKETPLACE ACCOUNT" : "WELCOME BACK"} title={isRegister ? "Join the ESUT marketplace" : "Sign in to your marketplace"} description={isRegister ? "Shop immediately from one account. Seller tools unlock only after verification, store approval, and server-side authorization." : "Use your ESUT Marketplace email and password to continue securely."} />
    <AuthModeNav mode={mode} />
    {isLocked ? <div className="auth-form"><AuthStatus tone="warning" title="Login is temporarily locked for your security.">Try again in <strong className="tabular-nums">{formatRetryCountdown(remainingSeconds)}</strong>. We will re-enable the form automatically.</AuthStatus></div> : null}
    {submitError ? <div className="auth-form"><AuthStatus tone="error" title={isRegister ? "We could not create your account." : "We could not sign you in."}>{submitError}</AuthStatus></div> : null}
    <form className={`auth-form${isRegister ? " auth-form--register" : ""}`} noValidate onSubmit={submit}>
      {isRegister ? <><div className="auth-grid-two"><AuthInput label="First name" autoComplete="given-name" value={firstName} onChange={event => update("firstName", setFirstName)(event.target.value)} placeholder="Your first name" icon="name" error={fieldErrors.firstName} /><AuthInput label="Last name" autoComplete="family-name" value={lastName} onChange={event => update("lastName", setLastName)(event.target.value)} placeholder="Your last name" icon="name" error={fieldErrors.lastName} /></div><RegistrationIntentGroup value={registrationIntent} onChange={setRegistrationIntent} /></> : null}
      <AuthInput label="Email address" type="email" autoComplete="email" inputMode="email" value={email} onChange={event => update("email", setEmail)(event.target.value)} placeholder="name@example.com" icon="email" error={fieldErrors.email} disabled={isLocked} />
      {isRegister ? <AuthInput label="Nigerian mobile number" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={event => update("phone", setPhone)(event.target.value)} placeholder="0911 699 1082 or +234 911 699 1082" icon="phone" error={fieldErrors.phone} hint="Spaces and hyphens are accepted." /> : null}
      <AuthPasswordInput label="Password" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={event => update("password", setPassword)(event.target.value)} placeholder={isRegister ? "At least 10 characters" : "Enter your password"} error={fieldErrors.password} disabled={isLocked} />
      {isRegister ? <PasswordStrength password={password} /> : null}
      {isRegister ? <AuthPasswordInput label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={event => update("confirmPassword", setConfirmPassword)(event.target.value)} placeholder="Re-enter your password" error={fieldErrors.confirmPassword} /> : null}
      {!isRegister ? <div className="auth-form-row"><span /><Link href="/forgot-password">Forgot password?</Link></div> : <p className="auth-legal">By creating an account, you agree to the ESUT Marketplace <Link href="/terms" className="font-bold underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="font-bold underline underline-offset-2">Privacy Policy</Link>. Seller verification is required before selling tools unlock.</p>}
      <AuthSubmitButton pending={pending} disabled={isLocked}>{isLocked ? `Try again in ${formatRetryCountdown(remainingSeconds)}` : isRegister ? "Create account" : "Log in"}</AuthSubmitButton>
    </form>
    <AuthFooter mode={mode} />
  </AuthLayout>;
}
