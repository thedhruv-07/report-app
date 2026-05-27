# Report App — Detailed Audit Checklist

## User Flows
- [ ] Can a user select a date range and see updated data immediately?
- [ ] Are filters applied correctly and reflected in all charts/tables on the page?
- [ ] Can a user drill down into a data point for more detail?
- [ ] Can a user export the report (PDF, CSV, Excel)?
- [ ] Are reports shareable (link, email)?
- [ ] Does the page remember filters on refresh (URL params or localStorage)?

## Data Correctness
- [ ] Totals in summary cards match the sum in detail tables
- [ ] Chart data matches table data (same filters applied)
- [ ] Percentages add up to 100% where expected
- [ ] "No data" periods shown as 0, not gaps in charts
- [ ] Date ranges are inclusive of start and end day

## Performance
- [ ] Large datasets paginated (not loading 10,000 rows at once)
- [ ] Charts use aggregated data from server, not raw rows
- [ ] Filters trigger a new API call, not client-side filtering of a giant array
- [ ] Debounce on search/filter inputs (don't hit API on every keystroke)
- [ ] Memoized expensive chart computations

## UI Components
- [ ] All charts have: title, axis labels, legend, tooltips on hover
- [ ] Date range picker shows clear start/end labels
- [ ] Filter panel is collapsible on mobile
- [ ] Table columns are sortable with visual sort indicator
- [ ] Table is paginated with page size selector
- [ ] Numbers formatted with locale (commas, currency symbols)
- [ ] Percentages shown with % sign
- [ ] Loading skeleton shown while data fetches
- [ ] Empty state with helpful message when no data matches filters
- [ ] Error state with retry button if API fails

## API Design
- [ ] Report endpoint accepts: startDate, endDate, filters[], groupBy, page, pageSize
- [ ] Response includes: data[], total, page, pageSize, summary{}
- [ ] Slow queries cached (Redis or in-memory) for common date ranges
- [ ] Query uses indexed columns for date range filtering

## Export Feature
- [ ] Export applies same filters as current view
- [ ] CSV includes all columns (not just visible ones)
- [ ] PDF export matches the on-screen layout
- [ ] Export filename includes date range: report_2024-01-01_2024-01-31.csv

## Common Bugs in Report Apps
- Filter change updates one chart but not another (filter state not shared)
- "Last 30 days" off-by-one (today not included or double-included)
- Chart tooltip shows raw data key instead of human-readable label
- Table sort resets to page 1 but doesn't refetch — shows wrong page data
- Export button exports previous filter state (async state update race condition)
- Large number rendering: 1000000 shown instead of 1,000,000
- Negative values in charts displayed as 0 (clamped incorrectly)
- Timezone: report shows UTC dates but user expects local timezone