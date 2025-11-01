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
  GET_EVENT_DETAILS: '/api/calendar/event',
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
  async getEventById(eventId: string): Promise<FamilyEvent> {
    const response = await apiService.get<FamilyEvent>(
      `${ENDPOINTS.GET_EVENT_DETAILS}/${eventId}`
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
  async getEventsByMember(memberId: string): Promise<ApiResponse<ApiEventResponse[]>> {
    const response = await apiService.get<ApiResponse<ApiEventResponse[]>>(
      `/ftfamilyevent/by-member/${memberId}`
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
      `/ftfamilyevent/by-gp/${gpId}?pageIndex=${pageIndex}&pageSize=${pageSize}`
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
      `/ftfamilyevent/upcoming?FTId=${ftId}&days=${days}`
    );
    return response;
  }

  /**
   * Update an existing event (using the actual backend API)
   */
  async updateEventById(eventId: string, payload: ApiCreateEventPayload): Promise<ApiResponse<ApiEventResponse>> {
    const response = await apiService.put<ApiResponse<ApiEventResponse>>(
      `/ftfamilyevent/${eventId}`,
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
  async deleteEventById(eventId: string): Promise<ApiResponse<boolean>> {
    const response = await apiService.delete<ApiResponse<boolean>>(
      `/ftfamilyevent/${eventId}`
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
      console.log('✅ Adding image file to FormData for update:', data.file.name);
    }
    
    console.log('📤 Sending event update with FormData (with file)');
    
    const response = await apiService.put<ApiResponse<ApiEventResponse>>(
      `/ftfamilyevent/${eventId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
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
