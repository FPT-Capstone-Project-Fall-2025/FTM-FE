import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
// import "moment-lunar"; // Removed due to compatibility issues
import viLocale from "@fullcalendar/core/locales/vi";
import EventTypeLabel from "./EventTypeLabel";
import { forEach } from "lodash";
import eventService from "../../services/eventService";
import type { EventFilters } from "../../types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";

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
  setEventSelected: any;
  setIsOpenGPEventInfoModal: any;
  viewWeather?: boolean;
  handleSelect: any;
}

const WeekCalendar = ({
  year,
  month,
  week,
  reload = false,
  eventFilters,
  isShowLunarDay = true,
  setEventSelected,
  setIsOpenGPEventInfoModal,
  viewWeather,
  handleSelect,
}: WeekCalendarProps) => {
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>({});
  const [filterEvents, setFilterEvents] = useState<any>({});

  const fetchEventsAndForecasts = useCallback(async () => {
    if (!filterEvents.year || !filterEvents.month || !filterEvents.week) return;
    try {
      // @ts-ignore - API response needs proper type definition
      const response = await eventService.getWeekEvents(
        filterEvents.year,
        filterEvents.month,
        filterEvents.week,
        filterEvents
      );

      // @ts-ignore - API response needs proper type definition
      const mappedEvents = response?.value?.gpFamilyEvents?.map((event: any) => {
          const start = moment(event.startTime);
          const end = moment(event.endTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
            durationDays >= 1 ||
            (start.format("HH:mm:ss") === "00:00:00" &&
              end.format("HH:mm:ss") === "23:59:59");

          // Với allDay: dùng date-only và cho end = ngày kế tiếp
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
            gpId: event.gpId,
            location: event.location,
            isOwner: event.isOwner,
            recurrence: event.recurrence,
            memberNames: event.memberNames,
            gpName: event.gpName,
            address: event.address,
            locationName: event.locationName,
            isLunar: event.isLunar,
          };
        }) || [];

      setEvents(mappedEvents);

      // @ts-ignore - API response needs proper type definition  
      if (response?.value?.dailyForecasts) {
        const forecastData: any = {};
        // @ts-ignore - API response needs proper type definition
        forEach(response.value.dailyForecasts, (forecast: any) => {
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
      calendarRef.current.getApi().gotoDate(weekStartDate);
    }
  }, [year, month, week, eventFilters]);

  useEffect(() => {
    fetchEventsAndForecasts();
  }, [fetchEventsAndForecasts, reload]);

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
    <div className="custom-event">
      <EventTypeLabel
        type={arg.event.extendedProps.type}
        title={arg.event.title}
        timeStart={moment(arg.event.start).format("HH:mm")}
        timeEnd={moment(arg.event.end).format("HH:mm")}
        allDay={arg.event.allDay}
      />
    </div>
  ), []);

  const renderDayHeaderContent = useCallback(
    (arg: any) => {
      const dayOfWeek = moment(arg.date).isoWeekday();
      const dayNames = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"];
      const dateObj = moment(arg.date);
      const gregorianDay = dateObj.date();
      const lunarDay = (dateObj as any).lunar().date();
      const dayKey = moment(arg.date).format("YYYY-MM-DD");
      const weather = weatherData[dayKey];

      return (
        <div className="day-header-content">
          {weather && viewWeather && (
            <div className="custom-day-weather">
              <img className="week-weather-icon" src={weather.icon} alt="weather icon" />
              <span className="week-temp">{weather.temp}</span>
            </div>
          )}
          <div className="custom-day-cell-content">
            <div className="custom-day-title">{dayNames[dayOfWeek - 1]}</div>
            <div className="custom-day-gregorian">{gregorianDay}</div>
            {isShowLunarDay && (
              <div className="custom-day-lunar">{lunarDay}</div>
            )}
          </div>
        </div>
      );
    },
    [weatherData, viewWeather, isShowLunarDay]
  );

  return (
    <div className="fullcalendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={viLocale}
        firstDay={1}
        events={events}
        headerToolbar={false}
        height="100%"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="00:00:00"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          meridiem: false,
        }}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dayHeaderContent={renderDayHeaderContent}
        selectable={true} // Bật tính năng chọn
        select={(selectInfo) => handleSelect(selectInfo)} // Xử lý sự kiện chọn
      />
    </div>
  );
};

export default WeekCalendar;
