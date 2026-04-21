# Campus Swap & Drop — Next Steps & Project Review

> Generated: 2026-04-21  
> Reviewer: Antigravity (AI Pair Programmer)  
> Based on: Full codebase review + PROJECT_STATUS.md

---

## 1. Overall Concept Assessment

The project has a solid and well-scoped concept — a campus micro-marketplace built around a clean
`have/need` duality. The Cyber-Campus aesthetic is consistent and well executed. The Express/EJS/Tailwind
stack is appropriate for this scope, and the modular `routes → controllers → services → models`
architecture is a good foundation.

The first transaction slice (bargaining initiation) is a promising start. However, there are several
gaps between the data model's ambition and what the UI and routes actually expose, and the codebase
has some structural concerns that should be addressed before adding more features.

---

## 2. Critique — Gaps, Inconsistencies, and Issues Found

### 2.1 Critical Bugs / Logic Issues

| # | File | Issue |
|---|------|-------|
| 1 | `routes/index.js` (L9) | `GET /` uses `requireAuth` which has a special carve-out for guests, but the route registration itself says `requireAuth`. This is confusing — the public bypass lives in middleware, not in routing. Semantics are inverted; consider a separate `optionalAuth` middleware. |
| 2 | `listingModel.js` | `Listing.create` shadows the built-in Mongoose static `create`. This will break in future Mongoose versions and confuses new developers. Rename to `createListing` or use `new Listing(data).save()` in the service directly. |
| 3 | `listingService.js` (L77) | `Transaction.create()` and then `listing.save()` are two sequential DB writes with **no transaction/rollback**. If `listing.save()` fails, a Transaction document exists with no corresponding status change on the listing. Use a MongoDB session + `startTransaction()` or at minimum handle the error and clean up. |
| 4 | `userService.js` (L33–36) | `getUserProfile()` returns "the first user" — this is dead/test code left in the service. The dashboard only uses `getUserById`, so this should be removed to avoid confusion. |
| 5 | `dashboard.ejs` (L23) | `user.dorm` is rendered, but the `UserSchema` has no `dorm` field. This will silently render as `undefined`. Either add `dorm` to the User model or remove it from the view. |
| 6 | `validator.js` | `validateListing` on `price` uses `.optional().isNumeric()` but the form's price field is `required` and accepts free-text like "Free / $10 / Coffee". The field type in the schema is `Number` but the form allows strings — there's a type mismatch between UX intent and DB model. Decide: is `price` a free-text field or a structured number? |
| 7 | `errorHandler.js` | The error handler sends JSON responses (`res.status().json()`), but this is a server-rendered EJS application. Users who hit errors see raw JSON instead of a styled error page. An error EJS view is needed. |
| 8 | `app.js` (L60–63) | `process.exit(1)` on missing `SESSION_SECRET` is correct in production, but this also evaluates in CI/test environments that set `NODE_ENV=production` for build purposes. Guard more carefully or move config validation to a startup script. |

### 2.2 Architecture / Structural Concerns

- **No transaction controller**: All transaction logic is only accessible via `listingController.interactWithListing`. As more transaction actions are added (`accept`, `decline`, `complete`, `cancel`), they need their own route namespace (`/transactions/:id/...`) and a dedicated `transactionController.js` + `transactionService.js`. Adding them to `listingController` would be a design smell.
- **Single route file**: All routes are in `routes/index.js`. As features grow (transactions, notifications, profile editing), this file will become unmanageable. Split into `routes/listings.js`, `routes/users.js`, `routes/transactions.js`.
- **No pagination**: `Listing.getByType()` hard-caps at 10 results. There's no pagination, no infinite scroll, and no indication to the user that older items exist. This is a user-experience cliff.
- **No image/media support**: Listings have no photo field. For a physical goods marketplace, images are table-stakes. The EJS card component has no placeholder for this.
- **`unsafe-inline` in CSP**: Both `scriptSrc` and `scriptSrcAttr` allow `'unsafe-inline'`. This weakens the Helmet CSP significantly. Move inline scripts to external JS files with nonces or hashes.
- **Build script fragility**: The known `npm run build:css` exit code 127 issue (from PROJECT_STATUS.md notes) means the CSS may be stale in some environments. This should be investigated and fixed before the next feature push.

### 2.3 UX / Product Gaps

