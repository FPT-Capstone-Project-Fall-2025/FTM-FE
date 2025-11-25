// Lunar calendar utilities using lunar-javascript package
import { Solar } from 'lunar-javascript';

export interface LunarDate {
  date: () => number;
  month: () => number;
  year: () => number;
  toString: () => string;
}

/**
 * Convert solar date to lunar date
 * @param date - Solar date (Date object or ISO string)
 * @returns LunarDate object with date, month, year
 */
export function getLunarDate(date: Date | string): LunarDate {
  try {
    const solarDate = typeof date === 'string' ? new Date(date) : date;
    
    // Create Solar object from Date
    const solar = Solar.fromDate(solarDate);
    
    // Convert to Lunar
    const lunar = solar.getLunar();
    
    return {
      date: () => lunar.getDay(),
      month: () => lunar.getMonth(),
      year: () => lunar.getYear(),
      toString: () => `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} (AL)`,
    };
  } catch (error) {
    console.error('Error converting to lunar date:', error);
    // Return fallback empty values
    return {
      date: () => 0,
      month: () => 0,
      year: () => 0,
      toString: () => '',
    };
  }
}

/**
 * Format lunar date to readable string
 * @param date - Solar date to convert
 * @returns Formatted lunar date string (e.g., "Ngày 15 tháng 8 năm 2025 (AL)")
 */
export function formatLunarDate(date: Date | string): string {
  const lunar = getLunarDate(date);
  const day = lunar.date();
  const month = lunar.month();
  const year = lunar.year();
  
  if (day === 0 || month === 0 || year === 0) {
    return '';
  }
  
  return `Ngày ${day} tháng ${month} năm ${year} (AL)`;
}

/**
 * Format lunar date to short readable string
 * @param date - Solar date to convert
 * @returns Short formatted lunar date string (e.g., "15/8/2025 (AL)")
 */
export function formatLunarDateShort(date: Date | string): string {
  const lunar = getLunarDate(date);
  const day = lunar.date();
  const month = lunar.month();
  const year = lunar.year();
  
  if (day === 0 || month === 0 || year === 0) {
    return '';
  }
  
  return `${day}/${month}/${year} (AL)`;
}

/**
 * Get detailed lunar information
 * @param date - Solar date to convert
 * @returns Object with lunar date details
 */
export function getLunarInfo(date: Date | string) {
  try {
    const solarDate = typeof date === 'string' ? new Date(date) : date;
    const solar = Solar.fromDate(solarDate);
    const lunar = solar.getLunar();
    
    return {
      day: lunar.getDay(),
      month: lunar.getMonth(),
      year: lunar.getYear(),
      monthInChinese: lunar.getMonthInChinese(),
      dayInChinese: lunar.getDayInChinese(),
      yearInGanZhi: lunar.getYearInGanZhi(),
      yearInChinese: lunar.getYearInChinese(),
      formatted: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} (AL)`,
      fullChinese: `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
    };
  } catch (error) {
    console.error('Error getting lunar info:', error);
    return null;
  }
}

/**
 * Extends moment object with lunar() method
 */
export function addLunarToMoment(moment: any) {
  if (!moment.fn.lunar) {
    moment.fn.lunar = function() {
      return getLunarDate(this.toDate());
    };
  }
}
