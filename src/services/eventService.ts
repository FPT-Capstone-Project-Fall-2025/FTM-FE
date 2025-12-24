import apiService from './apiService';
import type {
  FamilyEvent,
  UpdateEventPayload,
  DeleteEventPayload,
  GetEventsResponse,
  EventFilters,
  EventStatisticsData,
  ApiCreateEventPayload,
  ApiEventResponse,
  EventFilterRequest,
} from '@/types/event';
import type { ApiResponse } from '@/types/api';

// API Endpoints
const ENDPOINTS = {
  GET_MONTH_EVENTS: '/api/calendar/month',
  GET_WEEK_EVENTS: '/api/calendar/week',
  GET_DAY_EVENTS: '/api/calendar/day',
  GET_YEAR_EVENTS: '/api/calendar/year',
  GET_UPCOMING_EVENTS: '/api/calendar/upcoming',
  CREATE_EVENT: '/api/calendar/event',
  UPDATE_EVENT: '/api/calendar/event',
  DELETE_EVENT: '/api/calendar/event',
  GET_EVENT_DETAILS: '/ftfamilyevent/event',
  GET_EVENT_STATISTICS: '/api/calendar/statistics',
};

/**
 * Event Service
 * Handles all event-related API calls
 */
class EventService {
  /**
   * Get events for a specific month
   */
  async getMonthEvents(
    year: number,
    month: number,
    filters?: EventFilters
  ): Promise<GetEventsResponse> {
    const params = {
      year,
      month,
      ...this.buildFilterParams(filters),
    };

    const response = await apiService.get<GetEventsResponse>(
      ENDPOINTS.GET_MONTH_EVENTS,
      { params }
    );
    return response;
  }

  /**
   * Get events for a specific week
   */
  async getWeekEvents(
    year: number,
    month: number,
    week: number,
    filters?: EventFilters
  ): Promise<GetEventsResponse> {
    const params = {
      year,
      month,
      week,
      ...this.buildFilterParams(filters),
    };

    const response = await apiService.get<GetEventsResponse>(
      ENDPOINTS.GET_WEEK_EVENTS,
      { params }
    );
    return response;
  }

  /**
   * Get events for a specific day
   */
  async getDayEvents(
    year: number,
    month: number,
    day: number,
    filters?: EventFilters
  ): Promise<GetEventsResponse> {
    const params = {
      year,
      month,
      day,
      ...this.buildFilterParams(filters),
    };

    const response = await apiService.get<GetEventsResponse>(
      ENDPOINTS.GET_DAY_EVENTS,
      { params }
    );
    return response;
  }

  /**
   * Get events for a specific year
   */
  async getYearEvents(
    year: number,
    filters?: EventFilters
  ): Promise<GetEventsResponse> {
    const params = {
      year,
      ...this.buildFilterParams(filters),
    };

    const response = await apiService.get<GetEventsResponse>(
      ENDPOINTS.GET_YEAR_EVENTS,
      { params }
    );
    return response;
  }

  /**
   * Get event details by ID
   */
  async getEventById(ftId: string, eventId: string): Promise<FamilyEvent> {
    const response = await apiService.get<FamilyEvent>(
      `${ENDPOINTS.GET_EVENT_DETAILS}/${eventId}`,
      {
        headers: {
          'X-Ftid': ftId,
        },
      }
    );
    return response;
  }

  /**
   * Get upcoming events with statistics
   */
  async getUpcomingEvents(): Promise<any> {
    const response = await apiService.get<any>(
      ENDPOINTS.GET_UPCOMING_EVENTS
    );
    return response;
  }

