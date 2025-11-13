// Event Types and Enums
export enum EventType {
  FUNERAL = 'FUNERAL',
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
  MEETING = 'MEETING',
  MEMORIAL = 'MEMORIAL',
  GATHERING = 'GATHERING',
}

// API Event Type Numbers
export enum EventTypeNumber {
  FUNERAL = 0,
  WEDDING = 1,
  BIRTHDAY = 2,
  HOLIDAY = 3,
  MEMORIAL = 4,
  MEETING = 5,
  GATHERING = 6,
  OTHER = 7,
}

export enum RecurrenceType {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// API Recurrence Type Numbers
export enum RecurrenceTypeNumber {
  NONE = 0,
  ONCE = 0,
  DAILY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
  YEARLY = 4,
}

export enum ViewMode {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  LIST = 'list',
}

// Event Type Configuration
export interface EventTypeConfig {
  label: string;
  icon: string;
  color: string;
}

export type EventTypeConfigMap = Partial<Record<EventType, EventTypeConfig>>;

// Weather Data
export interface WeatherData {
  icon: string;
  temp: string;
}

export interface DailyForecast {
  forecastDate: string;
  weatherIcon: string;
  tempDay: number;
  tempNight?: number;
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

// Location Data
export interface LocationData {
  name: string;
  code: string;
  lat?: number;
  lon?: number;
}

// Event Member
export interface EventMember {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

// GP (Group) Data
export interface GPData {
  id: string;
  name: string;
  description?: string;
}

// Event Filter Request (for POST /api/ftfamilyevent/filter)
export interface EventFilterRequest {
  ftId?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  ftMemberId?: string; // Family tree member ID for filtering events by specific member
  eventType?: string; // EventType enum value
  searchTerm?: string; // Search term for event name/description
  isLunar?: boolean;
  skip?: number; // Page offset (for pagination)
  take?: number; // Page size (for pagination)
  pageIndex?: number; // Legacy pagination
  pageSize?: number; // Legacy pagination
}

// Base Event Interface
export interface BaseEvent {
  id: string;
  name: string;
  eventType: EventType;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  description?: string;
  location?: string;
  address?: string;
  locationName?: string;
  imageUrl?: string;
  recurrence: RecurrenceType;
  recurrenceEndTime?: string | Date | null;
  isLunar?: boolean;
}

// Family Event (from API)
export interface FamilyEvent extends BaseEvent {
  gpId?: string;
  gpIds?: string[];
  gpName?: string;
  gpNames?: string[];
  members?: string[];
  memberNames?: string[];
  isOwner: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Calendar Event (for FullCalendar)
export interface CalendarEvent extends FamilyEvent {
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  type: EventType;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: Record<string, any>;
}

// Event Form Data
export interface EventFormData {
  name: string;
  eventType: EventType | string;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  location?: string | null;
  address?: string | null;
  recurrence: RecurrenceType | string;
  recurrenceEndTime?: string | Date | null;
  members?: string[];
  gpIds?: string[];
  description?: string | null;
  imageUrl?: string | null;
  isLunar?: boolean;
}

// Event Filters
export interface EventFilters {
  eventType?: EventType[];
  eventGp?: string[];
  eventLocation?: LocationData | null;
  search?: string;
  date?: Date | null;
  year?: number;
  month?: number;
  week?: number;
}

// API Response Types
export interface GetEventsResponse {
  gpFamilyEvents: FamilyEvent[];
  dailyForecasts?: DailyForecast[];
}

export interface EventStatisticsData {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents?: number;
  eventsByType?: Record<EventType, number>;
}

// Calendar Config
export interface CalendarConfig {
  showLunar: boolean;
  viewWeather: boolean;
  defaultView?: ViewMode;
}

// Event Modal Props
export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: FamilyEvent | null;
  onSave?: (event: EventFormData) => void;
  onDelete?: (eventId: string, deleteAll: boolean) => void;
}

// Event Sidebar Props
export interface EventSidebarProps {
  handleFilter: (filters: EventFilters) => void;
  setIsShowLunarDay: (show: boolean) => void;
  setIsOpenGPEventDetailsModal: (open: boolean) => void;
  setEventSelected: (event: FamilyEvent | null) => void;
}

// Calendar Props
export interface CalendarComponentProps {
  year: number;
  month: number;
  week?: number;
  reload?: boolean;
  eventFilters?: EventFilters;
  isShowLunarDay?: boolean;
  viewWeather?: boolean;
  setEventSelected: (event: FamilyEvent | null) => void;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  handleSelect?: (selectInfo: any) => void;
}

// Select Info for calendar selection
export interface CalendarSelectInfo {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  allDay: boolean;
  jsEvent: MouseEvent;
  view: any;
}

// Event Click Info
export interface EventClickInfo {
  el: HTMLElement;
  event: any;
  jsEvent: MouseEvent;
  view: any;
}

// Create/Update Event Payload
export interface CreateEventPayload extends EventFormData {
  id?: string;
}

export interface UpdateEventPayload extends CreateEventPayload {
  id: string;
}

// Delete Event Payload
export interface DeleteEventPayload {
  id: string;
  isDeleteAll: boolean;
}

// API Create Event Payload (matches backend API)
export interface ApiCreateEventPayload {
  name: string;
  eventType: number; // 0-7 (FUNERAL=0, WEDDING=1, BIRTHDAY=2, HOLIDAY=3, MEMORIAL=4, MEETING=5, GATHERING=6, OTHER=7)
  startTime: string; // ISO 8601 format: "2025-10-26T16:45:31.088Z"
  endTime: string; // ISO 8601 format: "2025-10-26T16:45:31.088Z"
  location: string | null;
  recurrenceType: number; // 0=none/once, 1=daily, 2=weekly, 3=monthly, 4=yearly
  ftId: string; // family tree ID (UUID)
  description: string | null;
  imageUrl: string | null;
  referenceEventId: string | null; // reference to another event (UUID)
  address: string | null;
  locationName: string | null;
  isAllDay: boolean;
  recurrenceEndTime: string | null; // ISO 8601 format or null
  isLunar: boolean;
  targetMemberId: string | null; // null = all members, specific UUID = that member only
  isPublic: boolean;
  memberIds: string[]; // array of member IDs (UUIDs) to tag
}

// API Event Response (from backend)
export interface ApiEventResponse {
  id: string;
  name: string;
  eventType: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  recurrenceType: string; // "None", "Daily", etc.
  ftId: string;
  description?: string | null;
  imageUrl?: string | null;
  referenceEventId?: string | null;
  address?: string | null;
  locationName?: string | null;
  isAllDay: boolean;
  recurrenceEndTime?: string | null;
  isLunar: boolean;
  targetMemberId?: string | null;
  targetMemberName?: string | null;
  isPublic: boolean;
  isOwner?: boolean; // Whether current user is the owner of this event
  createdOn: string;
  lastModifiedOn: string;
  eventMembers: any[];
}
