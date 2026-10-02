# CareQueue UI Consistency Rules for Antigravity & Agents

When writing or modifying any frontend code in CareQueue:

1. **Stack**: Tailwind CSS, `lucide-react`, `react-hot-toast`, `react-router-dom`.
2. **Theme**:
   - Primary: Teal `#0d9488` (`brand-600` / `teal-600`), hover `#0f766e` (`teal-700`).
   - Page background: `#f8fafc` (`bg-slate-50`).
   - Card surfaces: `#ffffff` (`bg-white`), borders: `border-slate-200`, corners: `rounded-xl`, soft shadows: `shadow-sm`.
   - Font: Inter (`font-sans`).
3. **Status Badges** (Strict mappings, DO NOT change):
   - `Booked` -> Blue (`bg-blue-50 text-blue-700 border-blue-200`)
   - `CheckedIn` -> Amber (`bg-amber-50 text-amber-700 border-amber-200`)
   - `InConsultation` -> Purple (`bg-purple-50 text-purple-700 border-purple-200`)
   - `Completed` -> Green (`bg-emerald-50 text-emerald-700 border-emerald-200`)
   - `NoShow` -> Red (`bg-rose-50 text-rose-700 border-rose-200`)
   - `Cancelled` -> Grey (`bg-slate-100 text-slate-600 border-slate-200`)
   - `Unpaid` -> Orange (`bg-orange-50 text-orange-700 border-orange-200`)
   - `Paid` -> Green (`bg-emerald-50 text-emerald-700 border-emerald-200`)
4. **Tokens**:
   - Always display queue tokens (e.g. `D1-07`) using the `TokenBadge` component (large bold pills).
5. **Layout**:
   - Sidebar: Clinic name "CareQueue", teal branding, role-based navigation links, collapsable on mobile.
   - Top Bar: Role switcher dropdown, formatted today's date, profile/status indicators.
6. **Interaction & State Patterns**:
   - Every list has an `EmptyState` (icon + friendly message).
   - Every data load has a `Skeleton` or `LoadingSpinner`.
   - Every user mutation/action triggers a `react-hot-toast` toast (`toast.success` or `toast.error`).
   - Forms have explicit labels, validation messages, and disabled submit buttons with spinner while submitting.
   - Tables on desktop MUST transform into cards on mobile screens (`< md`).
7. **Components**:
   - Always reuse components from `src/components/ui`: `Button`, `Card`, `Badge`, `TokenBadge`, `Modal`, `StatCard`, `EmptyState`, `PageHeader`, `ResponsiveTable`, `Skeleton`, `LoadingSpinner`.
