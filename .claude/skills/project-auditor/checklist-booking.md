# Booking App — Detailed Audit Checklist

## User Flows
- [ ] Can a new user register and immediately book?
- [ ] Can a returning user log in and see past bookings?
- [ ] Is the date/time selection UX clear (no ambiguity in AM/PM, timezone)?
- [ ] Is the service/resource selection step easy to understand?
- [ ] Is there a clear price breakdown before confirming?
- [ ] Is there a cancellation/reschedule option post-booking?
- [ ] Does the user receive confirmation (on-screen + email)?

## Validation
- [ ] Frontend validates required fields before submit
- [ ] Backend re-validates all inputs (don't trust frontend only)
- [ ] Overlapping/double-booking is prevented at DB level
- [ ] Past dates cannot be booked
- [ ] Max booking limits are enforced (per day, per user, etc.)

## Data Model Checks
- [ ] Booking record has: userId, resourceId, startTime, endTime, status, createdAt
- [ ] Status transitions are valid: pending → confirmed → cancelled (no invalid jumps)
- [ ] Soft deletes vs hard deletes — is cancelled different from deleted?
- [ ] Timezone stored correctly (UTC in DB, displayed in user's local timezone)

## API Endpoints
- [ ] POST /bookings — creates booking, checks for conflicts
- [ ] GET /bookings — returns user's bookings (paginated)
- [ ] GET /bookings/:id — returns single booking (auth check: owner only)
- [ ] PATCH /bookings/:id — update/reschedule (validates new slot)
- [ ] DELETE /bookings/:id — cancel (sets status = cancelled, doesn't delete row)
- [ ] GET /availability — returns open slots (efficient query, not loading all bookings)

## UI Components
- [ ] Calendar/date picker shows unavailable slots as disabled
- [ ] Booking card shows: service name, date, time, status badge, actions
- [ ] Status badge uses color coding (pending=yellow, confirmed=green, cancelled=red)
- [ ] Loading skeleton shown while fetching bookings
- [ ] Empty state shown when user has no bookings
- [ ] Error message shown if booking fails

## Edge Cases
- [ ] What happens if two users book the last slot simultaneously? (race condition)
- [ ] What if payment fails after slot is reserved?
- [ ] What if the service/resource is deleted while a booking exists?
- [ ] What if the user is deleted — are their bookings cleaned up?

## Common Bugs to Check in Booking Apps
- Off-by-one in time slot generation (e.g., last slot of day missing)
- Timezone conversion bugs (booking at 11 PM showing next day)
- Missing index on (resourceId, startTime, endTime) causing slow availability checks
- Not clearing selected slot when user navigates back
- Confirmation screen reachable without completing booking form