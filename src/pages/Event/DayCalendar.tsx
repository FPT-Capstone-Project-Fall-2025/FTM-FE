import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
// import "moment-lunar"; // Temporarily disabled due to compatibility issues
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters } from "../../types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { normalizeEventType } from "../../utils/eventUtils";
import { processRecurringEvents } from "../../utils/recurringEventUtils";
import { vietnameseCalendarLocale, commonVietnameseCalendarConfig } from "../../utils/vietnameseCalendarConfig";
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

// Configure moment for Vietnamese (already done in vietnameseCalendarConfig, but ensure it's set)
moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

interface DayCalendarProps {
  date: Date | string;
  reload?: boolean;
  eventFilters?: EventFilters;
  isShowLunarDay?: boolean;
  setIsOpenGPEventInfoModal: any;
  setIsOpenGPEventDetailsModal: any;
  setEventSelected: any;
  viewWeather?: boolean;
  handleSelect: any;
}

const DayCalendar = ({
  date,
  reload = false,
  eventFilters,
  isShowLunarDay = true,
  setIsOpenGPEventInfoModal,
  setIsOpenGPEventDetailsModal,
  setEventSelected,
  viewWeather,
  handleSelect,
}: DayCalendarProps) => {
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>({});
  const [filterEvents, setFilterEvents] = useState<any>({});

  const fetchEventsAndForecasts = useCallback(async (filters: any) => {
    if (!filters.date) {
      setEvents([]);
      return;
    }
    
    try {
      let allEvents: any[] = [];

      // Calculate start and end dates for the day view (outside conditional)
      const currentDay = moment(filters.date);
      const dayStart = currentDay.clone().startOf('day');
      const dayEnd = currentDay.clone().endOf('day');
      
      const startDate = dayStart.toDate();
      const endDate = dayEnd.toDate();
      
      console.log('📅 DayCalendar - Date range:', startDate, 'to', endDate);

      // Check if family groups are selected
      if (eventFilters?.eventGp && Array.isArray(eventFilters.eventGp) && eventFilters.eventGp.length > 0) {
        console.log('📅 DayCalendar - Fetching events for selected family groups:', eventFilters.eventGp);
        
        // Fetch events for each selected family group using getEventsByGp API
        const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            // Use getEventsByGp API to fetch all events from the group
            const response = await eventService.getEventsByGp(ftId);
            // Handle nested data structure: response.data.data.data
            const events = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
            
            // Filter events to only include those in the current day view
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
        allEvents = eventArrays.flat();
        
        console.log('📅 DayCalendar - Total events from all groups:', allEvents.length);
      } else {
        // No family groups selected - show empty
        console.log('📅 DayCalendar - No family groups selected, showing empty calendar');
        allEvents = [];
      }

      // Process recurring events to generate instances within the day view
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
      
      // Generate recurring event instances for the day view
      const expandedEvents = processRecurringEvents(eventsWithRecurrence, startDate, endDate);
      
      console.log('📅 DayCalendar - Expanded events (with recurring):', expandedEvents.length);

      // @ts-ignore - API response needs proper type definition
      const mappedEvents = expandedEvents
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
            (start.format("HH:mm:ss") === "00:00:00" && end.format("HH:mm:ss") === "23:59:59");

          // Format dates for FullCalendar
          let startStr = start.format("YYYY-MM-DDTHH:mm:ss");
          let endStr = end.format("YYYY-MM-DDTHH:mm:ss");
          if (isAllDay) {
            startStr = start.format("YYYY-MM-DD");
            // end exclusive => +1 ngày để hiển thị đủ
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

      console.log('📅 DayCalendar - Events after filtering:', mappedEvents.length, 'events');
      console.log('📅 DayCalendar - Sample event:', mappedEvents[0]);
      setEvents(mappedEvents);

      // Process weather data (only available from old API)
      // TODO: Integrate weather API separately if needed
      setWeatherData({});
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  }, [filterEvents, eventFilters]);

  useEffect(() => {
    const updatedFilters = {
      ...(eventFilters || {}),
      date: moment(date).format("YYYY-MM-DD"),
      eventType: eventFilters?.eventType,
      eventGp: eventFilters?.eventGp,
    };
    setFilterEvents(updatedFilters);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date);
    }
  }, [date, eventFilters]);

  useEffect(() => {
    fetchEventsAndForecasts(filterEvents);
  }, [filterEvents, reload, fetchEventsAndForecasts]);

  const handleEventClick = useCallback(
    (arg: any) => {
      arg.jsEvent.preventDefault();
      const clickedEvent = events.find((x: any) => x.id === arg.event.id);
      if (clickedEvent && setEventSelected && setIsOpenGPEventInfoModal) {
        setEventSelected(clickedEvent);
        setIsOpenGPEventInfoModal(true);
      }
    },
    [events, setEventSelected, setIsOpenGPEventInfoModal]
  );

  const renderEventContent = useCallback((arg: any) => (
    <EventTypeLabel
      type={arg.event.extendedProps.type}
      title={arg.event.title}
      timeStart={moment(arg.event.start).format("HH:mm")}
      timeEnd={moment(arg.event.end).format("HH:mm")}
      allDay={arg.event.allDay}
    />
  ), []);

  const renderDayHeaderContent = useCallback((arg: any) => {
    const dayOfWeek = moment(arg.date).isoWeekday();
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
    const dateObj = moment(arg.date);
    const gregorianDay = dateObj.date();
    const lunarDay = (dateObj as any).lunar().date();
    return (
      <>
        {weatherData.icon && viewWeather && (
          <div className="custom-day-weather">
            <img className="day-weather-icon" src={weatherData.icon} alt="weather icon" />
            <span className="day-temp">{weatherData.temp}</span>
          </div>
        )}
        <div className="custom-day-cell-content">
          <div className="custom-day-title">{dayNames[dayOfWeek - 1]}</div>
          <div className="custom-day-gregorian">{gregorianDay}</div>
          {isShowLunarDay && <div className="custom-day-lunar">{lunarDay}</div>}
        </div>
      </>
    );
  }, [weatherData, viewWeather, isShowLunarDay]);

  // Handle date click to create new event
  const handleDateClick = useCallback((arg: any) => {
    const clickedDate = moment(arg.date);
    
    // Only allow creating events for future dates
    if (clickedDate.isBefore(moment(), 'day')) {
      return;
    }
    
    console.log('📅 Date/Time clicked:', clickedDate.format('YYYY-MM-DD HH:mm'));
    
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
    });
    setIsOpenGPEventDetailsModal(true);
  }, [setEventSelected, setIsOpenGPEventDetailsModal]);

  return (
    <div className="w-full h-full min-h-[600px]">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        locale={vietnameseCalendarLocale}
        headerToolbar={commonVietnameseCalendarConfig.headerToolbar}
        events={events}
        height={commonVietnameseCalendarConfig.height}
        contentHeight={commonVietnameseCalendarConfig.contentHeight}
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
        selectable={commonVietnameseCalendarConfig.selectable}
        select={handleSelect}
        nowIndicator={commonVietnameseCalendarConfig.nowIndicator}
        allDaySlot={commonVietnameseCalendarConfig.allDaySlot}
        allDayText={commonVietnameseCalendarConfig.allDayText}
        editable={commonVietnameseCalendarConfig.editable}
      />
    </div>
  );
};

export default DayCalendar;
