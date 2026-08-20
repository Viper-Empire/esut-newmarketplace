import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRetryCountdown, retryAtFromError, secondsUntilRetry } from "@/lib/lockoutCountdown";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const logo = "/manus-storage/esut-main-logo_0f99c6ab.png";
type RegistrationIntent = "BUYER" | "INDIVIDUAL_SELLER" | "BUSINESS_VENDOR";

const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const nigerianPhonePattern = /^(?:0|\+?234)[7-9]\d{9}$/;
const compactPhone = (value: string) => value.trim().replace(/[\s()-]/g, "");

function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#eef8ff] px-4 py-10 sm:py-14"><section className="mx-auto w-full max-w-[600px] rounded-[28px] bg-white px-7 py-8 shadow-[0_24px_60px_rgba(29,78,216,.12)] ring-1 ring-slate-100 sm:px-14 sm:py-11"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#00843d]"><ArrowLeft size={20} />Back to marketplace</Link><div className="mt-5 flex justify-center"><img src={logo} alt="ESUT Marketplace" className="h-14 w-14 object-contain" /></div>{children}</section></main>;
}

function PasswordInput({ value, onChange, id, label, placeholder, minLength }: { value: string; onChange: (value: string) => void; id: string; label: string; placeholder: string; minLength: number }) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 text-slate-400" size={18} /><Input id={id} required minLength={minLength} type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-12 pl-10 pr-11" /><button type="button" onClick={() => setVisible(previous => !previous)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-3 rounded text-slate-400 hover:text-slate-700">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>;
}

const intentOptions: Array<{ value: RegistrationIntent; title: string; description: string; icon: typeof ShoppingBag }> = [
  { value: "BUYER", title: "A Buyer", description: "Shop, save listings, message sellers, and order for campus pickup.", icon: ShoppingBag },
  { value: "INDIVIDUAL_SELLER", title: "An Individual Seller", description: "Shop now; identity verification and approval are required before selling.", icon: UserRound },
  { value: "BUSINESS_VENDOR", title: "A Business Vendor", description: "Shop now; business verification and store approval are required before selling.", icon: Building2 },
];

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { isAuthenticated, user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationIntent, setRegistrationIntent] = useState<RegistrationIntent>("BUYER");
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const isRegister = mode === "register";
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
      await refresh();
      toast.success("Welcome back to ESUT Marketplace.");
      navigate("/account");
    },
    onError: error => {
      const lockedUntil = retryAtFromError(error);
      if (lockedUntil) {
        setNow(Date.now());
        setRetryAt(lockedUntil);
        toast.error("For your security, login is temporarily locked. Please wait for the countdown to finish.");
        return;
      }
      toast.error(error.message);
    },
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Account created. You can now use ESUT Marketplace.");
      navigate("/account");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) return toast.error("Enter a valid email address, for example name@example.com.");
    if (!password) return toast.error("Enter your password to continue.");

    if (!isRegister) {
      login.mutate({ email: cleanEmail, password });
      return;
    }

    if (!nigerianPhonePattern.test(compactPhone(phone))) return toast.error("Enter a valid Nigerian mobile number, for example 0911 699 1082 or +234 911 699 1082.");
    if (password.length < 10) return toast.error("Choose a password with at least 10 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    register.mutate({ firstName, lastName, phone, email: cleanEmail, password, registrationIntent });
  };

  if (loading) return <AuthShell><p className="py-16 text-center text-slate-500">Checking your account…</p></AuthShell>;
  if (isAuthenticated) return <AuthShell><div className="py-12 text-center"><ShieldCheck className="mx-auto text-[#00843d]" size={44} /><h1 className="mt-5 text-3xl font-extrabold">You are already signed in</h1><p className="mt-3 text-slate-600">Welcome back, {user?.name ?? "ESUT Marketplace member"}.</p><Link href="/account"><Button className="mt-7 bg-[#00843d] hover:bg-[#006b32]">Open my account</Button></Link></div></AuthShell>;

  return <AuthShell>
    <div className="mt-5 text-center"><h1 className="text-3xl font-extrabold text-[#0f172a]">{isRegister ? "Create your account" : "Log into your account"}</h1><p className="mx-auto mt-3 max-w-md text-slate-500">{isRegister ? "Choose your registration intent. Every account can shop; seller verification and approval are required before selling tools unlock." : "Use your ESUT Marketplace email and password to continue."}</p></div>
    {isLocked && <div role="status" aria-live="polite" className="mt-6 rounded-2xl border border-[#f5b700]/40 bg-[#fff8e8] p-4 text-center text-[#765b10]"><p className="font-black">Login is temporarily locked for your security.</p><p className="mt-1 text-sm">Try again in <span className="font-black tabular-nums">{formatRetryCountdown(remainingSeconds)}</span>.</p></div>}
    <form onSubmit={submit} className="mt-9 space-y-5" noValidate>
      {isRegister && <><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" required value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="First name" className="h-12" /></div><div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" required value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Last name" className="h-12" /></div></div><fieldset><legend className="text-sm font-bold text-slate-800">I am registering as</legend><div className="mt-2 grid gap-3 sm:grid-cols-3">{intentOptions.map(option => { const Icon = option.icon; const selected = registrationIntent === option.value; return <button type="button" key={option.value} onClick={() => setRegistrationIntent(option.value)} aria-pressed={selected} className={`rounded-xl border p-4 text-left transition ${selected ? "border-[#00843d] bg-emerald-50 ring-1 ring-[#00843d]" : "border-slate-200 hover:border-slate-300"}`}><Icon className="text-[#00843d]" size={20} /><strong className="mt-2 block">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span></button>; })}</div></fieldset></>}
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} /><Input id="email" required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 pl-10" disabled={isLocked} /></div></div>
      {isRegister && <div className="space-y-2"><Label htmlFor="phone">Phone number</Label><Input id="phone" required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="0911 699 1082 or +234 911 699 1082" className="h-12" /><p className="text-xs text-slate-500">Use a Nigerian mobile number. Spaces and hyphens are accepted.</p></div>}
      <PasswordInput id="password" label="Password" value={password} onChange={setPassword} minLength={isRegister ? 10 : 1} placeholder={isRegister ? "At least 10 characters" : "Enter your password"} />
      {isRegister && <PasswordInput id="confirmPassword" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} minLength={10} placeholder="Re-enter your password" />}
      {!isRegister && <Link href="/forgot-password" className="block text-right text-sm font-bold text-[#00843d] hover:underline">Forgot password?</Link>}
      {isRegister && <p className="text-xs leading-5 text-slate-500">By creating an account, you agree to the ESUT Marketplace Terms and Privacy Policy. Seller verification is required before any selling tools are unlocked.</p>}
      <Button type="submit" disabled={login.isPending || register.isPending || isLocked} className="h-12 w-full bg-[#e31b23] text-base hover:bg-[#c9161d]">{login.isPending || register.isPending ? "Please wait…" : isLocked ? `Try again in ${formatRetryCountdown(remainingSeconds)}` : isRegister ? "Create account" : "Log in"}</Button>
    </form>
    <p className="mt-8 text-center text-sm text-slate-600">{isRegister ? "Already have an account?" : "Don't have an account?"} <Link href={isRegister ? "/login" : "/register"} className="font-bold text-[#00843d] hover:underline">{isRegister ? "Log in" : "Create account"}</Link></p>
  </AuthShell>;
}
