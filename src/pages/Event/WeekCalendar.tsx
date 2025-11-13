import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent, CalendarEvent } from "../../types/event";
import { normalizeEventType } from "../../utils/eventUtils";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { processRecurringEvents } from "../../utils/recurringEventUtils";
import { getHolidaysForYear, formatHolidayForCalendar } from "../../utils/vietnameseHolidays";
import { vietnameseCalendarLocale, commonVietnameseCalendarConfig } from "../../utils/vietnameseCalendarConfig";
import type { EventClickArg, EventContentArg, DayHeaderContentArg } from '@fullcalendar/core';
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

// Configure moment for Vietnamese (already done in vietnameseCalendarConfig, but ensure it's set)
moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

interface WeekCalendarProps {
  year: number;
  month: number;
  week: number;
  reload?: boolean;
  eventFilters?: EventFilters;
  isShowLunarDay?: boolean;
  setEventSelected: (event: FamilyEvent) => void;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  setIsOpenGPEventDetailsModal: (open: boolean) => void;
  viewWeather?: boolean;
  handleSelect: (selectInfo: any) => void;
}

interface WeatherInfo {
  icon: string;
  temp: string;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  year,
  month,
  week,
  reload = false,
  eventFilters,
  isShowLunarDay = true,
  setEventSelected,
  setIsOpenGPEventInfoModal,
  setIsOpenGPEventDetailsModal,
  viewWeather = true,
  handleSelect,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const [filterEvents, setFilterEvents] = useState<EventFilters & { year?: number; month?: number; week?: number }>({});

