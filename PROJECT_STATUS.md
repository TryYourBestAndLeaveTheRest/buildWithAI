# Project Status - Campus Swap & Drop

Date: 2026-04-21

## Project Goal
Build a campus marketplace where users can:
- Post items they have (`have`) or items they need (`need`)
- Authenticate and manage profiles
- Interact with posts to start a transaction flow
- Coordinate item exchange safely with clear status tracking

## What Has Been Done

### Core platform
- Express + EJS app structure is running with modular routes/controllers/services.
- MongoDB connection and centralized error handling are in place.
- Session-based authentication is implemented (register, login, logout, protected routes).
- Header/layout auth state is centralized through shared `res.locals`.

### Security and stability updates
- Helmet/CSP setup was fixed to work with local assets.
- Session persistence issues were addressed (cookie handling + explicit session save before redirect).
- Route guards were improved:
  - Homepage feed can be viewed by guests.
  - Protected actions still require authentication.

### UI and navigation
- Navbar was improved and refactored to render from shared nav arrays.
- Active/selected nav styles were added.
- Username became clickable and routes to profile.
- Home page form visibility was updated:
  - Guests can browse feed.
  - Drop/Request form is hidden for unauthenticated users.

### Listings and post ownership fixes
- Listing creation now uses authenticated session user ID from backend (not user input).
- Listing model was expanded with transaction-ready fields:
  - `status` (`active`, `bargaining`, etc.)
  - `activeBargainer`
  - `dorm` persistence
- Feed query now populates listing owner and active bargainer user info.

### Bargaining flow MVP (first implementation slice)
- Added transaction model with:
  - `listing`, `buyer`, `seller`, `initiatorRole`, `status`
  - embedded optional comments
- Added interaction endpoint:
  - `POST /items/:id/interact`
- Added interaction validation logic.
- Added backend bargaining start logic:
  - validates action and ownership rules
  - blocks self-interaction
  - creates transaction
  - moves listing to `bargaining`
  - sets `activeBargainer`
- Listing cards now show:
  - status badge updates
  - bargaining indicator (`... is bargaining`)
  - action buttons (`Buy` or `I have this`) with optional comment

## What Remains

### Transaction lifecycle
- Add accept/decline actions for initiated bargains.
- Add logistics capture fields and flow (pickup/drop-off time and location).
- Add dual confirmation completion flow (both users confirm before completed).
- Add cancellation flow with structured reasons.

### Transaction views
- Build transaction detail page.
- Show full comment history tied to transaction.
- Add user-facing status timeline in dashboard/profile.

### Notifications
- Implement in-app notification center.
- Add unread badge and mark-as-read flow.
- Trigger notifications on each status transition.

### Trust and safety
- Add reporting/dispute endpoints and UI.
- Freeze or flag transactions on dispute.
- Add moderation/audit-friendly event logs.

### QA and hardening
- Add tests for:
  - role/authorization checks
  - state transition integrity
  - duplicate/race interaction handling
- Revisit optimistic/atomic update strategy for high-concurrency listing interactions.

## Important Messages / Notes
- Product decision implemented: no private messaging system; negotiations are comment-based or threaded discussions within the transaction itself and visible to all users (or all users in the same dorm).
- Current implementation already supports the first interaction trigger and bargaining state update.
- Keep backend as source of truth for user ownership and interaction permissions.
- UI should continue to favor clarity of state (`active`, `bargaining`, `agreed`, `completed`, etc.) over hidden workflow.
- A terminal environment mismatch still appears in some sessions (`npm run build:css` exiting with code 127). This should be verified before relying on build scripts in future steps.

## Suggested Next Session Starting Point
1. Implement `accept` / `decline` endpoints and wire them to transaction cards/details.
2. Add transaction detail page with comment timeline.
3. Implement notification model + unread badge in header.

---
Status: Paused intentionally. Safe to resume from transaction lifecycle implementation.
