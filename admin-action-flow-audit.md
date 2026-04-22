# Admin Action Flow Audit

Date: 2026-04-22
Scope: admin analytics/dashboard flow from models to controllers to routes

## 1) Architectural flaws and best-practice violations

### A. Domain and naming drift (high)
- Admin analytics actions are implemented inside FeedbackController instead of an admin-focused controller.
- FeedbackService currently provides session/page-view analytics, not feedback analytics.
- The admin route imports FeedbackController for all admin endpoints.

Impact:
- Low cohesion and confusing ownership.
- Team members will likely add unrelated behavior to feedback files.
- Increased maintenance cost and higher regression risk.

Evidence:
- src/routes/admin.js imports ../controllers/feedbackController
- src/controllers/feedbackController.js contains renderAdminDashboard
- src/services/feedbackService.js has analytics aggregation for sessions and page views

### B. Broken endpoint contract (high)
- GET /api/admin/feedback-data is wired to FeedbackController.getFeedbackData.
- getFeedbackData calls FeedbackService.getFeedbackAnalytics(), but that method does not exist.

Impact:
- This endpoint will return 500 whenever called.
- “Feedback analytics” section cannot be reliably implemented with current backend.

Evidence:
- src/routes/admin.js: router.get('/api/admin/feedback-data', ...)
- src/controllers/feedbackController.js: FeedbackService.getFeedbackAnalytics()
- src/services/feedbackService.js: no getFeedbackAnalytics method

### C. Orphaned feature references (high)
- Repository references feedback model/routes in docs/memory, but codebase has no feedback model or feedback routes.
- Admin view still advertises feedback analytics section, but backend flow is incomplete.

Impact:
- Partial feature implementation hidden behind admin UX.
- Hard-to-diagnose runtime failures and dead links.

Evidence:
- No src/models/feedbackModel.js
- No src/routes/feedback.js
- views/admin.ejs contains Feedback Analytics section shell

### D. Cross-cutting analytics middleware performs writes on all requests (medium)
- analyticsMiddleware creates/updates SessionAnalytics and writes PageView on every request, including admin, static-like pages, and API requests.
- This is acceptable for tracking but currently unbounded and tightly coupled to request lifecycle.

Impact:
- Increased write load and latency sensitivity.
- Harder to isolate analytics failures from request handling concerns.

Evidence:
- src/middleware/analytics.js called globally in src/app.js before routes

### E. Session lifecycle model not fully implemented (medium)
- SessionAnalytics schema includes endTime and duration, but no code updates these fields.
- activeSessions counts endTime: null, which likely grows monotonically.

Impact:
- Active session and average duration metrics are likely inaccurate.

