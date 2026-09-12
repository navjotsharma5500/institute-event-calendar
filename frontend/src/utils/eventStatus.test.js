import test from 'node:test'
import assert from 'node:assert/strict'
import { getEventStatus } from './eventStatus.js'

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

function ist(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS)
}

test('overnight multi-day: mid-range, currently within today\'s own slot => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 48)), 'Live')
})

test('non-overnight multi-day: within daily window => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 15, 0)), 'Live')
})

test('non-overnight multi-day: after today\'s window, more days remain => Active', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 18, 0)), 'Active')
})

test('within overall range but today\'s slot not started => Upcoming', () => {
  const event = { startDate: '2025-09-10', endDate: '2025-09-13', startTime: '17:00', endTime: '20:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 48)), 'Upcoming')
})

test('final day, exact end minute is inclusive => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 17, 0)), 'Live')
})

test('immediately after final end => Completed', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 17, 1)), 'Completed')
})

test('startTime === endTime is a zero-length instant, not 24 hours', () => {
  const event = { startDate: '2025-09-12', endDate: '2025-09-12', startTime: '08:00', endTime: '08:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 47)), 'Completed')
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 0)), 'Live')
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 7, 59)), 'Upcoming')
})

test('single-day, before start time => Upcoming', () => {
  const event = { startDate: '2025-09-12', endDate: '2025-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 7, 59)), 'Upcoming')
})

test('single-day, at exact start minute => Live', () => {
  const event = { startDate: '2025-09-12', endDate: '2025-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 0)), 'Live')
})

test('overnight, mid-range, late night continuation of today\'s own slot => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 23, 0)), 'Live')
})

test('overnight, mid-range, early morning continuation from previous valid day => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 1, 0)), 'Live')
})

test('overnight, mid-range, gap before today\'s slot begins => Upcoming', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 3, 0)), 'Upcoming')
})

test('overnight, first event date, before first start (no prior occurrence) => Upcoming', () => {
  const event = { startDate: '2025-09-12', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 1, 0)), 'Upcoming')
})

test('overnight, final event date, early morning tail => Live', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 14, 1, 0)), 'Live')
  assert.equal(getEventStatus(event, ist(2025, 9, 14, 2, 0)), 'Live')
})

test('overnight, final event date, after tail end => Completed', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 14, 2, 1)), 'Completed')
  assert.equal(getEventStatus(event, ist(2025, 9, 14, 5, 0)), 'Completed')
})

test('future date, well before event => Upcoming', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 1, 12, 0)), 'Upcoming')
})

test('past final date, well after event => Completed', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 20, 12, 0)), 'Completed')
})

test('same-date overnight record extends its tail to the following morning', () => {
  const event = { startDate: '2025-09-12', endDate: '2025-09-12', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 1, 0)), 'Upcoming')
  assert.equal(getEventStatus(event, ist(2025, 9, 12, 8, 48)), 'Live')
  assert.equal(getEventStatus(event, ist(2025, 9, 13, 1, 0)), 'Live')
  assert.equal(getEventStatus(event, ist(2025, 9, 13, 2, 0)), 'Live')
  assert.equal(getEventStatus(event, ist(2025, 9, 13, 3, 0)), 'Completed')
})

test('changing `now` changes the derived status without any data refetch', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '17:00' }
  const before = getEventStatus(event, ist(2025, 9, 12, 16, 59))
  const after = getEventStatus(event, ist(2025, 9, 12, 17, 1))
  assert.equal(before, 'Live')
  assert.equal(after, 'Active')
})

test('only ever returns one of the four allowed lifecycle values', () => {
  const event = { startDate: '2025-09-07', endDate: '2025-09-14', startTime: '08:00', endTime: '02:00' }
  const allowed = new Set(['Upcoming', 'Live', 'Active', 'Completed'])
  for (let day = 1; day <= 20; day++) {
    for (let hour = 0; hour < 24; hour += 3) {
      assert.ok(allowed.has(getEventStatus(event, ist(2025, 9, day, hour, 0))))
    }
  }
})
