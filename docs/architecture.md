# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and route-driven: pages render API-backed data with clear states for loading, empty results, and errors, while shared Bootstrap styling is used for consistent accessible layouts.
- Logic tier decision: Centralize API behavior in explicit service functions behind Express routes; keep validation and business rules in the service layer and ensure deliberate 4xx responses for invalid IDs, missing fields, and unknown users instead of leaking framework or cast errors.
- Data tier decision: Use Mongoose schemas as the canonical contract for required fields and relationships, with MongoDB seed data that is idempotent and preserves unrelated fixtures while reconciling demo users and team membership.
- Activity tracking approach: Validate `userId` and `teamId` as real IDs, reject malformed or missing references with 4xx responses, and persist the submitted `user`, `team`, `type`, and `minutes` with computed `points` and `occurredAt`.
- Team management approach: Require a non-empty team `name` and default `members` to an empty array, allow creation of teams with member references, and list memberships consistently from the stored Team documents. A team without a name should be rejected with `400` as called for by the API contract.
- Leaderboard approach: Aggregate total points per team from activities, sort descending by total points, and assign 1-based ranks after ordering so the team standings reflect the API contract exactly.
- Workout suggestions approach: Match suggestions to a user by email, analyze the user’s recent fitness goal and activity patterns, and return the most relevant workout focus with a reason that explains the match while returning a 4xx for unknown emails.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - What it validates: the Mongoose schema contract for `User`, `Team`, `Activity`, and `Workout`, plus the idempotent seeding flow for demo data.
  - What the current failure means: the database layer is missing required schema validation and the seeded records do not yet enforce the contract expected by the app; the seed test currently fails on undefined validation errors for required fields.
  - What success will mean after implementation: every required field is enforced in the model schema, seeded users/teams/activities/workouts are created with valid references, and the seed process can be rerun without duplicating or corrupting demo fixtures.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - What it validates: all `/api/*` routes for activities, teams, leaderboard, and workout suggestions, including 4xx validation for bad input and correct response shapes for successful requests.
  - What the current failure means: the Express handlers are still stubbed or incomplete; activities and teams are returning 501 because the service layer throws “not implemented yet,” leaderboard is empty, and suggestion logic is not tied to the user’s activity pattern.
  - What success will mean after implementation: POST routes accept valid payloads, reject invalid IDs or missing required fields with deliberate 4xx status codes, leaderboard entries are ordered and ranked correctly, and workout suggestions match the seeded user’s goal or recent activity with a reason and fallback 4xx for unknown email addresses.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - What it validates: the UI renders the main capability pages from API responses, shows loading/empty/error states, and uses accessible text for status and content.
  - What the current failure means: the presentation tier is still a placeholder; the “Implementation pending” state is rendered instead of API-backed cards and route content, so the tests cannot find expected activity, team, leaderboard, or workout data.
  - What success will mean after implementation: each route loads data from the API, displays the expected content, announces loading and failures through accessible roles, and shows meaningful empty states when the backend returns no records.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - What it validates: TypeScript compilation for the backend, including route, service, model, and configuration files, as well as any type-level contract consistency.
  - What the current status means: this build has not been run yet, so no observed backend build result is available. If it fails later, the failure would indicate a TypeScript or configuration issue in the backend implementation rather than a confirmed current problem.
  - What success will mean after implementation: the backend compiles cleanly with no TypeScript errors, and the API implementation matches the expected contracts used by the tests.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - What it validates: TypeScript and Vite bundling for the React app, including route definitions, API-fetch code, and UI components.
  - What the current status means: this build has not been run yet, so no observed frontend build result is available. If it fails later, the failure would indicate a TypeScript, bundling, or component-configuration issue in the frontend rather than a confirmed current problem.
  - What success will mean after implementation: all frontend components compile, the app bundles correctly under Vite, and the route tree renders the completed pages without build-time regressions.