  const fetchEventsAndForecasts = useCallback(async () => {
    if (!filterEvents.year || !filterEvents.month || !filterEvents.week) return;
    
    try {
      let allEvents: FamilyEvent[] = [];

      // Calculate start and end dates for the week view (outside conditional)
      // Use isoWeek for consistency with the week navigation
      const currentWeekStart = moment().year(year).month(month - 1).isoWeek(week).startOf('isoWeek');
      const currentWeekEnd = currentWeekStart.clone().endOf('isoWeek');
      
      const startDate = currentWeekStart.toDate();
      const endDate = currentWeekEnd.toDate();
      
      // Check if family groups are selected
      if (eventFilters?.eventGp && Array.isArray(eventFilters.eventGp) && eventFilters.eventGp.length > 0) {
        console.log('📅 WeekCalendar - Fetching events for selected family groups:', eventFilters.eventGp);
        
        console.log('📅 WeekCalendar - Date range:', startDate, 'to', endDate);
        
        // Fetch events for each selected family group using getEventsByGp API
        const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            // Use getEventsByGp API to fetch all events from the group
            const response = await eventService.getEventsByGp(ftId);
            // Handle nested data structure: response.data.data.data
            const events = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
            
            // Filter events to only include those in the current week view
            const filteredEvents = events.filter((event: any) => {
              const eventStart = moment(event.startTime);
              const eventEnd = moment(event.endTime);
              // Include event if it starts or ends within the visible date range
              return (
                (eventStart.isSameOrAfter(startDate) && eventStart.isSameOrBefore(endDate)) ||
                (eventEnd.isSameOrAfter(startDate) && eventEnd.isSameOrBefore(endDate)) ||
                (eventStart.isBefore(startDate) && eventEnd.isAfter(endDate))
              );
            });
            
            console.log(`📅 Events from ftId ${ftId}:`, filteredEvents.length, 'events (filtered from', events.length, 'total)');
            return filteredEvents;
          } catch (error) {
            console.error(`Error fetching events for ftId ${ftId}:`, error);
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        allEvents = eventArrays.flat() as any as FamilyEvent[];
        
        console.log('📅 WeekCalendar - Total events from all groups:', allEvents.length);
      } else {
        // No family groups selected - show empty
        console.log('📅 WeekCalendar - No family groups selected, showing empty calendar');
        allEvents = [];
      }

      // Process recurring events to generate instances within the week view
      const eventsWithRecurrence = allEvents.map((event: any) => {
        // Normalize recurrenceType first
        let normalizedRecurrence = 'ONCE';
        if (event.recurrenceType) {
          if (typeof event.recurrenceType === 'string') {
            normalizedRecurrence = event.recurrenceType.toUpperCase() === 'NONE' 
              ? 'ONCE' 
              : event.recurrenceType.toUpperCase();
          } else if (typeof event.recurrenceType === 'number') {
            normalizedRecurrence = event.recurrenceType === 0 ? 'ONCE'
              : event.recurrenceType === 1 ? 'DAILY'
              : event.recurrenceType === 2 ? 'WEEKLY'
              : event.recurrenceType === 3 ? 'MONTHLY'
              : event.recurrenceType === 4 ? 'YEARLY'
              : 'ONCE';
          }
        }
        return { ...event, recurrence: normalizedRecurrence };
      });
      
      // Generate recurring event instances for the week view
      const expandedEvents = processRecurringEvents(eventsWithRecurrence, startDate, endDate);
      
      console.log('📅 WeekCalendar - Expanded events (with recurring):', expandedEvents.length);
      
      const mappedEvents: CalendarEvent[] = expandedEvents
        .filter((event: any) => {
          // Normalize eventType to uppercase for comparison
          const normalizedEventType = normalizeEventType(event.eventType);
          
          // Filter by event type
          if (eventFilters?.eventType && Array.isArray(eventFilters.eventType) && eventFilters.eventType.length > 0) {
            if (!eventFilters.eventType.includes(normalizedEventType)) {
              return false;
            }
          }
          
          return true;
        })
        .map((event: any) => {
          // Normalize eventType from API
          const normalizedEventType = normalizeEventType(event.eventType);
          
          // Normalize recurrenceType from API
          let normalizedRecurrence = 'ONCE';
          if (event.recurrenceType) {
            if (typeof event.recurrenceType === 'string') {
              normalizedRecurrence = event.recurrenceType.toUpperCase() === 'NONE' 
                ? 'ONCE' 
                : event.recurrenceType.toUpperCase();
            } else if (typeof event.recurrenceType === 'number') {
              normalizedRecurrence = event.recurrenceType === 0 ? 'ONCE'
                : event.recurrenceType === 1 ? 'DAILY'
                : event.recurrenceType === 2 ? 'WEEKLY'
                : event.recurrenceType === 3 ? 'MONTHLY'
                : event.recurrenceType === 4 ? 'YEARLY'
                : 'ONCE';
            }
          }
          
          // Extract member names from eventMembers array
          const memberNames = event.eventMembers?.map((m: any) => m.memberName || m.name) || [];
          
          // Use start/end from recurring instances if available, otherwise parse from startTime/endTime
          const eventStartTime = event.start || event.startTime;
          const eventEndTime = event.end || event.endTime;
          
          const start = moment(eventStartTime);
          const end = moment(eventEndTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
            event.isAllDay ||
            durationDays >= 1 ||
            (start.format("HH:mm:ss") === "00:00:00" &&
              end.format("HH:mm:ss") === "23:59:59");

          // Format dates for FullCalendar
          let startStr = start.format("YYYY-MM-DDTHH:mm:ss");
          let endStr = end.format("YYYY-MM-DDTHH:mm:ss");
          if (isAllDay) {
            startStr = start.format("YYYY-MM-DD");
            endStr = end.clone().add(1, "day").format("YYYY-MM-DD");
          }

          return {
            ...event,
            id: event.id,
            name: event.name,
            title: event.name,
            start: startStr,
            end: endStr,
            eventType: normalizedEventType,
            type: normalizedEventType,
            allDay: isAllDay,
            description: event.description || '',
            imageUrl: event.imageUrl || '',
            gpIds: event.ftId ? [event.ftId] : [],
            location: event.location || '',
            isOwner: event.isOwner || false,
            recurrence: normalizedRecurrence,
            memberNames: memberNames,
            gpNames: [],
            address: event.address || '',
            locationName: event.locationName || '',
            isLunar: event.isLunar || false,
            targetMemberId: event.targetMemberId || null,
            targetMemberName: event.targetMemberName || null,
            isPublic: event.isPublic !== undefined ? event.isPublic : true,
            extendedProps: {
              type: normalizedEventType,
              description: event.description || '',
              location: event.location || '',
            }
          };
        });

      // Add Vietnamese holidays to calendar
      const vietnameseHolidays = getHolidaysForYear(year);
      const holidayEvents = vietnameseHolidays
        .filter(holiday => {
          const holidayDate = moment(holiday.solarDate);
          return holidayDate.isSameOrAfter(startDate) && holidayDate.isSameOrBefore(endDate);
        })
        .map(holiday => formatHolidayForCalendar(holiday, year));
      
      console.log('📅 WeekCalendar - Events after filtering:', mappedEvents.length, 'events');
      console.log('📅 WeekCalendar - Vietnamese holidays:', holidayEvents.length, 'holidays');
      console.log('📅 WeekCalendar - Sample event:', mappedEvents[0]);
      console.log('📅 WeekCalendar - All mapped events:', mappedEvents);
      console.log('📅 WeekCalendar - Setting events to state...');
      
      // Combine user events and holidays
      const combinedEvents = [...mappedEvents, ...holidayEvents as any];
      setEvents(combinedEvents);
      console.log('📅 WeekCalendar - Events set successfully');

      // Process weather data (only available from old API)
      // TODO: Integrate weather API separately if needed
      setWeatherData({});
    } catch (error) {
      console.error("Error fetching week events:", error);
      setEvents([]);
    }
  }, [filterEvents, eventFilters]);

  useEffect(() => {
    const newFilter = { ...eventFilters, year, month, week };
    setFilterEvents(newFilter);

    const weekStartDate = moment()
      .year(year)
      .month(month - 1)
      .isoWeek(week)
      .startOf("isoWeek")
      .format("YYYY-MM-DD");
      
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(weekStartDate);
    }
  }, [year, month, week, eventFilters]);

