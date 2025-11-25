import viLocale from "@fullcalendar/core/locales/vi";
import moment from "moment";
import "moment/locale/vi";

/**
 * Vietnamese Calendar Configuration
 * 
 * Base configuration for all Vietnamese calendar components.
 * This provides consistent Vietnamese localization across all calendar views.
 */

// Configure moment.js for Vietnamese
moment.locale("vi");
moment.updateLocale("vi", {
  months: [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ],
  monthsShort: [
    "Th01", "Th02", "Th03", "Th04", "Th05", "Th06",
    "Th07", "Th08", "Th09", "Th10", "Th11", "Th12"
  ],
  weekdays: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  week: {
    dow: 1, // Monday as first day of week
    doy: 4  // First week contains Jan 4th
  }
});

/**
 * Vietnamese locale configuration for FullCalendar
 * Uses the built-in viLocale from FullCalendar which already includes
 * Vietnamese translations for month names, day names, etc.
 */
export const vietnameseCalendarLocale = viLocale;

/**
 * Common Vietnamese Calendar Configuration
 * Shared props for all Vietnamese calendar components
 */
export const commonVietnameseCalendarConfig = {
  locale: vietnameseCalendarLocale,
  firstDay: 1 as const, // Monday as first day
  // Common interaction settings
  selectable: true,
  selectMirror: true,
  unselectAuto: true,
  editable: false,
  // Common date formats
  slotLabelFormat: {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    hour12: false,
  },
  // Common time settings
  slotMinTime: "00:00:00",
  slotMaxTime: "24:00:00",
  scrollTime: "08:00:00",
  slotDuration: "01:00:00",
  slotLabelInterval: "01:00",
  nowIndicator: true,
  allDaySlot: true,
  allDayText: "Cả ngày",
  headerToolbar: false as const, // Custom header is handled by parent component
  height: "auto",
  contentHeight: "auto",
};

/**
 * Format date in Vietnamese format
 */
export const formatVietnameseDate = (date: Date | string | moment.Moment, format: string = "dddd, DD/MM/YYYY"): string => {
  return moment(date).locale("vi").format(format);
};

/**
 * Format time in Vietnamese format
 */
export const formatVietnameseTime = (date: Date | string | moment.Moment, format: string = "HH:mm"): string => {
  return moment(date).locale("vi").format(format);
};

/**
 * Format date and time in Vietnamese format
 */
export const formatVietnameseDateTime = (date: Date | string | moment.Moment, format: string = "dddd, DD/MM/YYYY - HH:mm"): string => {
  return moment(date).locale("vi").format(format);
};

/**
 * Get Vietnamese day name
 */
export const getVietnameseDayName = (date: Date | string | moment.Moment): string => {
  return moment(date).locale("vi").format("dddd");
};

/**
 * Get Vietnamese month name
 */
export const getVietnameseMonthName = (date: Date | string | moment.Moment): string => {
  return moment(date).locale("vi").format("MMMM");
};

/**
 * Get Vietnamese year
 */
export const getVietnameseYear = (date: Date | string | moment.Moment): string => {
  return moment(date).locale("vi").format("YYYY");
};

export default {
  vietnameseCalendarLocale,
  commonVietnameseCalendarConfig,
  formatVietnameseDate,
  formatVietnameseTime,
  formatVietnameseDateTime,
  getVietnameseDayName,
  getVietnameseMonthName,
  getVietnameseYear,
};

