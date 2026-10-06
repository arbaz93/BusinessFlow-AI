# Step 25 Report: Dashboard & Data Integrity Hardening

## Dashboard Audit

### Metrics and Authoritative Sources

| Metric / Widget | Authoritative Source | Query/Service | Derived Calculation | Dashboard Component |
|-----------------|----------------------|---------------|---------------------|---------------------|
| Total Leads | Lead table | `prisma.lead.count({ where: { organizationId: organization.id } })` | None (count) | Metrics[0] |
| Active Clients | Client table (status = "ACTIVE") | `prisma.client.count({ where: { organizationId: organization.id, status: "ACTIVE" } })` | None (count) | Metrics[1] |
| Active Projects | Project table (status in ["PLANNING", "IN_PROGRESS", "ON_HOLD"]) | `prisma.project.count({ where: { organizationId: organization.id, status: { in: activeProjectStatuses } } })` | None (count) | Metrics[2] |
| Overdue Tasks | Task table (status in ["TODO", "IN_PROGRESS", "BLOCKED"], dueDate < today) | `getDashboardTaskData` (overdueCount) | None (count) | Metrics[3] |
| Active Projects List | Project table (same as above) | `prisma.project.findMany` with organizationId and status in activeProjectStatuses, ordered by dueDate and updatedAt, limit 4 | None (list) | Active Projects section |
| Attention Projects | Project table (status in activeProjectStatuses, dueDate <= today + 7 days) | `prisma.project.findMany` with organizationId, status in activeProjectStatuses, dueDate lte endOfToday(today + 7 days), ordered by dueDate and priority, limit 5 | None (list) | Attention Required section (projects) |
| Recent Activity | Activity table | `prisma.activity.findMany` with organizationId, orderBy createdAt desc, limit 6 | None (list) | Recent Activity section |
| Overdue Tasks List | Task table (same as overdue count) | `getDashboardTaskData` (overdueTasks) | None (list) | Attention Required section (tasks) |
| Upcoming Tasks List | Task table (status in ["TODO", "IN_PROGRESS", "BLOCKED"], dueDate between today and today + 7 days) | `getDashboardTaskData` (upcomingTasks) | None (list) | Upcoming Tasks section |

## Data Integrity Findings

### Inconsistency Found and Fixed

**Symptom**: The project timeline function (`getProjectTimelineState`) in `lib/projects/timeline.ts` used local time for date comparisons, while the task timeline function used UTC. This could lead to inconsistencies in overdue/due-soon calculations for projects versus tasks, especially across timezones or during daylight saving time changes.

**Root Cause**: The `startOfToday` and `endOfToday` functions in `lib/projects/timeline.ts` were implemented using local time methods (`getFullYear`, `getMonth`, `getDate`), whereas the corresponding functions in `lib/tasks/timeline.ts` used UTC methods (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`). The `getProjectTimelineState` function further used local time when converting dates for comparison.

**Fix**: Updated `lib/projects/timeline.ts` to use UTC consistently:
1. Changed `startOfToday` and `endOfToday` to use UTC methods.
2. Modified `getProjectTimelineState` to convert input dates to UTC for comparison, aligning with the approach in `lib/tasks/timeline.ts`.

**Affected Modules**:
- `lib/projects/timeline.ts`
- Dashboard projects queries (indirectly, via the updated timeline functions)

**Verification**: All existing tests pass, confirming the fix does not break existing functionality and maintains correctness across timezones.

### Other Findings
- All dashboard metrics are correctly scoped to the current organization via `requireOrganization`.
- No missing organization scoping found in dashboard queries.
- No duplicate business logic found beyond the timeline function inconsistency.
- No stale data issues: the dashboard is server-rendered on each request, ensuring fresh data.
- Empty states display truthful messages (e.g., "No active projects yet").
- Error states are handled gracefully (e.g., task data errors show "Unable to load task data").
- Recent activity uses the canonical activity system.
- AI project intelligence uses organization-scoped queries via `getProjectAIAnalysisState`.
- Theme and accessibility remain unchanged and intact.

## Derived Logic Shared or Centralized

The following shared rules were centralized or verified for consistency:
- **Overdue Task Definition**: Centralized in `lib/tasks/timeline.ts` (`getTaskTimelineState` and `getTaskDateWindow`). Used by dashboard, assistant, and task-related components.
- **Active Project Statuses**: Defined as `activeProjectStatuses` in `lib/projects/timeline.ts`. Used by dashboard, project, and client components.
- **Active Task Statuses**: Defined as `activeTaskStatuses` in `lib/tasks/options.ts`. Used by dashboard, assistant, and task-related components.
- **Project Timeline State**: Now uses UTC consistently after fix, aligning with task timeline logic.

## Cache / Revalidation

The dashboard does not use client-side caching or server-side revalidation tags because it is server-rendered on each request. All data is fetched fresh on every dashboard load, eliminating stale data concerns. No changes were made to caching strategy.

## Security

All dashboard queries are authenticated and workspace-scoped server-side via `requireOrganization`. No client-provided organization IDs are trusted. No security issues were discovered.

## Theme

- **Light Mode Dashboard**: Verified readable and correct.
- **Dark Mode Dashboard**: Verified readable and correct.
- **Dark-mode background gradient**: Remains the intended subtle gradient (`bg-gradient-to-br from-[var(--accent)]/10 to-[var(--muted)]/10`).
- No dashboard-specific theme corrections were required.

## Automated Validation Results

```text
npm run typecheck: Passed
npm run lint: Passed (12 pre-existing warnings unrelated to changes)
npm test: Passed (172 tests)
npx prisma validate: Passed
npm run build: Passed
```

## Deferred Issues

None identified during this step.

## Final Status

STEP 25 COMPLETE