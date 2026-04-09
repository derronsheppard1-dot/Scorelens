# Changelog

All notable changes to the ScoreLens project will be documented in this file.

---

## v0.1 – Foundation & Core Setup

### Added

* Next.js App Router project initialized (ScoreLens)
* Supabase SSR authentication setup
* Environment configuration for Supabase (URL + publishable key)
* Authentication flow:

  * Login page
  * Signup page
  * Onboarding page
* Protected routing using server-side auth checks
* Dashboard layout with:

  * Sidebar navigation
  * User profile display
  * Logout functionality

---

### Built

* Assessments module (initial version):

  * Assessments list page
  * Create assessment page (route + structure)
  * Dynamic assessment route (`/dashboard/assessments/[id]`)
* Reusable UI components:

  * `Card` component (container UI)
  * `PageHeader` component (title + description + actions)
  * `ButtonLink` component (styled navigation buttons)

---

### Implemented

* Server Actions (Next.js):

  * `createAssessment`

    * Creates draft assessments
    * Handles validation (title required)
    * Redirects on success or failure
  * `addQuestion`

    * Adds MCQ questions to assessments
    * Validates inputs (options, correct answer, marks)
    * Automatically calculates question position

---

### Database Integration

* Supabase tables connected:

  * `profiles`
  * `assessments`
  * `assessment_questions`
* Data fetching:

  * User profile validation (onboarding check)
  * Assessments list filtered by teacher
* Insert operations:

  * Assessment creation
  * Question creation

---

### Fixed

* Critical App Router runtime error:

  * `"The default export is not a React Component"`
  * Root cause:

    * Missing `return` in `PageHeader` component
* Component bug fixes:

  * `ButtonLink` missing `variant` prop handling
* Configuration issues:

  * Fixed malformed `tsconfig.json`
  * Corrected JSX structure in multiple files
* Routing stability:

  * Ensured all pages export valid React components
  * Fixed cascading layout errors caused by shared components

---

### Improved

* Dashboard UI consistency and structure
* Navigation clarity between pages
* Error handling via query params (e.g. `?error=`)

---

### Notes

* Core system is now stable
* Ready for feature development phase:

  * Assessment detail page
  * Question builder UI
  * Marks calculation system
  * Student-facing features

---
