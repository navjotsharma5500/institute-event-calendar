const IST_TIME_ZONE = 'Asia/Kolkata';

function toMinutes(timeStr) {
  const [hours = 0, minutes = 0] = (timeStr || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getIstParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map = {};
  for (const part of parts) map[part.type] = part.value;

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function computeStatus({ startDate, endDate, startTime, endTime }, todayStr, nowMinutes) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const overnight = endMinutes < startMinutes;

  if (!overnight) {
    if (todayStr < startDate) return 'Upcoming';
    if (todayStr > endDate) return 'Completed';
    if (nowMinutes < startMinutes) return 'Upcoming';
    if (nowMinutes <= endMinutes) return 'Live';
    return todayStr === endDate ? 'Completed' : 'Active';
  }

  const singleDay = startDate === endDate;
  // A same-date overnight record has no room for its own tail inside its
  // recorded range, so its one occurrence is treated as closing the next
  // morning; multi-day records close exactly at the recorded endDate/endTime.
  const lastStartDay = singleDay ? endDate : addDays(endDate, -1);
  const finalTailDay = singleDay ? addDays(endDate, 1) : endDate;

  if (todayStr < startDate) return 'Upcoming';
  if (todayStr > finalTailDay) return 'Completed';

  const yesterday = addDays(todayStr, -1);
  const yesterdayIsValidStart = yesterday >= startDate && yesterday <= lastStartDay;
  const todayIsValidStart = todayStr >= startDate && todayStr <= lastStartDay;

  const continuationLive = yesterdayIsValidStart && nowMinutes <= endMinutes;
  const ownStartLive = todayIsValidStart && nowMinutes >= startMinutes;

  if (continuationLive || ownStartLive) return 'Live';
  if (todayStr === finalTailDay) return 'Completed';
  return 'Upcoming';
}

function getEventStatus(event, now = new Date()) {
  const { dateStr, minutes } = getIstParts(now);
  return computeStatus(event, dateStr, minutes);
}

module.exports = { getEventStatus, computeStatus };