Evidence:
- src/models/analyticsModel.js has endTime and duration fields
- No updates to endTime/duration found in src/**

### F. Duplicate index declaration (medium)
- SessionAnalytics.sessionId has unique: true and also SessionAnalyticsSchema.index({ sessionId: 1 }).

Impact:
- Mongoose duplicate index warning noise.
- Potential startup confusion and operational log pollution.

Evidence:
- src/models/analyticsModel.js

### G. Presentation and API concerns mixed in one controller class (low)
- Same class renders HTML (admin.ejs) and serves JSON analytics APIs.

Impact:
- Harder to evolve UI and API independently.

Evidence:
- src/controllers/feedbackController.js has renderAdminDashboard + API action methods

## 2) Misplaced responsibilities across layers

### Current placement
- Models:
  - analyticsModel stores PageView and SessionAnalytics.
- Middleware:
  - analyticsMiddleware captures tracking side effects for every request.
  - requireAdmin performs authz gate.
- Controller:
  - FeedbackController owns admin dashboard render and admin analytics APIs.
- Service:
  - FeedbackService aggregates session/page-view analytics.
- Route:
  - admin.js maps /admin and /api/admin/* to FeedbackController.

### Layer issues
- Admin concern is owned by feedback-named controller/service.
- Feedback concern is mostly frontend-only (public/js/feedback.js + modal partials), while backend feedback persistence is absent.
- Route contract suggests feedback analytics API exists, but service layer does not implement it.

## 3) Current execution flow of admin features

### Flow A: Admin dashboard HTML request
1. Request enters app in src/app.js.
2. Global middleware stack runs:
   - helmet/compression/rate-limit/session
   - analyticsMiddleware writes/updates analytics records
   - locals middleware sets auth/admin flags for views
3. Route matching:
   - app mounts mainRoutes then adminRoutes
   - /admin resolves in src/routes/admin.js
4. Authorization:
   - requireAdmin checks req.session.userId and req.session.isAdmin
   - authorized: continue
   - unauthorized: renders 403 error page
5. Controller:
   - FeedbackController.renderAdminDashboard calls FeedbackService.getDashboardMetrics
6. Service:
   - getDashboardMetrics calls getSessionAnalytics + getPageViewAnalytics
7. Response:
   - renders views/admin.ejs with metrics

### Flow B: Admin session/pageview API requests
1. Request path /api/admin/session-data or /api/admin/pageview-data
2. Same global middleware sequence as above
3. requireAdmin authorization
4. Controller method delegates to FeedbackService
5. JSON response with analytics payload

### Flow C: Admin feedback API request (currently broken)
1. Request path /api/admin/feedback-data
2. Same middleware + requireAdmin flow
3. FeedbackController.getFeedbackData calls FeedbackService.getFeedbackAnalytics
4. Method missing in service -> exception -> controller returns 500 JSON

## 4) Concrete refactoring recommendations

## Priority 0 (stability hotfixes)
1. Remove the dead/broken endpoint or implement it fully.
   - Either remove GET /api/admin/feedback-data for now.
   - Or implement Feedback model + FeedbackService.getFeedbackAnalytics + data pipeline.
2. Remove duplicate SessionAnalytics sessionId index declaration.
   - Keep unique: true field index and remove explicit SessionAnalyticsSchema.index({ sessionId: 1 }).

## Priority 1 (layer boundary cleanup)
1. Introduce AdminController.
   - Move renderAdminDashboard, getSessionData, getPageViewData out of FeedbackController.
2. Introduce AdminAnalyticsService.
   - Move dashboard/session/pageview aggregation out of FeedbackService.
3. Keep FeedbackController only for feedback submission/read concerns.
   - If no backend feedback persistence exists, either add it or delete placeholder controller actions.

Suggested structure:
- src/controllers/adminController.js
- src/services/adminAnalyticsService.js
- src/controllers/feedbackController.js (feedback only)
- src/services/feedbackService.js (feedback only)

## Priority 2 (execution flow hardening)
1. Split admin routes by concern.
   - HTML route(s): /admin
   - API route(s): /api/admin/analytics/*
2. Add explicit response contracts for each API.
   - Define payload shapes and error schema.
3. Add centralized async wrapper or forward errors to errorHandler for consistency.

## Priority 3 (data correctness)
1. Implement session end/duration updates.
   - On logout and/or session expiration hooks, set endTime and duration.
2. Define active session policy.
   - Consider active = lastSeen within rolling window (for example, 15 min) instead of endTime null.
3. Optionally throttle analytics writes or queue writes for high-traffic paths.

## Priority 4 (test coverage)
1. Add integration tests for admin authorization matrix:
   - anonymous -> 403 or redirect (policy-based)
   - authenticated non-admin -> 403
   - authenticated admin -> 200
2. Add controller/service tests for analytics endpoints.
3. Add regression test asserting no missing service method for registered routes.

## 5) Suggested target architecture

- Admin route layer:
  - Authz only + request validation + delegate.
- Admin controller layer:
  - HTTP transport concerns (status, render/json).
- Admin service layer:
  - Analytics orchestration and aggregation.
- Analytics repository/model layer:
  - Query primitives and index ownership.
- Feedback module:
  - Independent bounded context (own routes/controller/service/model), only integrated into admin via explicit dependency.

## 6) Short conclusion

Yes, renderAdminDashboard is misplaced for clean layering. The current implementation works for core dashboard rendering but has structural drift and at least one confirmed broken admin endpoint. The highest value next step is to separate admin analytics into a dedicated controller/service pair, then either fully implement backend feedback analytics or remove the incomplete feedback-data API until it is ready.