  /**
   * Create a new event (using the actual backend API)
   */
  async createEvent(payload: ApiCreateEventPayload): Promise<ApiResponse<ApiEventResponse>> {
    const response = await apiService.post<ApiResponse<ApiEventResponse>>(
      '/ftfamilyevent',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  }

  /**
   * Get events by member ID
   */
  async getEventsByMember(ftId: string, memberId: string): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.get<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/by-member/${memberId}?pageSize=200`,
      {
        headers: {
          'X-Ftid': ftId,
        },
      }
    );
    return response;
  }

  /**
   * Get my events by family tree ID
   */
  async getMyEventsByFtId(ftId: string): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.get<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/my-events?ftId=${ftId}`
    );
    return response;
  }

  /**
   * Get all events by family tree/group ID
   * @param gpId - Family tree/group ID
   * @param pageIndex - Page index (default 1)
   * @param pageSize - Page size (default 1000 to get all events)
   */
  async getEventsByGp(gpId: string, pageIndex: number = 1, pageSize: number = 1000): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.get<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/by-gp/${gpId}?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
      headers: {
        'X-Ftid': gpId,
      }
    }
    );
    return response;
  }

  /**
   * Filter events using POST /api/ftfamilyevent/filter
   */
  async filterEvents(payload: EventFilterRequest): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.post<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/filter`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Ftid': payload.ftId,
        },
      }
    );
    return response;
  }

  /**
   * Get upcoming events by family tree ID
   * @param ftId - Family tree ID
   * @param days - Number of days to fetch (default 30)
   */
  async getUpcomingEventsByFtId(ftId: string, days: number = 30): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.get<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/upcoming?FTId=${ftId}&days=${days}`,
      {
        headers: {
          'X-Ftid': ftId,
        }
      }
    );
    return response;
  }

  /**
   * Update an existing event (using the actual backend API)
   */
  async updateEventById(eventId: string, payload: ApiCreateEventPayload, ftId: string): Promise<ApiResponse<ApiEventResponse>> {
    console.log('📤 Updating event by ID (using FormData):', eventId);

    const formData = new FormData();

    // Helper to format boolean: empty string for false, "true" for true
    const formatBoolean = (value: boolean): string => {
      return value ? 'true' : '';
    };

    // Helper to format datetime: YYYY-MM-DDTHH:mm:ss+00:00 (no milliseconds)
    // Handles formats like "2025-12-14T16:00" (no timezone) - treat as UTC time
    const formatDateTime = (dateValue: string | null | undefined): string => {
      if (!dateValue) {
        return '';
      }
      try {
        // If it's already in the correct format (YYYY-MM-DDTHH:mm:ss+00:00), return it
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/.test(dateValue)) {
          return dateValue;
        }

        // Parse the date - handle both with and without timezone
        let date: Date;
        if (typeof dateValue === 'string' && dateValue.includes('T') && !dateValue.includes('Z') && !dateValue.match(/[+-]\d{2}:\d{2}$/)) {
          // Format like "2025-12-14T16:00" - treat as UTC time (not local time)
          const parts = dateValue.split('T');
          const datePart = parts[0];
          const timePart = parts[1] || '00:00:00';

          if (!datePart) {
            console.error('❌ Invalid date format (missing date part):', dateValue);
            date = new Date(dateValue); // Fallback
          } else {
            const timeParts = timePart.split(':');
            const hours = timeParts[0] || '00';
            const minutes = timeParts[1] || '00';
            const seconds = timeParts[2] || '00';

            const dateParts = datePart.split('-');
            const yearStr = dateParts[0] || '0';
            const monthStr = dateParts[1] || '0';
            const dayStr = dateParts[2] || '0';

            // Create date as UTC: use Date.UTC to ensure it's treated as UTC
            date = new Date(Date.UTC(
              parseInt(yearStr),
              parseInt(monthStr) - 1,
              parseInt(dayStr),
              parseInt(hours),
              parseInt(minutes),
              parseInt(seconds)
            ));
          }
        } else {
          // ISO string or other format
          date = new Date(dateValue);
        }

        if (isNaN(date.getTime())) {
          console.error('❌ Invalid date value:', dateValue);
          return '';
        }

        // Format to YYYY-MM-DDTHH:mm:ss+00:00 (UTC time)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
        return formatted;
      } catch (error) {
        console.error('❌ Error formatting date:', dateValue, error);
        return '';
      }
    };

    // Map all fields in the exact order as curl request (PascalCase keys)
    formData.append('LocationName', payload.locationName || '');
    formData.append('IsAllDay', formatBoolean(payload.isAllDay));
    formData.append('TargetMemberId', payload.targetMemberId || '');
    formData.append('EndTime', formatDateTime(payload.endTime));
    formData.append('RecurrenceType', payload.recurrenceType.toString());
    formData.append('ReferenceEventId', payload.referenceEventId || '');

    // Ensure name is a string and not empty - log for debugging
    const eventName = String(payload.name || '').trim();
    console.log('📝 Appending Name to FormData:', eventName);
    formData.append('Name', eventName);

    formData.append('IsLunar', formatBoolean(payload.isLunar));
    formData.append('StartTime', formatDateTime(payload.startTime));
    formData.append('IsPublic', formatBoolean(payload.isPublic));
    formData.append('EventType', payload.eventType.toString());
    formData.append('Address', payload.address || '');
    formData.append('Location', payload.location || '');
    formData.append('ImageFile', ''); // Restored: send empty string to match curl
    formData.append('RecurrenceEndTime', payload.recurrenceEndTime ? formatDateTime(payload.recurrenceEndTime) : '');
    formData.append('Description', payload.description || '');

    // Add member IDs
    // Commented out to match successful CURL command and debug 400 error
    /* 
    if (payload.memberIds && Array.isArray(payload.memberIds)) {
      payload.memberIds.forEach(memberId => {
        formData.append('MemberIds', memberId);
      });
    }
    */

    // Log FormData entries for debugging
    console.log('📋 FormData entries for updateEventById:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    const response = await apiService.put<ApiResponse<ApiEventResponse>>(
      `/ftfamilyevent/${eventId}`,
      formData,
      {
        headers: {
          'X-Ftid': ftId,
        },
      }
    );
    return response;
  }

  /**
   * Update an existing event (legacy)
   */
  async updateEvent(payload: UpdateEventPayload): Promise<FamilyEvent> {
    const response = await apiService.put<FamilyEvent>(
      `${ENDPOINTS.UPDATE_EVENT}/${payload.id}`,
      payload
    );
    return response;
  }

  /**
   * Delete an event by ID
   */
  async deleteEventById(ftId: string, eventId: string): Promise<ApiResponse<boolean>> {
    const response = await apiService.delete<ApiResponse<boolean>>(
      `/ftfamilyevent/${eventId}`,
      {
        headers: {
          'X-Ftid': ftId,
        }
      }
    );
    return response;
  }

  /**
   * Delete an event (legacy)
   */
  async deleteEvent(payload: DeleteEventPayload): Promise<void> {
    await apiService.delete(
      `${ENDPOINTS.DELETE_EVENT}/${payload.id}`,
      {
        data: { isDeleteAll: payload.isDeleteAll },
      }
    );
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(): Promise<EventStatisticsData> {
    const response = await apiService.get<EventStatisticsData>(
      ENDPOINTS.GET_EVENT_STATISTICS
    );
    return response;
  }

  /**
   * Create a new event with file upload (using FormData)
   */
  async createEventWithFiles(data: {
    name: string;
    eventType: number;
    startTime: string;
    endTime: string;
    location?: string | null;
    locationName?: string | null;
    recurrenceType: number;
    ftId: string;
    description?: string | null;
    file?: File | null;
    referenceEventId?: string | null;
    address?: string | null;
    isAllDay: boolean;
    recurrenceEndTime?: string | null;
    isLunar: boolean;
    targetMemberId?: string | null;
    isPublic: boolean;
    memberIds: string[];
  }): Promise<ApiResponse<ApiEventResponse>> {
    const formData = new FormData();

    // Add all fields to FormData
    formData.append('Name', data.name);
    formData.append('EventType', data.eventType.toString());
    formData.append('StartTime', data.startTime);
    formData.append('EndTime', data.endTime);
    formData.append('RecurrenceType', data.recurrenceType.toString());
    formData.append('FTId', data.ftId);
    formData.append('IsAllDay', data.isAllDay.toString());
    formData.append('IsLunar', data.isLunar.toString());
    formData.append('IsPublic', data.isPublic.toString());

    // Add optional fields
    if (data.location) formData.append('Location', data.location);
    if (data.locationName) formData.append('LocationName', data.locationName);
    if (data.description) formData.append('Description', data.description);
    if (data.address) formData.append('Address', data.address);
    if (data.recurrenceEndTime) formData.append('RecurrenceEndTime', data.recurrenceEndTime);
    if (data.targetMemberId) formData.append('TargetMemberId', data.targetMemberId);
    if (data.referenceEventId) formData.append('ReferenceEventId', data.referenceEventId);

    // Add member IDs
    data.memberIds.forEach(memberId => {
      formData.append('MemberIds', memberId);
    });

    // Add image file if provided
    if (data.file) {
      formData.append('File', data.file);
      console.log('✅ Adding image file to FormData:', data.file.name);
    }

    console.log('📤 Sending event with FormData (with file)');

    const response = await apiService.post<ApiResponse<ApiEventResponse>>(
      '/ftfamilyevent',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Ftid': data.ftId,
        },
      }
    );
    return response;
  }

  /**
   * Update an existing event with file upload (using FormData)
   */
  async updateEventWithFiles(eventId: string, data: {
    name: string;
    eventType: number;
    startTime: string;
    endTime: string;
    location?: string | null;
    locationName?: string | null;
    recurrenceType: number;
    ftId: string;
    description?: string | null;
    file?: File | null;
    referenceEventId?: string | null;
    address?: string | null;
    isAllDay: boolean;
    recurrenceEndTime?: string | null;
    isLunar: boolean;
    targetMemberId?: string | null;
    isPublic: boolean;
    memberIds: string[];
  }): Promise<ApiResponse<ApiEventResponse>> {
    const formData = new FormData();

    // Helper to format boolean: empty string for false, "true" for true
    const formatBoolean = (value: boolean): string => {
      return value ? 'true' : '';
    };

    // Helper to format datetime: YYYY-MM-DDTHH:mm:ss+00:00 (no milliseconds)
    // Handles formats like "2025-12-14T16:00" (no timezone) - treat as UTC time
    const formatDateTime = (dateValue: string | null | undefined): string => {
      if (!dateValue) {
        console.warn('⚠️ Empty date value in formatDateTime');
        return '';
      }
      try {
        // If it's already in the correct format (YYYY-MM-DDTHH:mm:ss+00:00), return it
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/.test(dateValue)) {
          console.log('✅ Date already in correct format:', dateValue);
          return dateValue;
        }

        // Parse the date - handle both with and without timezone
        let date: Date;
        if (typeof dateValue === 'string' && dateValue.includes('T') && !dateValue.includes('Z') && !dateValue.match(/[+-]\d{2}:\d{2}$/)) {
          // Format like "2025-12-14T16:00" - treat as UTC time (not local time)
          // Format like "2025-12-14T16:00" - treat as UTC time (not local time)
          const parts = dateValue.split('T');
          const datePart = parts[0];
          const timePart = parts[1] || '00:00:00';

          if (!datePart) {
            console.error('❌ Invalid date format (missing date part):', dateValue);
            date = new Date(dateValue); // Fallback
          } else {
            const timeParts = timePart.split(':');
            const hours = timeParts[0] || '00';
            const minutes = timeParts[1] || '00';
            const seconds = timeParts[2] || '00';

            const dateParts = datePart.split('-');
            const yearStr = dateParts[0] || '0';
            const monthStr = dateParts[1] || '0';
            const dayStr = dateParts[2] || '0';

            // Create date as UTC: use Date.UTC to ensure it's treated as UTC
            date = new Date(Date.UTC(
              parseInt(yearStr),
              parseInt(monthStr) - 1,
              parseInt(dayStr),
              parseInt(hours),
              parseInt(minutes),
              parseInt(seconds)
            ));
          }
        } else {
          // ISO string or other format
          date = new Date(dateValue);
        }

        if (isNaN(date.getTime())) {
          console.error('❌ Invalid date value:', dateValue);
          return '';
        }

        // Format to YYYY-MM-DDTHH:mm:ss+00:00 (UTC time)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
        console.log('✅ Formatted date:', dateValue, '→', formatted);
        return formatted;
      } catch (error) {
        console.error('❌ Error formatting date:', dateValue, error);
        return '';
      }
    };

    // Map all fields in the exact order as curl request:
    // LocationName, IsAllDay, TargetMemberId, EndTime, RecurrenceType, ReferenceEventId, 
    // Name, IsLunar, StartTime, IsPublic, EventType, Address, Location, ImageFile, RecurrenceEndTime, Description
    formData.append('LocationName', data.locationName || '');
    formData.append('IsAllDay', formatBoolean(data.isAllDay));
    formData.append('TargetMemberId', data.targetMemberId || '');
    formData.append('EndTime', formatDateTime(data.endTime));
    formData.append('RecurrenceType', data.recurrenceType.toString());
    formData.append('ReferenceEventId', data.referenceEventId || '');
    // Ensure name is a string and not empty - log for debugging
    const eventName = String(data.name || '').trim();
    console.log('📝 Appending Name to FormData:', eventName, 'type:', typeof eventName, 'length:', eventName.length);
    formData.append('Name', eventName);
    formData.append('IsLunar', formatBoolean(data.isLunar));
    formData.append('StartTime', formatDateTime(data.startTime));
    formData.append('IsPublic', formatBoolean(data.isPublic));
    formData.append('EventType', data.eventType.toString());
    formData.append('Address', data.address || '');
    formData.append('Location', data.location || '');
    formData.append('ImageFile', ''); // Always empty - image upload disabled
    formData.append('RecurrenceEndTime', data.recurrenceEndTime ? formatDateTime(data.recurrenceEndTime) : '');
    formData.append('Description', data.description || '');

    // Add member IDs (if any)
    data.memberIds.forEach(memberId => {
      formData.append('MemberIds', memberId);
    });

    // Note: FTId is sent in X-Ftid header, NOT in FormData

    // Debug: Log all FormData entries before sending
    console.log('📋 FormData entries for updateEventWithFiles:');
    console.log('  Input data:', {
      name: data.name,
      nameType: typeof data.name,
      nameLength: data.name?.length,
      startTime: data.startTime,
      endTime: data.endTime,
      eventType: data.eventType,
    });

    // Log all FormData entries
    const formDataEntries: Array<[string, string | File]> = [];
    for (const [key, value] of formData.entries()) {
      formDataEntries.push([key, value]);
      console.log(`  ${key}:`, value, `(type: ${typeof value}, length: ${typeof value === 'string' ? value.length : 'N/A'})`);
    }

    // Verify Name field specifically
    const nameEntry = formDataEntries.find(([key]) => key === 'Name');
    if (nameEntry) {
      console.log('✅ Name field found in FormData:', nameEntry[1]);
    } else {
      console.error('❌ Name field NOT found in FormData!');
    }

    const response = await apiService.put<ApiResponse<ApiEventResponse>>(
      `/ftfamilyevent/${eventId}`,
      formData,
      {
        headers: {
          'X-Ftid': data.ftId,
        },
      }
    );
    return response;
  }

  /**
   * Build filter parameters for API requests
   */
  private buildFilterParams(filters?: EventFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.eventType && filters.eventType.length > 0) {
      params.eventType = filters.eventType.join(',');
    }

    if (filters.eventGp && filters.eventGp.length > 0) {
      params.gpIds = filters.eventGp.join(',');
    }

    if (filters.eventLocation) {
      params.locationCode = filters.eventLocation.code;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }
}

// Export singleton instance
const eventService = new EventService();
export default eventService;
