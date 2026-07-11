# Material Chat User Acceptance Test Catalogue

These ten cases define acceptance for named users completing specific chat and material-management tasks.

## UAT-01 — Alice Wong registers a new learner account
**Person:** Alice Wong, first-time learner.
**Task:** Create an account and reach the authenticated home page.
**Preconditions:** Alice's email is not registered.
**Steps:** Open registration; enter valid name, email, and password; submit.
**Acceptance criteria:** Account is created once; Alice is authenticated or directed to login according to product behavior; validation errors are absent; password is never displayed or logged.

## UAT-02 — Marcus Tan signs in and signs out
**Person:** Marcus Tan, returning learner.
**Task:** Start and end an authenticated session.
**Preconditions:** Marcus has a valid account.
**Steps:** Sign in; verify the chat page; sign out; revisit a protected route.
**Acceptance criteria:** Valid credentials create a session; logout clears it; protected content is no longer accessible; browser back does not reveal private data.

## UAT-03 — Priya Shah is redirected from a protected page
**Person:** Priya Shah, unauthenticated visitor.
**Task:** Open the chat workspace directly.
**Preconditions:** No session cookie exists.
**Steps:** Navigate to the protected chat URL.
**Acceptance criteria:** Priya is redirected to authentication; protected API/data is not rendered; the intended return path is preserved when supported.

## UAT-04 — Daniel Kim sends a basic chat question
**Person:** Daniel Kim, engineering student.
**Task:** Ask a question about an uploaded course topic.
**Preconditions:** Daniel is authenticated and the chat service is available.
**Steps:** Enter a message; submit; wait for the assistant response.
**Acceptance criteria:** User message appears once; assistant response appears in the same conversation; input is reusable; no duplicate request is created.

## UAT-05 — Sofia Garcia receives a streamed answer
**Person:** Sofia Garcia, research assistant.
**Task:** Observe a long answer arriving over SSE.
**Preconditions:** Streaming endpoint returns multiple chunks.
**Steps:** Submit a long-form question; observe intermediate rendering; wait for completion.
**Acceptance criteria:** Chunks appear incrementally and in order; final text is complete; temporary streaming state clears; disconnect/error state is handled visibly.

## UAT-06 — Ethan Lim uploads a PDF learning material
**Person:** Ethan Lim, teaching assistant.
**Task:** Add a PDF to the material library.
**Preconditions:** Ethan is authenticated; valid PDF is available.
**Steps:** Open materials; upload the PDF; wait for completion; refresh.
**Acceptance criteria:** File is accepted once; title/type/status are visible; record persists after refresh; unsupported files are rejected without partial records.

## UAT-07 — Mei Chen filters materials by keyword
**Person:** Mei Chen, postgraduate learner.
**Task:** Find one economics document among several materials.
**Preconditions:** Library contains materials with distinct titles.
**Steps:** Enter `economics` in the filter; inspect results; clear the filter.
**Acceptance criteria:** Only matching materials remain while filtered; matching is stable and case-tolerant as designed; clearing restores the complete list.

## UAT-08 — Oliver Brown navigates without losing chat state
**Person:** Oliver Brown, active learner.
**Task:** Move between chat and materials and return to the current conversation.
**Preconditions:** Oliver has an active conversation and at least one material.
**Steps:** Open materials; return to chat using application navigation.
**Acceptance criteria:** Navigation links work; authenticated shell remains stable; current conversation is preserved or restored according to product design; no full error page appears.

## UAT-09 — Hana Suzuki cannot register a duplicate email
**Person:** Hana Suzuki, existing learner.
**Task:** Attempt to create a second account with her registered email.
**Preconditions:** Hana's email already exists.
**Steps:** Open registration; submit the existing email with a new password.
**Acceptance criteria:** No duplicate user is created; user receives a clear non-sensitive error; existing credentials and data remain unchanged; response does not expose database details.

## UAT-10 — Ahmed Khan recovers from an interrupted upload
**Person:** Ahmed Khan, course administrator.
**Task:** Retry a material upload after the first request fails.
**Preconditions:** First upload request is forced to fail; second request succeeds.
**Steps:** Upload a PDF; observe failure; retry the same file; refresh the library.
**Acceptance criteria:** Failure is visible and actionable; retry creates exactly one material record; no duplicate or stuck loading item remains; successful material persists after refresh.
