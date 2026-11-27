export const two = (v: number) => String(v).padStart(2, '0');
export function seoulToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (key: string) => parts.find(p => p.type === key)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const lengths = [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= lengths[m-1];
}
export function monthCells(month: string): (number | null)[] {
  const [y,m] = month.split('-').map(Number);
  const first = new Date(0); first.setUTCFullYear(y,m-1,1); first.setUTCHours(0,0,0,0);
  const end = new Date(first); end.setUTCMonth(m,0);
  const offset = (first.getUTCDay()+6)%7, length = end.getUTCDate();
  return Array.from({length: Math.ceil((offset+length)/7)*7},(_,i)=>i>=offset && i<offset+length ? i-offset+1 : null);
}
export function moveMonth(month: string, delta: number) {
  const [y,m] = month.split('-').map(Number), n = (y-1)*12+m-1+delta;
  if (n<0 || n>=9999*12) return month;
  return `${String(Math.floor(n/12)+1).padStart(4,'0')}-${two(n%12+1)}`;
}
export const dateLabel = (value: string) => { const [,m,d] = value.split('-').map(Number); return `${m}월 ${d}일`; };
export function seoulTime(value: string | null) {
  if (!value) return '기록 없음';
  const d = new Date(value); if (!Number.isFinite(d.getTime())) return '기록 없음';
  return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
}
export function durationLabel(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '기록 없음';
  const n = Math.floor(seconds); if (n<60) return `${n}초`;
  const min = Math.floor(n/60); return min<60 ? `${min}분` : `${Math.floor(min/60)}시간 ${min%60}분`;
}
export function goalValid(goal: string) { const n = [...goal.trim()].length; return n>=1 && n<=30; }
export type CalendarMark = { date: string; hasCompletedLearning: boolean; hasScheduledLearning: boolean; completedCount: number; scheduledCount: number };
export function previewDates(days: CalendarMark[], selected: string, today: string) {
  const others = days.filter(d=>d.date!==selected).sort((a,b)=>a.date.localeCompare(b.date));
  const completedDays = others.filter(d=>d.hasCompletedLearning);
  const completed = completedDays[completedDays.length-1]?.date;
  const planned = others.filter(d=>d.hasScheduledLearning);
  const upcoming = (planned.find(d=>d.date>=today) ?? planned[planned.length-1])?.date;
  return [...new Set([completed,upcoming].filter((d): d is string=>!!d))];
}
