import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
import viLocale from "@fullcalendar/core/locales/vi";
import EventTypeLabel from "./EventTypeLabel";
import { forEach } from "lodash";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent, CalendarEvent } from "../../types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import type { EventClickArg, EventContentArg, DayHeaderContentArg } from '@fullcalendar/core';

// Add lunar stub to moment
addLunarToMoment(moment);

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
      const response: any = await eventService.getWeekEvents(
        filterEvents.year,
        filterEvents.month,
        filterEvents.week,
        filterEvents
      );

      const mappedEvents: CalendarEvent[] = ((response?.value?.gpFamilyEvents || []) as FamilyEvent[]).map((event: FamilyEvent) => {
        const start = moment(event.startTime);
        const end = moment(event.endTime);
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

      setEvents(mappedEvents);

      // Process weather data
      if (response?.value?.dailyForecasts) {
        const forecastData: Record<string, WeatherInfo> = {};
        forEach((response.value.dailyForecasts || []) as any[], (forecast: any) => {
          const key = moment(forecast.forecastDate).format("YYYY-MM-DD");
          forecastData[key] = {
            icon: forecast.weatherIcon,
            temp: `${forecast.tempDay}°C`,
          };
        });
        setWeatherData(forecastData);
      }
    } catch (error) {
      console.error("Error fetching week events:", error);
    }
  }, [filterEvents]);

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

  return (
    <div className="w-full min-h-[600px] bg-white rounded-lg p-4">
      <style>{`
        .fc {
          font-family: inherit;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e8e8e8;
        }
        .fc-timegrid-slot {
          height: 3em;
        }
        .fc-col-header-cell {
          background: #fafafa;
          padding: 12px 8px;
          border: 1px solid #e8e8e8;
        }
        .fc-timegrid-axis {
          background: #fafafa;
        }
        .fc-timegrid-slot-label {
          color: #666;
          font-size: 0.85rem;
        }
        .fc-event {
          border: none;
          border-radius: 6px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .fc-event:hover {
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .fc-timegrid-event {
          border-left-width: 4px !important;
        }
        .fc-day-today {
          background: #e6f4ff !important;
        }
        .custom-event {
          width: 100%;
          overflow: hidden;
        }
      `}</style>
      
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={viLocale}
        firstDay={1}
        events={events}
        headerToolbar={false}
        height="auto"
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
        dayHeaderContent={renderDayHeaderContent}
        selectable={true}
        select={handleSelect}
        selectMirror={true}
        unselectAuto={true}
        allDaySlot={true}
        allDayText="Cả ngày"
        nowIndicator={true}
        editable={false}
      />
    </div>
  );
};

export default WeekCalendar;

