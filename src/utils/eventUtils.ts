// Event Type Configurations
import { EventType } from '@/types/event';
import type { EventTypeConfigMap } from '@/types/event';

// Import icons
import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
// celebrationIcon removed - HOLIDAY event type no longer supported

export const EVENT_TYPE_CONFIG: Partial<EventTypeConfigMap> = {
  [EventType.MEMORIAL]: {
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
    label: 'Sinh nhật',
    icon: NonCategorizedIcon,
    color: '#1677FF',
  },
  [EventType.OTHER]: {
    label: 'Khác',
    icon: mapOtherIcon,
    color: '#FAAD14',
  },
  // Legacy support for FUNERAL (alias for MEMORIAL)
  [EventType.FUNERAL]: {
    label: 'Ma chay, giỗ',
    icon: mapIcon,
    color: '#9B51E0',
  },
};

const SUPPORTED_EVENT_TYPES: EventType[] = [
  EventType.MEMORIAL,
  EventType.WEDDING,
  EventType.BIRTHDAY,
  EventType.OTHER,
];

export const normalizeEventType = (eventType: number | string | null | undefined): EventType => {
  if (typeof eventType === 'string') {
    const upper = eventType.toUpperCase();
    // Handle legacy FUNERAL as MEMORIAL
    if (upper === 'FUNERAL') {
      return EventType.MEMORIAL;
    }
    if (SUPPORTED_EVENT_TYPES.includes(upper as EventType)) {
      return upper as EventType;
    }
    switch (upper) {
      case EventType.MEETING:
      case EventType.GATHERING:
        return EventType.OTHER;
      default:
        return EventType.OTHER;
    }
  }

  // Map backend numbers to frontend EventType enum
  // Backend: Memorial=1, Wedding=2, Birthday=3, Other=4
  switch (eventType) {
    case 1:
      return EventType.MEMORIAL;  // "Ma chay, giỗ"
    case 2:
      return EventType.WEDDING;   // "Cưới hỏi"
    case 3:
      return EventType.BIRTHDAY;  // "Sinh nhật"
    case 4:
      return EventType.OTHER;     // "Khác"
    // Legacy support for old mapping (0 = FUNERAL/MEMORIAL)
    case 0:
      return EventType.MEMORIAL;
    default:
      return EventType.OTHER;
  }
};

// Event Type Labels
export const EVENT_TYPE_LABELS: Partial<Record<EventType, string>> = {
  [EventType.MEMORIAL]: 'Ma chay, giỗ',
  [EventType.WEDDING]: 'Cưới hỏi',
  [EventType.BIRTHDAY]: 'Sinh nhật',
  [EventType.OTHER]: 'Khác',
  // Legacy support
  [EventType.FUNERAL]: 'Ma chay, giỗ',
};

// Recurrence Type Labels
export const RECURRENCE_TYPE_LABELS = {
  ONCE: 'Một lần',
  DAILY: 'Hàng ngày',
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
