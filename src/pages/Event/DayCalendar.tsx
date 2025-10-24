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
  setEventSelected,
  viewWeather,
  handleSelect,
}: DayCalendarProps) => {
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>({});
  const [filterEvents, setFilterEvents] = useState<any>({});

  const fetchEventsAndForecasts = useCallback(async (filters: any) => {
    if (!filters.date) return;
    try {
      // @ts-ignore - API response needs proper type definition
      const response = await eventService.getDayEvents(filters.date, filters);
      // @ts-ignore - API response needs proper type definition
      const mappedEvents = response?.value?.gpFamilyEvents?.map((event: any) => {
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
        };
      }) || [];

      setEvents(mappedEvents);

      // @ts-ignore - API response needs proper type definition
      if (response?.value?.dailyForecasts?.length > 0) {
        // @ts-ignore - API response needs proper type definition
        const forecast = response.value.dailyForecasts[0];
        setWeatherData({
          icon: forecast.weatherIcon,
          temp: `${forecast.tempDay}°C`,
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, []);

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

  return (
    <div className="fullcalendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        locale={viLocale}
        headerToolbar={false}
        events={events}
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
        select={handleSelect} // Xử lý sự kiện chọn
      />
    </div>
  );
};

export default DayCalendar;
