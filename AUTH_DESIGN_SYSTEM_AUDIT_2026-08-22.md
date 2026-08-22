# ESUT Marketplace Authentication Design-System Audit

## Scope and source handling

This audit reviews the user-supplied `Design systems for ESUT Marketplace.zip` and its prototype application as a **visual reference only**. No source from the ZIP was executed, imported, installed, or copied into the production ESUT Marketplace application during this audit.

The reference is a compact Figma-exported React/Vite prototype consisting of a 69-file Shadcn/Tailwind component set, a single visual authentication application, typography/theme CSS, and two third-party logo assets. Its `guidelines/Guidelines.md` file contains only a generic commented template, not project-specific design rules.

## Reusable visual language

| Pattern | Reference implementation | Recommended ESUT adaptation |
| --- | --- | --- |
| Overall layout | Large rounded split card, editorial brand panel on desktop, single form panel on mobile | Adopt the responsive split-card hierarchy, using the existing ESUT Marketplace logo and truthful campus-commerce language. |
| Form density | 56px fields/buttons, 12px field radii, 20–24px section spacing | Adopt the comfortable field and touch-target sizing for login, registration, password recovery, and reset screens. |
| Typography | Poppins headings; Inter body labels, fields, and supporting text | Adapt only after confirming availability in the existing frontend; preserve legible marketplace text hierarchy. |
| Inputs | Clear labels, visual focus state, inline error icon/copy, password visibility control | Adopt with current real Zod/tRPC field/server errors and accessible live regions. |
| Primary CTA | Full-width, high-contrast action with loading/disabled state potential | Recolour to ESUT green, retain semantic button types and server-confirmed success only. |
| Navigation | Login/signup tab treatment, back link on recovery, contextual supporting text | Use real Wouter routes rather than local screen state; keep accessible route navigation. |
| Responsive behaviour | Decorative brand panel hidden below large desktop breakpoint; compact logo/heading on mobile | Adopt; do not rely on absolute-positioned exported mobile fragments. |
| Motion | Short 200–300ms transitions for focus, hover, and strength bars | Use transform/opacity transitions, respect reduced-motion preferences, and never delay auth actions. |

## Prototype code that cannot be adopted

| Prototype behaviour or content | Why it cannot enter production |
| --- | --- |
| Local `useState` “successful login”, “account created”, and “reset sent” screens | They create false authentication success without server confirmation. |
| Client-only validation that labels a short password “Wrong password” | Credential validity must be determined by the real backend, while local validation should only handle field format/required-state feedback. |
| Apple and Google buttons | The reference contains only brand-logo images and no approved OAuth backend flow. They must not be displayed as working sign-in options. |
| “10K+ Students”, “5K+ Listings”, and “98% Trusted” | These are unverified marketing statistics and must not be published as factual marketplace claims. |
| Static `ESUT Market` name and blue palette | The production brand is **ESUT Marketplace** with the existing green-led commerce identity. |
| Generic “email sent” and resend success copy | Password-recovery email delivery is currently paused; UI must reflect the real backend availability and neutral security response. |
| Absolute-positioned Figma import | It is a static reference fragment, not a responsive production component. |

## Imported assets

The ZIP imports two raster assets: an Apple logo and a Google logo. They were reviewed as third-party sign-in identity assets. They will not be copied or presented in ESUT Marketplace unless the corresponding OAuth providers, consent terms, redirect flow, and server-side verification are separately approved and implemented.

## Initial conclusion

The source offers a strong **layout, spacing, typography, input, and feedback-state foundation**. It does not offer a production authentication implementation. The ESUT redesign should rebuild the visual system around the existing real React/tRPC authentication contract, server-side role controls, session security, lockout feedback, and seller onboarding model.
