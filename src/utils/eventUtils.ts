// Event Type Configurations
import { EventType } from '@/types/event';
import type { EventTypeConfigMap } from '@/types/event';

// Import icons
import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
import celebrationIcon from '@/assets/img/icon/celebration.svg';
import calendarIcon from '@/assets/img/icon/calendar_today.svg';
import locationIcon from '@/assets/img/icon/location.svg';

export const EVENT_TYPE_CONFIG: EventTypeConfigMap = {
  [EventType.FUNERAL]: {
    label: 'Ma chay, giỗ',
    icon: mapIcon,
    color: '#9B51E0',
  },
  [EventType.WEDDING]: {
    label: 'Cưới hỏi',
    icon: heartHandshakeIcon,
    color: '#52c41a',
  },
  [EventType.BIRTHDAY]: {
    label: 'Mừng thọ',
    icon: NonCategorizedIcon,
    color: '#1677FF',
  },
  [EventType.HOLIDAY]: {
    label: 'Ngày lễ',
    icon: celebrationIcon,
    color: '#fa8c16',
  },
  [EventType.MEMORIAL]: {
    label: 'Tưởng niệm',
    icon: calendarIcon,
    color: '#d946ef',
  },
  [EventType.MEETING]: {
    label: 'Họp mặt',
    icon: locationIcon,
    color: '#2f54eb',
  },
  [EventType.GATHERING]: {
    label: 'Sinh hoạt',
    icon: heartHandshakeIcon,
    color: '#13c2c2',
  },
  [EventType.OTHER]: {
    label: 'Khác',
    icon: mapOtherIcon,
    color: '#FAAD14',
  },
};

// Event Type Labels
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.FUNERAL]: 'Ma chay, giỗ',
  [EventType.WEDDING]: 'Cưới hỏi',
  [EventType.BIRTHDAY]: 'Sinh nhật',
  [EventType.HOLIDAY]: 'Ngày lễ',
  [EventType.MEMORIAL]: 'Tưởng niệm',
  [EventType.MEETING]: 'Họp mặt',
  [EventType.GATHERING]: 'Sinh hoạt',
  [EventType.OTHER]: 'Khác',
};

// Recurrence Type Labels
export const RECURRENCE_TYPE_LABELS = {
  ONCE: 'Một lần',
  DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  YEARLY: 'Hàng năm',
};

// View Mode Labels
export const VIEW_MODE_LABELS = {
  year: 'Năm',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  list: 'Danh sách',
};

// Get event type color
export const getEventTypeColor = (eventType: EventType): string => {
  return EVENT_TYPE_CONFIG[eventType]?.color || EVENT_TYPE_CONFIG[EventType.OTHER].color;
};

// Get event type label
export const getEventTypeLabel = (eventType: EventType): string => {
  return EVENT_TYPE_CONFIG[eventType]?.label || 'Khác';
};

// Get event type icon
export const getEventTypeIcon = (eventType: EventType): string => {
  return EVENT_TYPE_CONFIG[eventType]?.icon || EVENT_TYPE_CONFIG[EventType.OTHER].icon;
};

// Check if event is all day
export const isAllDayEvent = (startTime: Date | string, endTime: Date | string): boolean => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startHours = start.getHours();
  const startMinutes = start.getMinutes();
  const endHours = end.getHours();
  const endMinutes = end.getMinutes();
  
  // Check if time is 00:00 to 23:59 or full day duration
  return (
    (startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59) ||
    (end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000)
  );
};

// Calculate event duration in days
export const getEventDurationDays = (startTime: Date | string, endTime: Date | string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Format event time for display
export const formatEventTime = (time: Date | string, format: string = 'HH:mm'): string => {
  const date = new Date(time);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (format === 'HH:mm') {
    return `${hours}:${minutes}`;
  }
  
  return date.toLocaleString('vi-VN');
};

// Format event date for display
export const formatEventDate = (date: Date | string, format: string = 'DD/MM/YYYY'): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return d.toLocaleDateString('vi-VN');
  }
};

// Check if event is in the past
export const isEventPast = (endTime: Date | string): boolean => {
  const end = new Date(endTime);
  const now = new Date();
  return end.getTime() < now.getTime();
};

// Check if event is upcoming (within next 7 days)
export const isEventUpcoming = (startTime: Date | string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return start.getTime() >= now.getTime() && start.getTime() <= sevenDaysFromNow.getTime();
};

// Check if event is today
export const isEventToday = (startTime: Date | string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  return (
    start.getDate() === now.getDate() &&
    start.getMonth() === now.getMonth() &&
    start.getFullYear() === now.getFullYear()
  );
};
