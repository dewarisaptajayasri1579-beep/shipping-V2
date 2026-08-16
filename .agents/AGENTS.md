# PT Seven Smarts - Admin Template Capabilities & Guidelines

This project is the official modern Admin Template / UI Kit boilerplate for PT Seven Smarts, built using Next.js, React, TailwindCSS, and Lucide Icons. 

Every AI agent working in this workspace must review these capabilities, available components, and development standards before writing code.

---

## 1. Available UI Components (UI Kit)

Import these components from `@/components/ui`:
- **Layout Containers**: 
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `CollapsibleCard` (Expandable accordion-like panels)
  - `TableContainer`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- **Forms & Inputs**:
  - `Input` (supports text, password, number, email, and icons)
  - `Select` (dropdown select fields)
  - `Textarea`, `Checkbox`, `RadioGroup`, `Switch`
  - `DatePicker`, `FileUpload`, `CurrencyInput`, `RichTextEditor`
- **Basic UI Elements**:
  - `Button` (Variants: `primary`, `secondary`, `outline`, `ghost`, `glass`, `danger`, `success`, `warning`, `info`)
  - `Badge` (Variants: `primary`, `secondary`, `success`, `warning`, `info`)
  - `Avatar` (Initials and profile image placeholders)
  - `Alert` (Variants: `success`, `error`, `warning`, `info`)
  - `Modal` (Dialog overlays with various sizes: `sm`, `md`, `lg`, `xl`, `full`)
  - `Dropdown` (Button overlay trigger menu)
  - `Accordion` (Toggleable Q&A panels)
  - `Pagination` (Page number list toolbar)

---

## 2. Available Chart Components

Import these components from `@/components/ui/charts`:
- `LineChartCard` (Trend graphs)
- `BarChartCard` (Bar comparison charts)
- `AreaChartCard` (Gross accumulative charts)
- `PieChartCard` (supports standard Pie representation and Donut mode using the `donut` prop)
- `MixedChartCard` (Composed Chart combining Bar and Line series)
- `ProgressChartCard` (Linear progress load meters)

---

## 3. Ready-to-Use Showcase Pages & Layouts

- **Dashboard**: `/dashboard` (main metrics and activity feed)
- **User Management**: `/contoh/users` (live user listing table, search/filter, role adjustment, and add-user modal)
- **User Profile**: `/profil` (Tabbed interface for profile updates, password change, regional preferences, and notification toggles)
- **Error Templates**:
  - 403 Forbidden: `/403`
  - 500 Internal Error: `/500`
  - Maintenance Mode: `/maintenance`
- **Otentikasi (Authentication)**:
  - Login: `/login`
  - Register: `/register`
  - Forgot Password: `/forgot-password`
  - Reset Password: `/reset-password`
  - OTP Verification: `/otp` (Verification code inputs)
  - Lock Screen: `/lock-screen` (Sessi dikunci)

---

## 4. Key Development Rules & Guidelines

1. **Client vs. Server Components**:
   - In Next.js App Router, passing complex React elements (such as `lucide-react` icons) or interactive event handlers (`onSubmit`, `onClick`) from a Server Component to a Client Component raises serialization errors.
   - For interactive views, add `"use client";` at the top and mock profile props for `AppLayout` locally if needed.
2. **Aesthetic Consistency**:
   - Adhere strictly to the preconfigured HSL CSS theme design for both Light Mode and Dark Mode.
   - Utilize standard tailwind classes for borders (`border-slate-200/80` or `dark:border-line`), backgrounds (`bg-white/80` or `dark:bg-surface`), and text colors.
