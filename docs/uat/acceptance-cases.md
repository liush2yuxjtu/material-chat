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
**Preconditions:** Ethan is authenticated; a valid PDF is available.
**Steps:** Open materials; select `document` as the material type; choose the PDF; upload it; wait for completion; refresh.
**Acceptance criteria:** File is accepted once; title/type/status are visible; record persists after refresh; unsupported files are rejected without partial records.

## UAT-07 — Mei Chen filters materials by tag
**Person:** Mei Chen, postgraduate learner.
**Task:** Find one economics document among materials with distinct tags.
**Preconditions:** The library contains several materials, and only the target document has the `economics` tag.
**Steps:** Enter `economics` in the tag filter; inspect results; clear the tag filter.
**Acceptance criteria:** Only materials carrying the matching tag remain while filtered; clearing the filter restores the complete list.

## UAT-08 — Oliver Brown navigates between protected workspaces
**Person:** Oliver Brown, active learner.
**Task:** Move from chat to materials and return to a usable chat workspace.
**Preconditions:** Oliver is authenticated and can access both protected routes.
**Steps:** Open the chat page; navigate to materials; return to chat using application navigation.
**Acceptance criteria:** Navigation links work; the authenticated session remains valid; both pages render without a full error page; the returned chat workspace accepts a new message. Conversation restoration is not required by the current client-only chat design.

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
**Steps:** Select `document` as the material type; upload a PDF; observe failure; retry the same file; refresh the library.
**Acceptance criteria:** Failure is visible and actionable; retry creates exactly one material record; no duplicate or stuck loading item remains; successful material persists after refresh.
