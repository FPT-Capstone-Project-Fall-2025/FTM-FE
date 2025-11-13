// Event Type Configurations
import { EventType } from '@/types/event';
import type { EventTypeConfigMap } from '@/types/event';

// Import icons
import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
import celebrationIcon from '@/assets/img/icon/celebration.svg';

export const EVENT_TYPE_CONFIG: Partial<EventTypeConfigMap> = {
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
    label: 'Sinh nhật - Mừng thọ',
    icon: NonCategorizedIcon,
    color: '#1677FF',
  },
  [EventType.HOLIDAY]: {
    label: 'Ngày lễ',
    icon: celebrationIcon,
    color: '#fa8c16',
  },
  [EventType.OTHER]: {
    label: 'Khác',
    icon: mapOtherIcon,
    color: '#FAAD14',
  },
};

const SUPPORTED_EVENT_TYPES: EventType[] = [
  EventType.FUNERAL,
  EventType.WEDDING,
  EventType.BIRTHDAY,
  EventType.HOLIDAY,
  EventType.OTHER,
];

export const normalizeEventType = (eventType: number | string | null | undefined): EventType => {
  if (typeof eventType === 'string') {
    const upper = eventType.toUpperCase();
    if (SUPPORTED_EVENT_TYPES.includes(upper as EventType)) {
      return upper as EventType;
    }
    switch (upper) {
      case EventType.MEMORIAL:
      case EventType.MEETING:
      case EventType.GATHERING:
        return EventType.OTHER;
      default:
        return EventType.OTHER;
    }
  }

  switch (eventType) {
    case 0:
      return EventType.FUNERAL;
    case 1:
      return EventType.WEDDING;
    case 2:
      return EventType.BIRTHDAY;
    case 3:
      return EventType.HOLIDAY;
    case 4:
    case 5:
    case 6:
    case 7:
    default:
      return EventType.OTHER;
  }
};

// Event Type Labels
export const EVENT_TYPE_LABELS: Partial<Record<EventType, string>> = {
  [EventType.FUNERAL]: 'Ma chay, giỗ',
  [EventType.WEDDING]: 'Cưới hỏi',
  [EventType.BIRTHDAY]: 'Sinh nhật - Mừng thọ',
  [EventType.HOLIDAY]: 'Ngày lễ',
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
  return EVENT_TYPE_CONFIG[eventType]?.color || EVENT_TYPE_CONFIG[EventType.OTHER]?.color || '#FAAD14';
};

// Get event type label
export const getEventTypeLabel = (eventType: EventType): string => {
  return EVENT_TYPE_CONFIG[eventType]?.label || EVENT_TYPE_CONFIG[EventType.OTHER]?.label || 'Khác';
};

// Get event type icon
export const getEventTypeIcon = (eventType: EventType): string => {
  return EVENT_TYPE_CONFIG[eventType]?.icon || EVENT_TYPE_CONFIG[EventType.OTHER]?.icon || mapOtherIcon;
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
