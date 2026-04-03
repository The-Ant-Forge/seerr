# React 19 + Next.js 16 Upgrade Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade React 18→19 and Next.js 14→16 while staying on the Pages Router (no App Router migration).

**Architecture:** Seerr uses Next.js Pages Router exclusively (no `app/` directory). The upgrade keeps Pages Router — Next.js 16 still supports it. The main work is: removing deprecated `forwardRef` wrappers (React 19), removing `legacyBehavior`/`passHref` from Link components (Next.js), and updating package versions. No routing architecture changes.

**Tech Stack:** React 19, Next.js 16, TypeScript 6, Pages Router, SWR, react-intl 10

**Key Decision: Pages Router stays.** Migrating to App Router would touch 57+ files using `next/router`, rewrite `_app.tsx` auth logic, and convert `getServerSideProps` pages — all for no user-visible benefit. Next.js 16 fully supports Pages Router.

---

## Pre-Flight Checklist

Before starting, verify these are already done (from prior sessions):
- [x] TypeScript upgraded to 6.0.2
- [x] react-intl upgraded to 10.1.1
- [x] eslint-config-next at 15.5.12 (will upgrade to 16.x)
- [x] @types/react at 18.3.27, @types/react-dom at 18.3.0

## File Map

**Package changes:**
- Modify: `package.json` — version bumps
- Modify: `pnpm-lock.yaml` — regenerated

**Config changes:**
- Modify: `next.config.js` — remove deprecated experimental flags
- Modify: `tsconfig.json` — no changes expected (Pages Router compatible)

**React 19 forwardRef removal (7 components):**
- Modify: `src/components/Common/Badge/index.tsx`
- Modify: `src/components/Common/Button/index.tsx`
- Modify: `src/components/Common/ConfirmButton/index.tsx`
- Modify: `src/components/Common/ImageFader/index.tsx`
- Modify: `src/components/Common/Modal/index.tsx`
- Modify: `src/components/Layout/UserDropdown/index.tsx`
- Modify: `src/components/BlocklistedTagsSelector/index.tsx`

**Next.js Link cleanup (7 files, 9 instances):**
- Modify: `src/components/IssueBlock/index.tsx`
- Modify: `src/components/IssueList/IssueItem/index.tsx`
- Modify: `src/components/IssueModal/CreateIssueModal/index.tsx`
- Modify: `src/components/ResetPassword/index.tsx`
- Modify: `src/components/ResetPassword/RequestResetLink.tsx`
- Modify: `src/components/UserProfile/ProfileHeader/index.tsx`
- Modify: `src/components/Settings/Notifications/NotificationsWebhook/index.tsx`

---

### Task 1: Remove forwardRef from Badge

**Files:**
- Modify: `src/components/Common/Badge/index.tsx:114`

- [ ] **Step 1: Change the export to remove forwardRef wrapper**

Replace:
```tsx
export default React.forwardRef(Badge) as typeof Badge;
```
With:
```tsx
export default Badge;
```

And add `ref` to the function signature as a regular prop. Find the Badge function definition and add `ref?: React.Ref<HTMLSpanElement>` to its props. Remove the `ForwardedRef` import if present.

- [ ] **Step 2: Build to verify no type errors**

