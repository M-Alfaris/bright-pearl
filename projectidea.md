# Bright Pearl — Project Concept & MVP

> A global platform to collect, verify, publish, and monitor islamophobic content across social platforms — enabling mass reporting, public transparency, and data for researchers, journalists, and activists.

---

## 1. Vision

Bright Pearl is a trusted, transparent, and scalable platform where anyone can submit suspected islamophobic content (video, image, post, tweet, or link) regardless of language or origin. Verified reports are published on a public dashboard showing platform, status (active/removed), takedown progress, and analytics — enabling coordinated reporting and evidence for research and advocacy.

---

## 2. Goals

* Make mass reporting easy and evidence-based.
* Provide a single transparent source of truth about islamophobic content prevalence across platforms and geographies.
* Protect submitters and moderators through privacy-by-design and invite-only access for moderators.
* Provide usable data exports for researchers while preserving PII and complying with privacy laws.

---

## 3. Core actors & user stories

**Public user (submitter)**

* Submit a report with: link, title, description, category, platform, language, country, screenshots, and optional email for status updates.
* See their report's public ID and track status (pending → approved/rejected → published/removed).

**Public user (activist/reporter)**

* Browse public dashboard and click-through to original content to report it on the platform.
* Filter by platform, country, language, date-range, tag, cluster.

**Moderator (invite-only)**

* See queue of pending reports, review evidence, apply policy, approve/reject, add moderation notes, mark as high-priority or escalate.

**Admin/Researcher**

* Access statistics and exports, aggregate metrics, and analyze patterns.

---

## 4. MVP feature list

**Public facing**

* Submission form (link, title, description, category, platform, language, country, screenshots, optional email).
* Public Dashboard: searchable list of approved reports with filters and link to original content.
* Basic statistics page (counts by platform, country, status).
* Policies & About page.
* Donation/Support page.

**Internal**

* Invite-only moderator signup (managed via Supabase `auth.users`).
* Moderator review dashboard (queue, detail view, approve/reject, comments, tagging).
* All CRUD operations (create, read, update, delete) handled through Supabase **Edge Functions**, not direct DB operations.
* Edge functions for submit, approve/reject, notify, and fetch pending.
* Simple reporting & export (CSV/JSON) with privacy redaction.

**Security & Infrastructure Enhancements**

* Apply rate limiting on all public endpoints (Supabase Edge Functions + Deno KV for request tracking).
* Enable caching for frequent public reads (public dashboard, stats) to reduce load.
* Use anonymous login for all public submission and browsing to avoid unnecessary auth friction.
* Harden endpoints with reCAPTCHA, input sanitization, and size limits for attachments.
* Use Supabase Row Level Security (RLS) policies to isolate moderator and public access.

---

## 5. Technical stack

* **Frontend:** React + refine.dev + Ant Design (UI) deployed on **Netlify**.
* **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, RLS, Rate-limiting).
* **Storage:** Supabase Storage for screenshots.
* **Emails:** SendGrid or Postmark via Supabase Edge Functions.
* **Deployment:** Netlify (frontend) + Supabase (backend + DB + Edge Functions).

---

## 6. Data model (Postgres / Supabase)

### Tables

* `reports`

  * id (uuid, pk)
  * submitter_email (nullable)
  * submitter_ip_hash (nullable)
  * platform (text)
  * original_url (text)
  * title (text)
  * description (text)
  * category (enum)
  * language (iso_code)
  * country (iso_code)
  * platform_status (text) — e.g., active, removed, unknown
  * status (enum) — pending, approved, rejected, published
  * moderation_notes (jsonb)
  * created_at, updated_at

* `attachments`

  * id, report_id, storage_path, thumbnail_path, type (screenshot/thumbnail), created_at

* `moderator_actions`

  * id, report_id, moderator_id (fk → auth.users.id), action (approve/reject/escalate), comment, created_at

* `stats_snapshots`

  * snapshot_time, json_metrics

### Notes

* Moderators are managed within `auth.users`, so no separate table is needed.
* Platform status is now embedded directly into the `reports` table.
* CRUD for all entities is strictly done via Edge Functions with RLS enforcement and audit logging.

Indexes on `status`, `platform`, `country`, and `language` for fast queries.

---

## 7. Edge functions & API endpoints

**Public endpoints**

* `POST /api/submit`: Create a new pending report (rate-limited, reCAPTCHA protected).
* `GET /api/report/:id`: View report details (if approved/published).

**Moderator endpoints (auth required)**

* `GET /api/reports/pending`: Fetch paginated pending reports.
* `POST /api/reports/:id/approve`: Approve and publish a report.
* `POST /api/reports/:id/reject`: Reject a report with reason.
* `POST /api/reports/:id/update-status`: Update `platform_status` when verified.

**Notification endpoint**

* `POST /api/notify`: Email submitter after approval/rejection (if opted-in).

All these endpoints handle CRUD logic internally through Supabase Edge Functions to ensure full control, logging, and rate limitation.

---

## 8. Moderator workflow

1. New submission arrives → appears in pending queue.
2. Moderator reviews evidence (link + screenshots).
3. Approve or reject with notes.
4. Approved items become public on dashboard.

---

## 9. Privacy & safety

* Collect minimal PII (optional email only).
* Hash IPs to detect abuse.
* Limit submission frequency per IP (rate limiting).
* Use anonymous login for submitters and public users.
* Moderators managed through Supabase Auth, invite-only.
* CRUD only via edge functions with strict RLS.

---

## 10. Roadmap (MVP)

**Weeks 1–2**: Finalize schema, setup Supabase project, build submission form.
**Weeks 3–5**: Build moderator dashboard (refine.dev + Ant Design), implement rate limiting and RLS.
**Weeks 6–8**: Implement email notifications, deploy on Netlify and Supabase, and test security.
**Week 9**: Launch closed beta and collect feedback.

---

## 11. Next deliverables

* Supabase schema & RLS setup.
* Edge function templates for full CRUD with rate-limited submission, approval, and notification.
* Netlify deployment configuration.
* Refine.dev + Ant Design moderator dashboard scaffold.

---

Bright Pearl will start simple — focusing on transparency, safety, and impact before expanding into automation or ML-based detection later.