- **No error feedback in the UI**: When listing creation fails validation (`400` returned as JSON), the user sees a blank JSON response — not a re-rendered form with an error message. The EJS form needs inline error display.
- **Dashboard is a stub**: The dashboard shows the user's name/email but no active listings, no transaction history, and no "pending" actions (e.g., someone wants to buy your item). This is the most critical missing UX surface for the next phase.
- **No transaction detail page**: Once bargaining starts, there's nowhere to go. Users have no dedicated page to see the conversation, accept/decline, or track status. This is the core missing link in the transaction flow.
- **Bargaining already in progress — user has no way to see it**: If a listing is `bargaining`, the original poster receives no notification and has no page to review the offer. The only UI cue is the `... is bargaining` badge on the feed card.
- **No mobile navigation**: The header nav is `hidden md:` on mobile. There's no hamburger menu or drawer. Campus users are likely on phones.
- **No "my listings" view**: A user has no way to see all their own posts from the dashboard.

---

## 3. What's Actually Missing vs. What's Claimed Done

| Claimed in PROJECT_STATUS.md | Reality |
|---|---|
| "Protected actions still require authentication" | ✅ Correct, but guest carve-out is implemented in a fragile/confusing way |
| "Listing creation uses authenticated session user ID from backend" | ✅ Correct |
| "Feed query populates listing owner and activeBargainer user info" | ✅ Correct |
| "Added interaction endpoint + bargaining start logic" | ✅ Correct, but no atomicity |
| "Listing cards show action buttons" | ✅ Correct, but no feedback on failure |
| "Bargaining indicator shows" | ✅ Visual only; no actionable path for the seller |

---

## 4. Recommended Next Steps (Prioritised)

### Priority 1 — Fix Existing Bugs (Before Adding Features)

These are blocking issues that will cause real failures in production or during the next feature build.

- [ ] **Fix `user.dorm` in dashboard.ejs** — add `dorm` to `UserSchema` (and register form) or remove it from the view.
- [ ] **Fix `price` type mismatch** — change `price` in `ListingSchema` to `String` (free-text) or update the form to only accept numbers and update validation accordingly. Decide the product intent.
- [ ] **Remove or rename `Listing.create`** — use `new Listing(data).save()` in the service instead of overriding the Mongoose static.
- [ ] **Add MongoDB session atomicity** to `startBargaining` — wrap the two writes in a session transaction.
- [ ] **Create an error EJS view** (`views/error.ejs`) — update `errorHandler.js` to render it instead of returning JSON.
- [ ] **Remove dead `getUserProfile()`** from `userService.js`.

---

### Priority 2 — Transaction Lifecycle (Core Feature Gap)

This is the highest-value feature area. Without it, the app is a dead-end after one interaction.

#### 2a. New: `transactionController.js` + `transactionService.js`
```
src/controllers/transactionController.js
src/services/transactionService.js
```
Implement:
- `GET /transactions/:id` → transaction detail page
- `POST /transactions/:id/accept` → seller accepts bargain → status: `agreed`
- `POST /transactions/:id/decline` → seller declines → listing reverts to `active`
- `POST /transactions/:id/complete` → dual-confirm completion → status: `completed`
- `POST /transactions/:id/cancel` → either party cancels with reason

#### 2b. New: `views/transaction.ejs`
- Show item title, both parties, initiator role
- Comment thread (chronological timeline)
- Status badge + current action available (accept/decline/complete/cancel)
- CTA buttons tied to the viewer's role (buyer vs seller)

#### 2c. Update `Listing` status transitions
- On `decline`: reset `status → active`, clear `activeBargainer`
- On `complete`: set `status → completed`
- On `cancel`: set `status → canceled`, clear `activeBargainer`

---

### Priority 3 — Dashboard: The User's Control Center

The dashboard is currently a stub with no meaningful data. It needs to be the user's hub.

- [ ] **My Active Listings** — query `Listing.find({ user: req.session.userId, status: 'active' })`
- [ ] **Pending Actions** — query transactions where the user is `buyer` or `seller` and `status === 'pending'`
  - Split into "Offers I sent" and "Offers I received"
  - Each item links to the transaction detail page
- [ ] **Transaction History** — completed and canceled transactions
- [ ] **Pass `listings` and `transactions` to `dashboard.ejs`** — update `UserController.renderDashboard` and `UserService`

---

### Priority 4 — Route Refactoring

Before the route file becomes a monolith:

