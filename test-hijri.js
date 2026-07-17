// test-hijri.js
function getHijriDate(date, offsetDays = 0) {
  const workingDate = new Date(date.getTime());
  workingDate.setDate(workingDate.getDate() + offsetDays);

  const gYear = workingDate.getFullYear();
  const gMonth = workingDate.getMonth() + 1; // 1-indexed
  const gDay = workingDate.getDate();

  let y = gYear;
  let m = gMonth;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = Math.floor(a / 4);
  let c = 2 - a + b;
  const e = Math.floor(365.25 * (y + 4716));
  const f = Math.floor(30.6001 * (m + 1));
  let jd = c + gDay + e + f - 1524.5;

  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    c = 2 - alpha + Math.floor(alpha / 4);
    jd = c + gDay + e + f - 1524.5;
  }

  const jdn = Math.floor(jd + 0.5);

  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lRemainder = l - 10631 * n + 354;
  
  const j = (Math.floor((10985 - lRemainder) / 5316)) * (Math.floor((50 * lRemainder) / 17719)) + 
            (Math.floor(lRemainder / 5670)) * (Math.floor((43 * lRemainder) / 15238));
  
  const lAdjusted = lRemainder - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - 
                    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  const hMonth = Math.floor((24 * lAdjusted) / 709);
  const hDay = lAdjusted - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  return {
    day: hDay,
    month: hMonth,
    year: hYear
  };
}

// Let's test all dates from Jan 1 2020 to Dec 31 2030
const start = new Date(2020, 0, 1);
const end = new Date(2030, 11, 31);
let current = new Date(start);

let prevH = getHijriDate(current);
let issues = 0;

while (current <= end) {
  current.setDate(current.getDate() + 1);
  const h = getHijriDate(current);
  
  // Check if day is invalid
  if (h.day < 1 || h.day > 30) {
    console.log(`Invalid day: ${current.toISOString().split('T')[0]} -> ${h.day}/${h.month}/${h.year}`);
    issues++;
  }
  
  // Check if the sequence skips or duplicates within the same month/year
  if (h.month === prevH.month && h.year === prevH.year) {
    const diff = h.day - prevH.day;
    if (diff !== 1) {
      console.log(`Sequence issue: ${current.toISOString().split('T')[0]} went from ${prevH.day} to ${h.day} (diff = ${diff})`);
      issues++;
    }
  } else {
    // Month transition: previous should have been 29 or 30, and current should be 1
    if (prevH.day !== 29 && prevH.day !== 30) {
      console.log(`Short month issue: transition on ${current.toISOString().split('T')[0]} from ${prevH.day}/${prevH.month} to ${h.day}/${h.month}`);
      issues++;
    }
    if (h.day !== 1) {
      console.log(`New month start issue: transition on ${current.toISOString().split('T')[0]} from ${prevH.day}/${prevH.month} to ${h.day}/${h.month}`);
      issues++;
    }
  }
  
  prevH = h;
}

console.log(`Test complete. Total sequence issues: ${issues}`);
