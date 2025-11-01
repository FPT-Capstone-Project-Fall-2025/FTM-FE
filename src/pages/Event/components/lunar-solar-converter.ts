/**
 * Chuyển đổi lịch Âm Dương Việt Nam
 * Thuật toán dựa theo công thức thiên văn (Jean Meeus)
 * Độ chính xác đủ cho lịch dân dụng Việt Nam (bao gồm năm nhuận, tháng nhuận)
 * Múi giờ cố định: Việt Nam (UTC+7)
 */

const TIME_ZONE = 7;

// ===================== 1. Julian Day Number =====================
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  const jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  return jd;
}

function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a = jd + 32044;
  let b = Math.floor((4 * a + 3) / 146097);
  let c = a - Math.floor((146097 * b) / 4);
  let d = Math.floor((4 * c + 3) / 1461);
  let e = c - Math.floor((1461 * d) / 4);
  let m = Math.floor((5 * e + 2) / 153);
  let day = e - Math.floor((153 * m + 2) / 5) + 1;
  let month = m + 3 - 12 * Math.floor(m / 10);
  let year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

// ===================== 2. New Moon (trăng non) =====================
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180.0;
  let Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * M * dr) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(2 * Mpr * dr) -
    0.0004 * Math.sin(3 * Mpr * dr) +
    0.0104 * Math.sin(2 * F * dr) -
    0.0051 * Math.sin((M + Mpr) * dr) -
    0.0074 * Math.sin((M - Mpr) * dr) +
    0.0004 * Math.sin((2 * F + M) * dr) -
    0.0004 * Math.sin((2 * F - M) * dr) -
    0.0006 * Math.sin((2 * F + Mpr) * dr) +
    0.0010 * Math.sin((2 * F - Mpr) * dr) +
    0.0005 * Math.sin((2 * Mpr) * dr);
  const delta =
    T < -11
      ? 0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  const JdNew = Jd1 + C1 - delta;
  return JdNew;
}

function getNewMoonDay(k: number): number {
  return Math.floor(newMoon(k) + 0.5 + TIME_ZONE / 24.0);
}

// ===================== 3. Mặt Trời – Tiết khí =====================
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180.0;
  const M =
    357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL =
    (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.000290 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = (L + 360) % 360;
  return L;
}

function getSunLongitudeInt(jdn: number): number {
  return Math.floor(sunLongitude(jdn - TIME_ZONE / 24.0) / 30);
}

// ===================== 4. Tìm tháng 11 âm lịch =====================
function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  const sunLong = getSunLongitudeInt(nm);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}

// ===================== 5. Tính offset tháng nhuận =====================
function getLeapMonthOffset(a11: number): number {
  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = getSunLongitudeInt(getNewMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = getSunLongitudeInt(getNewMoonDay(k + i));
  } while (arc !== last && i < 15);
  return i - 1;
}

// ===================== 6. Dương -> Âm =====================
export function solarToLunar(
  dd: number,
  mm: number,
  yy: number
): { day: number; month: number; year: number; isLeap: boolean } {
  const jd = jdFromDate(dd, mm, yy);
  let a11 = getLunarMonth11(yy);
  let b11 = getLunarMonth11(yy + 1);
  let lunarYear: number;

  if (jd >= a11) {
    lunarYear = yy;
  } else {
    lunarYear = yy - 1;
    a11 = getLunarMonth11(yy - 1);
    b11 = getLunarMonth11(yy);
  }

  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k);
  let i = 0;
  while (monthStart <= jd) {
    i++;
    monthStart = getNewMoonDay(k + i);
  }
  i--;
  monthStart = getNewMoonDay(k + i);

  const lunarDay = jd - monthStart + 1;
  let lunarMonth =
    (((k + i) -
      Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853) +
      11) %
      12) +
    1;
  let isLeap = false;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (leapMonthDiff !== 0) {
      if (lunarMonth === leapMonthDiff + 1) isLeap = true;
      if (lunarMonth > leapMonthDiff + 1) lunarMonth--;
    }
  }

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap };
}

// ===================== 7. Âm -> Dương =====================
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeap: boolean
): { day: number; month: number; year: number } {
  const a11 = getLunarMonth11(lunarYear);
  const b11 = getLunarMonth11(lunarYear + 1);
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    if (isLeap && leapOff !== off) return { day: 0, month: 0, year: 0 }; // invalid
    if (leapOff !== 0 && off >= leapOff) off++;
  }

  const monthStart = getNewMoonDay(k + off);
  const jd = monthStart + lunarDay - 1;
  return jdToDate(jd);
}

// ===================== 8. Ví dụ =====================
if (require.main === module) {
  console.log("Dương 2025-11-01 → Âm:", solarToLunar(1, 11, 2025));
  console.log("Dương 2025-02-10 → Âm:", solarToLunar(10, 2, 2025));
  console.log("Âm 1/1/2025 → Dương:", lunarToSolar(1, 1, 2025, false));
}
