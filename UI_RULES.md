# CareQueue Design System & UI Rules

> **MANDATORY DIRECTIVE**: These rules govern all UI development in CareQueue. Every page, component, modal, and view MUST strictly follow these guidelines. Do not invent custom styles, arbitrary color schemes, or deviate from these established standards.

---

## 1. Tech Stack & Dependencies

- **Framework**: React 18+ (Vite)
- **Routing**: `react-router-dom`
- **Styling**: Tailwind CSS
- **Iconography**: `lucide-react`
- **Notifications**: `react-hot-toast`
- **Typography**: Google Font **Inter** (`font-sans`)

---

## 2. Color Palette & Visual Foundations

| Element | Specification | Tailwind Class / Hex |
| :--- | :--- | :--- |
| **Primary Color** | Clinical Teal | `#0d9488` (`brand-600` / `teal-600`) |
| **Primary Hover / Active**| Darker Teal | `#0f766e` (`brand-700`) |
| **Primary Light / Accent**| Subtle Teal Tint | `#f0fdfa` (`brand-50`) / `#ccfbf1` (`brand-100`) |
| **Page Background** | Calm Light Grey | `#f8fafc` (`bg-surface-muted` / `bg-slate-50`) |
| **Card / Surface Background**| Pure White | `#ffffff` (`bg-white`) |
| **Borders** | Subtle Grey | `#e2e8f0` (`border-slate-200`) |
| **Card Corners** | Rounded XL | `rounded-xl` (12px) |
| **Shadows** | Soft, subtle shadows | `shadow-sm` / `shadow-soft` (`0 1px 3px rgba(15,23,42,0.06)`) |
| **Text Hierarchy** | Charcoal & Slate | Headers: `text-slate-900`, Body: `text-slate-600`, Muted: `text-slate-400` |

---

## 3. Strict Status Badge Color Map

All status indicators across appointments, consultations, queues, and invoices **MUST** use these exact color assignments. Never use arbitrary colors for statuses:

| Status Key | Category | Background | Text Color | Border Color | Preview / Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Booked`** | Appointment | `bg-blue-50` | `text-blue-700` | `border-blue-200` | Scheduled future visit |
| **`CheckedIn`** | Queue / Arrival | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Arrived in clinic waiting room |
| **`InConsultation`** | Doctor Active | `bg-purple-50` | `text-purple-700` | `border-purple-200` | Currently with doctor |
| **`Completed`** | Visit Done | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Consultation / discharge complete |
| **`NoShow`** | Attendance | `bg-rose-50` | `text-rose-700` | `border-rose-200` | Patient missed appointment |
| **`Cancelled`** | Cancellation | `bg-slate-100` | `text-slate-600` | `border-slate-200` | Voided / cancelled slot |
| **`Unpaid`** | Billing | `bg-orange-50` | `text-orange-700` | `border-orange-200` | Pending invoice payment |
| **`Paid`** | Billing | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Settled payment |

---

## 4. Token Presentation

Tokens (e.g. queue tickets like `D1-07`, `T-102`, `A-01`) must always stand out clearly:
- Use large, bold pill badges (`TokenBadge` component).
- Large font: `text-sm sm:text-base font-bold tracking-wider font-mono`.
- Pill container: `px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5`.
- Distinct teal/slate healthcare styling with high contrast readability.

---

## 5. Application Shell & Navigation Layout

1. **Left Sidebar**:
   - Branding: Top header with healthcare teal icon and clinic name **CareQueue**.
   - Navigation: Role-based navigation links with consistent Lucide icons.
   - Active link styling: `bg-teal-50 text-teal-700 font-semibold border-r-4 border-teal-600`.
   - Inactive link styling: `text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium`.
   - **Mobile Responsiveness**: Sidebar collapses into a sliding drawer on mobile (`< lg` / `< 1024px`) with a backdrop click-to-dismiss overlay.
2. **Top Bar**:
   - Sticky top bar: `h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between`.
   - Left side: Mobile menu toggle button + current view breadcrumb or search.
   - Right side:
     - **Role Switcher dropdown** (e.g., `Receptionist`, `Doctor`, `Cashier`, `Clinic Admin`).
     - **Today's live date** formatted clearly (e.g. `Mon, 28 Sep 2026`).
     - Status pulse indicator / notification bell / avatar.

---

## 6. Feedback & Interaction Standards

1. **Empty States**:
   - Every list or table without records **MUST** show the `EmptyState` component.
   - Includes a friendly icon (e.g. `CalendarX`, `UserX`, `FolderOpen`), bold title, descriptive subtitle, and optional CTA button.
2. **Loading States**:
   - Every async data fetch or list load **MUST** render a skeleton or spinner (`Skeleton`, `LoadingSpinner`).
   - Never show raw blank surfaces while loading.
3. **Action Feedback (Toasts)**:
   - Every create, update, delete, or status change **MUST** trigger a `react-hot-toast` notification.
   - Success toasts: `toast.success("...")`.
   - Error toasts: `toast.error("...")`.
4. **Form Standards**:
   - Every form input must have a clear `<label>` (`text-xs font-semibold uppercase tracking-wider text-slate-700`).
   - Validation errors must display below the field in red (`text-xs text-rose-600 mt-1 flex items-center gap-1`).
   - Submit buttons **MUST** display a spinner and become disabled (`disabled:opacity-60 disabled:cursor-not-allowed`) during submission.

---

## 7. Responsive Tables vs. Mobile Cards

- **Desktop (`md:` and above)**: Render structured `<table>` with `sticky` headers, clean borders, and hover row highlights (`hover:bg-slate-50/70`).
- **Mobile (`< md`)**: Tables **MUST** automatically transform into structured card stacks via the `ResponsiveTable` component, displaying row values as labeled card fields with status badges and action buttons easily clickable with touch targets.

---

## 8. Core Reusable Component Library

Import all components from `@/components` or `src/components`:

- **`Button`**: `variant` (`primary`, `secondary`, `outline`, `ghost`, `danger`), `size` (`sm`, `md`, `lg`), `isLoading`, `icon`.
- **`Card`**: `header`, `title`, `description`, `action`, `children`, `footer`.
- **`Badge`**: Status badge using strict status keys (`Booked`, `CheckedIn`, `InConsultation`, `Completed`, `NoShow`, `Cancelled`, `Unpaid`, `Paid`).
- **`TokenBadge`**: Prominent bold pill badge for patient queue tokens.
- **`Modal`**: Accessible dialog modal with backdrop blur, title, close trigger, and footer actions.
- **`StatCard`**: Dashboard KPI card with icon container, metric counter, title, and trend indicator.
- **`EmptyState`**: Empty list placeholder with icon, message, and CTA.
- **`PageHeader`**: Standardized top section of every page with title, subtitle, and primary actions.
- **`FormField` / `FormInput` / `FormSelect`**: Standardized accessible inputs with labels and error feedback.
- **`ResponsiveTable`**: Responsive table that morphs into cards on mobile screens.
- **`LoadingSpinner` & `Skeleton`**: Visual loading indicators.