Run: `pnpm build:next 2>&1 | grep -i error | grep -v opt-out`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Common/Badge/index.tsx
```

---

### Task 2: Remove forwardRef from Button

**Files:**
- Modify: `src/components/Common/Button/index.tsx:1,38,47,103,113,121`

- [ ] **Step 1: Update function signature**

The Button component already accepts `ref?: React.Ref<Element<P>>` as a second parameter (line 47). In React 19, ref is a regular prop. Move it into the props destructuring:

Replace:
```tsx
function Button<P extends ElementTypes = 'button'>(
  {
    buttonType = 'default',
    buttonSize = 'default',
    as,
    children,
    className,
    ...props
  }: ButtonProps<P>,
  ref?: React.Ref<Element<P>>
): JSX.Element {
```
With:
```tsx
function Button<P extends ElementTypes = 'button'>({
  buttonType = 'default',
  buttonSize = 'default',
  as,
  children,
  className,
  ref,
  ...props
}: ButtonProps<P> & { ref?: React.Ref<Element<P>> }): JSX.Element {
```

- [ ] **Step 2: Remove forwardRef export wrapper**

Replace:
```tsx
export default React.forwardRef(Button) as typeof Button;
```
With:
```tsx
export default Button;
```

- [ ] **Step 3: Remove unused ForwardedRef import**

Remove:
```tsx
import type { ForwardedRef } from 'react';
```

And update ref casts in the JSX from `ref={ref as ForwardedRef<HTMLAnchorElement>}` to `ref={ref as React.Ref<HTMLAnchorElement>}`.

- [ ] **Step 4: Build to verify**

Run: `pnpm build:next 2>&1 | grep -i error | grep -v opt-out`

---

### Task 3: Remove forwardRef from ConfirmButton, ImageFader, Modal

**Files:**
- Modify: `src/components/Common/ConfirmButton/index.tsx`
- Modify: `src/components/Common/ImageFader/index.tsx`
- Modify: `src/components/Common/Modal/index.tsx`

- [ ] **Step 1: ConfirmButton** — Move ref from forwardRef second arg into props. Remove `forwardRef<HTMLButtonElement, ConfirmButtonProps>(` wrapper.

- [ ] **Step 2: ImageFader** — Change from `ForwardRefRenderFunction` type to regular function. Remove `React.forwardRef<HTMLDivElement, ImageFaderProps>(ImageFader)` export.

- [ ] **Step 3: Modal** — Remove `React.forwardRef<HTMLDivElement, ModalProps>(` wrapper. Add ref to props.

- [ ] **Step 4: Build to verify**

Run: `pnpm build:next 2>&1 | grep -i error | grep -v opt-out`

---

### Task 4: Remove forwardRef from UserDropdown and BlocklistedTagsSelector

**Files:**
- Modify: `src/components/Layout/UserDropdown/index.tsx`
- Modify: `src/components/BlocklistedTagsSelector/index.tsx`

- [ ] **Step 1: UserDropdown** — Remove forwardRef from the `ForwardedLink` component inside UserDropdown.

- [ ] **Step 2: BlocklistedTagsSelector** — This component uses `useImperativeHandle(ref, ...)` to expose methods. In React 19, `useImperativeHandle` still works — just pass ref as a regular prop instead of through forwardRef.

- [ ] **Step 3: Build to verify**

Run: `pnpm build:next 2>&1 | grep -i error | grep -v opt-out`

- [ ] **Step 4: Run unit tests**

Run: `pnpm test`
Expected: All 275 tests pass

- [ ] **Step 5: Commit all forwardRef removals**

```bash
git add src/components/Common/Badge/ src/components/Common/Button/ \
  src/components/Common/ConfirmButton/ src/components/Common/ImageFader/ \
  src/components/Common/Modal/ src/components/Layout/UserDropdown/ \
  src/components/BlocklistedTagsSelector/
HUSKY=0 git commit -m "refactor: remove forwardRef wrappers for React 19 compatibility

React 19 passes ref as a regular prop, making forwardRef unnecessary.
Move ref into component props for all 7 affected components."
```

---

### Task 5: Remove legacyBehavior and passHref from Link components

**Files (7 files, 9 instances):**
- Modify: `src/components/IssueBlock/index.tsx:66`
- Modify: `src/components/IssueList/IssueItem/index.tsx:306`
- Modify: `src/components/IssueModal/CreateIssueModal/index.tsx:122`
- Modify: `src/components/ResetPassword/index.tsx:88`
- Modify: `src/components/ResetPassword/RequestResetLink.tsx:78`
- Modify: `src/components/UserProfile/ProfileHeader/index.tsx:95,109`
- Modify: `src/components/Settings/Notifications/NotificationsWebhook/index.tsx:370,538`

- [ ] **Step 1: Transform each Link**

The pattern is always:
```tsx
{/* OLD */}
<Link href="/path" passHref legacyBehavior>
  <Button as="a">Click</Button>
</Link>

{/* NEW — Link renders its own <a>, wrap children directly */}
<Link href="/path">
  <Button>Click</Button>
</Link>
```

Key changes:
- Remove `passHref` and `legacyBehavior` props
- Remove `as="a"` from Button children (Link now handles the anchor)
- If the child is a raw `<a>` tag, remove it entirely — Link renders its own

- [ ] **Step 2: Build to verify**

Run: `pnpm build:next 2>&1 | grep -i error | grep -v opt-out`

- [ ] **Step 3: Commit**

```bash
git add src/components/IssueBlock/ src/components/IssueList/ \
  src/components/IssueModal/ src/components/ResetPassword/ \
  src/components/UserProfile/ src/components/Settings/Notifications/
HUSKY=0 git commit -m "refactor: remove legacyBehavior/passHref from Link components

Next.js 13+ Link component renders its own anchor element.
Remove deprecated legacyBehavior and passHref props from 9 instances."
```

---

### Task 6: Update next.config.js

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Review experimental flags**

`scrollRestoration` became stable in Next.js 15. `largePageDataBytes` may need review. Update:

```js
module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
  },
  images: {
    remotePatterns: [
      { hostname: 'gravatar.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'artworks.thetvdb.com' },
      { hostname: 'plex.tv' },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  experimental: {
    largePageDataBytes: 512 * 1000,
  },
};
```

Move `scrollRestoration` out of experimental if Next.js 16 supports it at the top level, or remove if it's now default behaviour.

- [ ] **Step 2: Commit**

---

### Task 7: Upgrade packages

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install new versions**

```bash
pnpm add react@19 react-dom@19 next@16
pnpm add -D @types/react@19 @types/react-dom@19 eslint-config-next@16
```

- [ ] **Step 2: Full build**

```bash
pnpm build
```

Fix any type errors that surface. Common issues:
- `ReactNode` type changes (React 19 narrows some types)
- `children` prop no longer implicit in `FC` (already not used in this codebase)
- `useRef<T>(null)` may need `useRef<T | null>(null)` for stricter typing

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
HUSKY=0 git commit -m "chore(deps): upgrade React 18→19 + Next.js 14→16

- react, react-dom 18.3.1 → 19.x
- next 14.2.35 → 16.x
- @types/react 18.3.27 → 19.x
- @types/react-dom 18.3.0 → 19.x
- eslint-config-next 15.5.12 → 16.x"
```

---

### Task 8: Deploy and smoke test

- [ ] **Step 1: Deploy**

```bash
taskkill.exe //F //PID <current_pid>
bash deploy.sh
cd D:/Apps/Seerr && PORT=3819 NODE_ENV=production node dist/index.js > /tmp/seerr-console.log 2>&1 &
```

- [ ] **Step 2: Smoke test checklist**

Test these flows in the browser:
- [ ] Sign in with Plex
- [ ] Browse Discover page (images load, sliders work)
- [ ] Open a movie detail page (getServerSideProps still works)
- [ ] Open a TV show detail page
- [ ] Open Issues page (react-markdown rendering)
- [ ] Open Settings → Jobs (cronstrue rendering)
- [ ] Sign out and back in
- [ ] Test on mobile viewport (responsive layout)

- [ ] **Step 3: Check console for React 19 warnings**

Open browser DevTools console. React 19 may emit deprecation warnings for patterns we missed. Fix any that appear.

---

## Out of Scope

These are explicitly NOT part of this upgrade:

- **App Router migration** — Pages Router is fully supported in Next.js 16. Migration would touch 57+ files for no user benefit.
- **next/router → next/navigation** — Only relevant for App Router.
- **next/head → Metadata API** — Only relevant for App Router.
- **Tailwind CSS 3→4** — Separate plan.
- **moduleResolution change** — Separate task (server tsconfig only).
