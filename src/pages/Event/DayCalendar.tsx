import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
// import "moment-lunar"; // Temporarily disabled due to compatibility issues
import viLocale from "@fullcalendar/core/locales/vi";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters } from "../../types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

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

      // Check if family groups are selected
      if (eventFilters?.eventGp && Array.isArray(eventFilters.eventGp) && eventFilters.eventGp.length > 0) {
        console.log('📅 DayCalendar - Fetching events for selected family groups:', eventFilters.eventGp);
        
        // Calculate start and end dates for the day view
        const currentDay = moment(filters.date);
        const dayStart = currentDay.clone().startOf('day');
        const dayEnd = currentDay.clone().endOf('day');
        
        const startDate = dayStart.toDate();
        const endDate = dayEnd.toDate();
        
        console.log('📅 DayCalendar - Date range:', startDate, 'to', endDate);
        
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

      // @ts-ignore - API response needs proper type definition
      const mappedEvents = allEvents
        .filter((event: any) => {
          // Normalize eventType to uppercase for comparison
          const normalizedEventType = typeof event.eventType === 'string' 
            ? event.eventType.toUpperCase() 
            : event.eventType === 0 ? 'FUNERAL'
            : event.eventType === 1 ? 'WEDDING'
            : event.eventType === 2 ? 'BIRTHDAY'
            : event.eventType === 3 ? 'HOLIDAY'
            : event.eventType === 4 ? 'MEMORIAL'
            : event.eventType === 5 ? 'MEETING'
            : event.eventType === 6 ? 'GATHERING'
            : 'OTHER';
          
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
          const normalizedEventType = typeof event.eventType === 'string' 
            ? event.eventType.toUpperCase() 
            : event.eventType === 0 ? 'FUNERAL'
            : event.eventType === 1 ? 'WEDDING'
            : event.eventType === 2 ? 'BIRTHDAY'
            : event.eventType === 3 ? 'HOLIDAY'
            : event.eventType === 4 ? 'MEMORIAL'
            : event.eventType === 5 ? 'MEETING'
            : event.eventType === 6 ? 'GATHERING'
            : 'OTHER';
          
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
          
          const start = moment(event.startTime);
          const end = moment(event.endTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
            event.isAllDay ||
            durationDays >= 1 ||
            (start.format("HH:mm:ss") === "00:00:00" && end.format("HH:mm:ss") === "23:59:59");

          // Nếu allDay và kéo dài >1 ngày, map sang date-only và cho end = ngày kế tiếp
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
  }, [eventFilters]);

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
        locale={viLocale}
        headerToolbar={false}
        events={events}
        height="auto"
        contentHeight="auto"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        slotDuration="01:00:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          meridiem: false,
        }}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        dayHeaderContent={renderDayHeaderContent}
        selectable={true}
        select={handleSelect}
        nowIndicator={true}
        allDaySlot={true}
        allDayText="Cả ngày"
        editable={false}
      />
    </div>
  );
};

export default DayCalendar;
