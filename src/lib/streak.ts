// src/lib/streak.ts
const KEY = 'mysterybox.streak';
const LAST = 'mysterybox.last';

export function loadStreak(): number {
  const s = Number(localStorage.getItem(KEY) || '0');
  return Number.isFinite(s) ? s : 0;
}

export function updateStreakOnVisit(): number {
  const today = new Date();
  const lastStr = localStorage.getItem(LAST);
  if (!lastStr) {
    localStorage.setItem(KEY, '1');
    localStorage.setItem(LAST, today.toDateString());
    return 1;
  }
  const last = new Date(lastStr);
  const diffDays = Math.floor((today.setHours(0,0,0,0) - last.setHours(0,0,0,0)) / 86400000);
  let streak = loadStreak();
  if (diffDays === 0) {
    // same day => unchanged
  } else if (diffDays === 1) {
    streak += 1;
  } else if (diffDays > 1) {
    streak = 1; // reset
  }
  localStorage.setItem(KEY, String(streak));
  localStorage.setItem(LAST, new Date().toDateString());
  return streak;
}
