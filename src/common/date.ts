export function getDateKey(now = new Date()) {
  const timeZone = process.env['APP_TIMEZONE'] ?? 'Asia/Shanghai';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}
