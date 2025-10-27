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
        
        const startDate = dayStart.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
        const endDate = dayEnd.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
        
        console.log('📅 DayCalendar - Date range:', startDate, 'to', endDate);
        
        // Fetch events for each selected family group using filter API
        const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            const response = await eventService.filterEvents({
              ftId: ftId,
              startDate: startDate,
              endDate: endDate,
              pageIndex: 1,
              pageSize: 100,
            });
            console.log(`📅 Events from ftId ${ftId}:`, response?.data?.length || 0, 'events');
            return response?.data || [];
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
          // Filter by event type
          if (eventFilters?.eventType && Array.isArray(eventFilters.eventType) && eventFilters.eventType.length > 0) {
            if (!eventFilters.eventType.includes(event.eventType)) {
              return false;
            }
          }
          
          return true;
        })
        .map((event: any) => {
          const start = moment(event.startTime);
          const end = moment(event.endTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
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
            title: event.name,
            start: startStr,
            end: endStr,
            allDay: isAllDay,
            type: event.eventType,
            description: event.description,
            imageUrl: event.imageUrl,
            gpIds: event.gpIds,
            location: event.location,
            isOwner: event.isOwner,
            recurrence: event.recurrence,
            memberNames: event.memberNames,
            gpNames: event.gpNames,
            address: event.address,
            locationName: event.locationName,
            isLunar: event.isLunar,
            extendedProps: {
              type: event.eventType,
              description: event.description,
              location: event.location,
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
