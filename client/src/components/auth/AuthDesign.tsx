import { ESUT_MARKETPLACE_LOGO_PATH } from "@/lib/brandAssets";
import { Check, ChevronLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Store, UserRound } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode, useId, useState } from "react";
import { Link } from "wouter";

type AuthLayoutProps = { children: ReactNode; backHref?: string; backLabel?: string };

export function AuthLayout({ children, backHref = "/", backLabel = "Back to marketplace" }: AuthLayoutProps) {
  return <main className="auth-page-shell"><section className="auth-frame" aria-label="ESUT Marketplace account access"><aside className="auth-brand-panel" aria-label="About ESUT Marketplace"><div className="auth-brand-orb auth-brand-orb--one" /><div className="auth-brand-orb auth-brand-orb--two" /><div className="auth-brand-panel__content"><BrandIdentity inverted /><div className="auth-brand-panel__copy"><p className="auth-brand-panel__eyebrow">ESUT CAMPUS MARKETPLACE</p><h1>Shop. Sell. Connect.</h1><p>Discover goods from trusted sellers, manage every order, and grow a verified store from one account.</p></div><ul className="auth-brand-panel__points" aria-label="Marketplace account benefits"><li><Check size={15} aria-hidden="true" /> Verified seller workflow</li><li><Check size={15} aria-hidden="true" /> Private marketplace messaging</li><li><Check size={15} aria-hidden="true" /> Campus-pickup commerce</li></ul></div></aside><div className="auth-form-panel"><Link href={backHref} className="auth-back-link"><ChevronLeft size={18} aria-hidden="true" />{backLabel}</Link><div className="auth-mobile-identity"><BrandIdentity /></div>{children}</div></section></main>;
}

export function BrandIdentity({ inverted = false }: { inverted?: boolean }) {
  return <div className={`auth-identity${inverted ? " auth-identity--inverted" : ""}`}><span className="auth-identity__mark"><img src={ESUT_MARKETPLACE_LOGO_PATH} alt="" /></span><span><strong>ESUT Marketplace</strong><small>Campus commerce</small></span></div>;
}

export function AuthHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <header className="auth-header">{eyebrow ? <p className="auth-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{description}</p></header>;
}

export function AuthModeNav({ mode }: { mode: "login" | "register" }) {
  return <nav className="auth-mode-nav" aria-label="Account access options"><Link className={mode === "login" ? "is-active" : ""} href="/login" aria-current={mode === "login" ? "page" : undefined}>Log in</Link><Link className={mode === "register" ? "is-active" : ""} href="/register" aria-current={mode === "register" ? "page" : undefined}>Create account</Link></nav>;
}

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & { label: string; error?: string; hint?: string; icon?: "email" | "phone" | "name" };

export function AuthInput({ label, error, hint, icon, id, ...inputProps }: AuthInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const Icon = icon === "email" ? Mail : icon === "phone" ? ShoppingBag : icon === "name" ? UserRound : undefined;
  return <div className="auth-field"><label htmlFor={inputId}>{label}</label><div className={`auth-field__input${error ? " has-error" : ""}`}>{Icon ? <Icon size={18} aria-hidden="true" /> : null}<input id={inputId} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...inputProps} /></div>{error ? <p className="auth-field__error" id={descriptionId} role="alert">{error}</p> : hint ? <p className="auth-field__hint" id={descriptionId}>{hint}</p> : null}</div>;
}

export function AuthPasswordInput({ label, error, hint, id, ...inputProps }: Omit<AuthInputProps, "icon" | "type">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return <div className="auth-field"><label htmlFor={inputId}>{label}</label><div className={`auth-field__input${error ? " has-error" : ""}`}><LockKeyhole size={18} aria-hidden="true" /><input id={inputId} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...inputProps} /><button type="button" className="auth-field__visibility" onClick={() => setVisible(value => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button></div>{error ? <p className="auth-field__error" id={descriptionId} role="alert">{error}</p> : hint ? <p className="auth-field__hint" id={descriptionId}>{hint}</p> : null}</div>;
}

export function AuthStatus({ tone = "error", title, children }: { tone?: "error" | "warning" | "success" | "info"; title: string; children?: ReactNode }) {
  return <section className={`auth-status auth-status--${tone}`} role={tone === "error" ? "alert" : "status"} aria-live="polite"><ShieldCheck size={18} aria-hidden="true" /><div><strong>{title}</strong>{children ? <p>{children}</p> : null}</div></section>;
}

export function AuthSubmitButton({ children, pending = false, disabled = false }: { children: ReactNode; pending?: boolean; disabled?: boolean }) {
  return <button className="auth-submit" type="submit" disabled={disabled || pending}>{pending ? "Please wait…" : children}</button>;
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 10, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Getting started" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return <div className="auth-strength" aria-live="polite"><div aria-hidden="true">{[0, 1, 2, 3].map(segment => <i key={segment} className={segment < score ? `is-active strength-${score}` : ""} />)}</div><p>Password readiness: <strong>{label}</strong>. Use at least 10 characters.</p></div>;
}

export type RegistrationIntent = "BUYER" | "INDIVIDUAL_SELLER" | "BUSINESS_VENDOR";
const intentOptions: Array<{ value: RegistrationIntent; title: string; description: string; icon: typeof ShoppingBag }> = [
  { value: "BUYER", title: "A Buyer", description: "Shop products, save favourites, message sellers, and place orders.", icon: ShoppingBag },
  { value: "INDIVIDUAL_SELLER", title: "An Individual Seller", description: "Sell personally after verification and administrator approval.", icon: UserRound },
  { value: "BUSINESS_VENDOR", title: "A Business Vendor", description: "Sell as a registered business after verification and approval.", icon: Store },
];

export function RegistrationIntentGroup({ value, onChange }: { value: RegistrationIntent; onChange: (value: RegistrationIntent) => void }) {
  return <fieldset className="auth-intents"><legend>I am registering as</legend><p>Every account can shop. Choosing a seller path does not grant seller access.</p><div className="auth-intents__grid">{intentOptions.map(option => { const Icon = option.icon; return <label className="auth-intent" key={option.value}><input type="radio" name="registrationIntent" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span className="auth-intent__card"><Icon size={20} aria-hidden="true" /><strong>{option.title}</strong><small>{option.description}</small><i aria-hidden="true"><Check size={14} /></i></span></label>; })}</div></fieldset>;
}

export function AuthFooter({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  return <p className="auth-footer">{isLogin ? "New to ESUT Marketplace?" : "Already have an account?"} <Link href={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link></p>;
}
