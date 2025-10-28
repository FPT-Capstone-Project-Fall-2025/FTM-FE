import { useState, useCallback, useEffect } from 'react';
import eventService from '@/services/eventService';
import type {
  FamilyEvent,
  EventFilters,
  ApiCreateEventPayload,
  UpdateEventPayload,
  DeleteEventPayload,
  GetEventsResponse,
  EventStatisticsData,
} from '@/types/event';

/**
 * Custom hook for managing events
 */
export const useEvents = () => {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch events for a specific month
   */
  const fetchMonthEvents = useCallback(
    async (year: number, month: number, filters?: EventFilters) => {
      setLoading(true);
      setError(null);
      try {
        const response: GetEventsResponse = await eventService.getMonthEvents(
          year,
          month,
          filters
        );
        setEvents(response.gpFamilyEvents || []);
        return response;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch events for a specific week
   */
  const fetchWeekEvents = useCallback(
    async (
      year: number,
      month: number,
      week: number,
      filters?: EventFilters
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response: GetEventsResponse = await eventService.getWeekEvents(
          year,
          month,
          week,
          filters
        );
        setEvents(response.gpFamilyEvents || []);
        return response;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch events for a specific day
   */
  const fetchDayEvents = useCallback(
    async (year: number, month: number, day: number, filters?: EventFilters) => {
      setLoading(true);
      setError(null);
      try {
        const response: GetEventsResponse = await eventService.getDayEvents(
          year,
          month,
          day,
          filters
        );
        setEvents(response.gpFamilyEvents || []);
        return response;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch events for a specific year
   */
  const fetchYearEvents = useCallback(
    async (year: number, filters?: EventFilters) => {
      setLoading(true);
      setError(null);
      try {
        const response: GetEventsResponse = await eventService.getYearEvents(
          year,
          filters
        );
        setEvents(response.gpFamilyEvents || []);
        return response;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Create a new event
   */
  const createEvent = useCallback(async (payload: ApiCreateEventPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.createEvent(payload);
      // Note: Since the response structure might be different, we don't automatically add to events array
      // The caller should handle refetching or updating the events list as needed
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (payload: UpdateEventPayload) => {
    setLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventService.updateEvent(payload);
      setEvents((prev) =>
        prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
      );
      return updatedEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (payload: DeleteEventPayload) => {
    setLoading(true);
    setError(null);
    try {
      await eventService.deleteEvent(payload);
      setEvents((prev) => prev.filter((event) => event.id !== payload.id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get event by ID
   */
  const getEventById = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventService.getEventById(eventId);
      return event;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
  }, []);

  return {
    events,
    loading,
    error,
    fetchMonthEvents,
    fetchWeekEvents,
    fetchDayEvents,
    fetchYearEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    clearEvents,
  };
};

/**
 * Custom hook for event statistics
 */
export const useEventStatistics = () => {
  const [statistics, setStatistics] = useState<EventStatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEventStatistics();
      setStatistics(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
};

/**
 * Custom hook for single event management
 */
export const useEvent = (eventId?: string) => {
  const [event, setEvent] = useState<FamilyEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEventById(id);
      setEvent(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId, fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: () => eventId && fetchEvent(eventId),
  };
};
