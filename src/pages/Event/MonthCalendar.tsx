import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
import viLocale from "@fullcalendar/core/locales/vi";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent, CalendarEvent } from "../../types/event";
import { forEach } from "lodash";
import { addLunarToMoment } from "../../utils/lunarUtils";
import type { EventClickArg, EventContentArg, DayCellContentArg } from '@fullcalendar/core';
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

interface MonthCalendarProps {
  year: number;
  month: number;
  reload?: boolean;
  eventFilters?: EventFilters;
  isShowLunarDay?: boolean;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  setEventSelected: (event: FamilyEvent) => void;
  onMoreClick?: (date: Date) => void;
  viewWeather?: boolean;
  handleSelect: (selectInfo: any) => void;
}

interface WeatherInfo {
  icon: string;
  temp: string;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  year,
  month,
  reload = false,
  eventFilters,
  isShowLunarDay = true,
  setIsOpenGPEventInfoModal,
  setEventSelected,
  onMoreClick,
  viewWeather = true,
  handleSelect,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [initialDate, setInitialDate] = useState(
    `${year}-${month.toString().padStart(2, "0")}-01`
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});

  // Combine filters
  const combinedFilters = useMemo(() => ({ ...eventFilters, year, month }), [eventFilters, year, month]);

  // Update calendar size after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
        window.dispatchEvent(new Event("resize"));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Update initialDate when year or month changes
  useEffect(() => {
    const newDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    setInitialDate(newDate);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(newDate);
    }
  }, [year, month]);

  // Fetch events and weather data
  const fetchEventsAndForecasts = useCallback(async () => {
    if (!combinedFilters.year || !combinedFilters.month) return;
    try {
      const response: any = await eventService.getMonthEvents(year, month, combinedFilters);
      
      const mappedEvents: CalendarEvent[] = ((response?.value?.gpFamilyEvents || []) as FamilyEvent[]).map((event: FamilyEvent) => ({
        ...event,
        id: event.id,
        title: event.name,
        start: event.startTime,
        end: event.endTime,
        type: event.eventType,
        allDay: event.isAllDay,
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
      }));
      
      setEvents(mappedEvents);

      // Process weather data
      const forecastData: Record<string, WeatherInfo> = {};
      forEach((response?.value?.dailyForecasts || []) as any[], (forecast: any) => {
        const key = moment(forecast.forecastDate).format("YYYY-MM-DD");
        forecastData[key] = {
          icon: forecast.weatherIcon,
          temp: `${forecast.tempDay}°C`,
        };
      });
      setWeatherData(forecastData);
    } catch (error) {
      console.error("Error fetching month events:", error);
    }
  }, [year, month, combinedFilters]);

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

  const renderEventContent = useCallback((arg: EventContentArg) => (
    <div className="custom-event">
      <EventTypeLabel 
        type={arg.event.extendedProps.type} 
        title={arg.event.title} 
      />
    </div>
  ), []);

  const renderDayCellContent = useCallback(
    (args: DayCellContentArg) => {
      const dateObj = moment(args.date);
      const gregorianDay = dateObj.date();
      const lunarDay = (dateObj as any).lunar()?.date() || 0;
      const dayKey = moment(args.date).format("YYYY-MM-DD");
      const weather = weatherData[dayKey];
      
      return (
        <div className="flex flex-col items-center p-1 w-full">
          <div className="text-base font-semibold text-gray-900 mb-0.5">
            {gregorianDay}
          </div>
          {isShowLunarDay && lunarDay > 0 && (
            <div className="text-xs text-gray-400 mb-1">
              {lunarDay}
            </div>
          )}
          {weather && viewWeather && (
            <div className="flex items-center gap-1 text-xs">
              <img 
                src={weather.icon} 
                alt="weather" 
                className="w-4 h-4"
              />
              <span className="text-gray-600 text-[0.7rem]">
                {weather.temp}
              </span>
            </div>
          )}
        </div>
      );
    },
    [weatherData, viewWeather, isShowLunarDay]
  );

  const handleMoreLinkClick = useCallback(
    (arg: { date: Date; allDay: boolean }) => {
      setTimeout(() => {
        const popover = document.querySelector(".fc-popover") as HTMLElement;
        if (popover) {
          popover.style.maxHeight = "400px";
          popover.style.overflowY = "auto";
          popover.style.borderRadius = "8px";
          popover.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        }
      }, 0);
      if (onMoreClick) {
        onMoreClick(arg.date);
      }
      return 'popover';
    },
    [onMoreClick]
  );

  return (
    <div className="w-full min-h-[600px] bg-white rounded-lg p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={viLocale}
        firstDay={1}
        headerToolbar={false}
        dayHeaderFormat={{
          weekday: 'short'
        }}
        events={events}
        dayMaxEvents={3}
        moreLinkClick={handleMoreLinkClick}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dayCellContent={renderDayCellContent}
        height="auto"
        selectable={true}
        select={handleSelect}
        selectMirror={true}
        unselectAuto={true}
        editable={false}
      />
    </div>
  );
};

export default MonthCalendar;