```
src/routes/
  index.js         ← mount sub-routers only
  listings.js      ← GET /, POST /items/new, POST /items/:id/interact
  users.js         ← /register, /login, /logout, /dashboard, /profile
  transactions.js  ← /transactions/:id, /transactions/:id/accept, etc.
```

Also: replace the `requireAuth` public-home carve-out with an explicit `optionalAuth` middleware for `GET /`.

---

### Priority 5 — Notifications (In-App)

The notification system is listed in PROJECT_STATUS.md. Implement it after the transaction lifecycle is solid.

#### 5a. Notification Model (`src/models/notificationModel.js`)
```js
{
  recipient: ObjectId (ref User),
  type: String (enum: ['new_offer', 'offer_accepted', 'offer_declined', 'completed', 'canceled']),
  transaction: ObjectId (ref Transaction),
  listing: ObjectId (ref Listing),
  read: Boolean (default: false),
  createdAt: Date
}
```

#### 5b. Notification triggers
- Add `NotificationService.notify(userId, type, transactionId, listingId)` calls inside `transactionService.js` on each state transition.

#### 5c. Unread badge in header
- In the `res.locals` middleware, query `Notification.countDocuments({ recipient: userId, read: false })` and set `res.locals.unreadCount`.
- Show a badge in `header.ejs` on the user avatar/name.

#### 5d. Notification center page
- `GET /notifications` — list all notifications, mark as read on view.

---

### Priority 6 — UX Polish

- [ ] **Mobile navigation** — add a hamburger menu / slide-over drawer for the header nav.
- [ ] **Inline form errors** — pass validation errors back to EJS forms and render them inline (not as JSON).
- [ ] **Pagination** — add `?page=` query param support to `Listing.getByType()`, limit 12 per page with prev/next controls.
- [ ] **Image uploads** — add optional image field to listings. Use `multer` for upload handling and store images in `/public/uploads/` or an object store.
- [ ] **Remove `unsafe-inline` from CSP** — move inline JS in `header.ejs` and `index.ejs` to static files in `/public/js/`.
- [ ] **Fix `build:css` script** — investigate and resolve the exit code 127 issue. Document the confirmed working command in README.md.

---

### Priority 7 — Testing & Hardening

Add a test suite before the app grows further. Recommended minimal coverage:

```
npm install --save-dev jest supertest
```

Key test cases:
- Auth middleware: unauthenticated requests redirect correctly
- `startBargaining`: blocks self-interaction, blocks double-bargaining
- Transaction state transitions: correct status progression, invalid transitions rejected
- Validator middleware: correct fields validated, errors returned in correct format

---

## 5. Recommended Session Starting Point

**Session 1 (Bug fixes + transaction foundation):**
1. Fix `user.dorm`, `price` type, `Listing.create` override, dead `getUserProfile()`
2. Add `views/error.ejs` + update `errorHandler.js`
3. Create `transactionController.js`, `transactionService.js`, `routes/transactions.js`
4. Implement `GET /transactions/:id` + `views/transaction.ejs`

**Session 2 (Accept/Decline/Complete + Dashboard):**
1. Implement `accept`, `decline`, `complete`, `cancel` endpoints
2. Update dashboard to show listings + pending transactions
3. Link feed cards → transaction detail when status is `bargaining`

**Session 3 (Notifications):**
1. Notification model
2. Notify on each state transition
3. Unread badge in header
4. `/notifications` page

---

## 6. Summary Table

| Area | Status | Action Required |
|---|---|---|
| Core architecture | ✅ Solid | Refactor routes into sub-routers |
| Auth flow | ✅ Working | Fix middleware semantics (`optionalAuth`) |
| Listing CRUD | ⚠️ Partial | Fix price type, pagination, images |
| Bargaining initiation | ✅ Done | Add atomicity (MongoDB session) |
| Transaction lifecycle | ❌ Missing | Build accept/decline/complete/cancel |
| Transaction detail view | ❌ Missing | Build `views/transaction.ejs` |
| Dashboard | ⚠️ Stub | Show listings + transactions + pending actions |
| Notifications | ❌ Missing | Model + triggers + badge + center page |
| Error handling | ⚠️ Broken for SSR | Add `views/error.ejs` |
| Mobile nav | ❌ Missing | Add hamburger / drawer |
| Tests | ❌ None | Add Jest + Supertest suite |
| Build script | ⚠️ Known issue | Investigate and document fix |

---

*This document should be updated after each session to reflect completed items and newly discovered issues.*