  useEffect(() => {
    fetchEventsAndForecasts();
  }, [fetchEventsAndForecasts, reload]);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      arg.jsEvent.preventDefault();
      const clickedEvent = events.find((x) => x.id === arg.event.id);
      if (clickedEvent) {
        setEventSelected(clickedEvent);
        setIsOpenGPEventInfoModal(true);
      }
    },
    [events, setEventSelected, setIsOpenGPEventInfoModal]
  );

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const timeStart = arg.event.allDay ? null : moment(arg.event.start).format("HH:mm");
    const timeEnd = arg.event.allDay ? null : moment(arg.event.end).format("HH:mm");
    
    return (
      <div className="custom-event">
        <EventTypeLabel
          type={arg.event.extendedProps.type}
          title={arg.event.title}
          timeStart={timeStart}
          timeEnd={timeEnd}
          allDay={arg.event.allDay}
        />
      </div>
    );
  }, []);

  const renderDayHeaderContent = useCallback(
    (arg: DayHeaderContentArg) => {
      const dayOfWeek = moment(arg.date).isoWeekday();
      const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
      const dateObj = moment(arg.date);
      const gregorianDay = dateObj.date();
      const lunarDay = (dateObj as any).lunar()?.date() || 0;
      const dayKey = moment(arg.date).format("YYYY-MM-DD");
      const weather = weatherData[dayKey];

      return (
        <div className="flex flex-col items-center p-2 gap-1">
          {weather && viewWeather && (
            <div className="flex items-center gap-1.5 mb-1">
              <img 
                src={weather.icon} 
                alt="weather" 
                className="w-5 h-5"
              />
              <span className="text-xs text-gray-600 font-medium">
                {weather.temp}
              </span>
            </div>
          )}
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-sm font-semibold text-gray-900">
              {dayNames[dayOfWeek - 1]}
            </div>
            <div className="text-xl font-bold text-blue-500">
              {gregorianDay}
            </div>
            {isShowLunarDay && lunarDay > 0 && (
              <div className="text-xs text-gray-400">
                {lunarDay}
              </div>
            )}
          </div>
        </div>
      );
    },
    [weatherData, viewWeather, isShowLunarDay]
  );

  const dayCellClassNames = useCallback((arg: any) => {
    const isPast = moment(arg.date).isBefore(moment(), 'day');
    return isPast ? 'fc-day-past' : 'fc-day-future';
  }, []);

  const selectAllow = useCallback((selectInfo: any) => {
    // Only allow selection for future dates/times
    return moment(selectInfo.start).isSameOrAfter(moment());
  }, []);

  // Handle date click to create new event
  const handleDateClick = useCallback((arg: any) => {
    const clickedDate = moment(arg.date);
    
    // Only allow creating events for future dates
    if (clickedDate.isBefore(moment(), 'day')) {
      return;
    }
    
    console.log('📅 Date clicked:', clickedDate.format('YYYY-MM-DD HH:mm'));
    
    // Open modal with clicked date/time for new event creation
    setEventSelected({
      id: '',
      startTime: clickedDate.toDate(),
      endTime: clickedDate.clone().add(1, 'hour').toDate(),
      isAllDay: false,
      name: '',
      eventType: 'BIRTHDAY',
      description: '',
      imageUrl: '',
      gpIds: [],
      location: '',
      isOwner: true,
      recurrence: 'ONCE',
      memberNames: [],
      gpNames: [],
      address: '',
      locationName: '',
      isLunar: false,
      isPublic: true,
      referenceEventId: null,
      recurrenceEndTime: null,
      createdOn: new Date().toISOString(),
      lastModifiedOn: new Date().toISOString(),
      eventMembers: [],
      targetMemberId: null,
      targetMemberName: null,
    } as FamilyEvent);
    setIsOpenGPEventDetailsModal(true);
  }, [setEventSelected, setIsOpenGPEventDetailsModal]);

  // Debug: Log events state when it changes
  useEffect(() => {
    console.log('📅 WeekCalendar - events state updated:', events.length, 'events');
    if (events.length > 0) {
      console.log('📅 WeekCalendar - First event in state:', events[0]);
    }
  }, [events]);

  return (
    <div className="w-full bg-white rounded-lg p-4 overflow-auto">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={vietnameseCalendarLocale}
        firstDay={commonVietnameseCalendarConfig.firstDay}
        events={events}
        headerToolbar={commonVietnameseCalendarConfig.headerToolbar}
        height={commonVietnameseCalendarConfig.height}
        slotMinTime={commonVietnameseCalendarConfig.slotMinTime}
        slotMaxTime={commonVietnameseCalendarConfig.slotMaxTime}
        scrollTime={commonVietnameseCalendarConfig.scrollTime}
        slotDuration={commonVietnameseCalendarConfig.slotDuration}
        slotLabelInterval={commonVietnameseCalendarConfig.slotLabelInterval}
        slotLabelFormat={commonVietnameseCalendarConfig.slotLabelFormat}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        dayHeaderContent={renderDayHeaderContent}
        dayCellClassNames={dayCellClassNames}
        selectable={commonVietnameseCalendarConfig.selectable}
        select={handleSelect}
        selectAllow={selectAllow}
        selectMirror={commonVietnameseCalendarConfig.selectMirror}
        unselectAuto={commonVietnameseCalendarConfig.unselectAuto}
        allDaySlot={commonVietnameseCalendarConfig.allDaySlot}
        allDayText={commonVietnameseCalendarConfig.allDayText}
        nowIndicator={commonVietnameseCalendarConfig.nowIndicator}
        editable={commonVietnameseCalendarConfig.editable}
      />
    </div>
  );
};

export default WeekCalendar;

