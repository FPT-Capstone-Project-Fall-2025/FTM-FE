import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
// import "moment-lunar"; // Removed due to compatibility issues
import viLocale from "@fullcalendar/core/locales/vi";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters } from "../../types/event";
import { forEach } from "lodash";
import { addLunarToMoment } from "../../utils/lunarUtils";

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
  setIsOpenGPEventInfoModal: any;
  setEventSelected: any;
  onMoreClick?: any;
  viewWeather?: boolean;
  handleSelect: any;
}

const MonthCalendar = ({
  year,
  month,
  reload = false,
  eventFilters,
  isShowLunarDay = true,
  setIsOpenGPEventInfoModal,
  setEventSelected,
  onMoreClick,
  viewWeather,
  handleSelect,
}: MonthCalendarProps) => {
  const calendarRef = useRef<any>(null);
  const [initialDate, setInitialDate] = useState(
    `${year}-${month.toString().padStart(2, "0")}-01`
  );
  const [events, setEvents] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>({});

  // Ghép các giá trị filter vào 1 đối tượng duy nhất
  const combinedFilters = useMemo(() => ({ ...eventFilters, year, month }), [eventFilters, year, month]);

  // Cập nhật kích thước lịch sau khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
        window.dispatchEvent(new Event("resize"));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Cập nhật initialDate và chuyển lịch về ngày đầu tháng khi year hoặc month thay đổi
  useEffect(() => {
    const newDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    setInitialDate(newDate);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(newDate);
    }
  }, [year, month]);

  // Hàm fetch dữ liệu sự kiện và dự báo thời tiết cho tháng
  const fetchEventsAndForecasts = useCallback(async () => {
    if (!combinedFilters.year || !combinedFilters.month) return;
    try {
      // @ts-ignore - API response needs proper type definition
      const response = await eventService.getMonthEvents(year, month, combinedFilters);
      // @ts-ignore - API response needs proper type definition
      const mappedEvents = response?.value?.gpFamilyEvents?.map((event: any) => ({
        ...event,
        id: event.id,
        title: event.name,
        start: event.startTime,
        end: event.endTime,
        type: event.eventType,
        description: event.description,
        imageUrl: event.imageUrl,
        gpIds: event.gpIds,
        location: event.location,
        isOwner: event.isOwner,
        isAllDay: event.isAllDay,
        recurrence: event.recurrence,
        memberNames: event.memberNames,
        gpNames: event.gpNames,
        address: event.address,
        locationName: event.locationName,
        isLunar: event.isLunar,
      }));
      setEvents(mappedEvents);

      // @ts-ignore - API response needs proper type definition
      let forecastData: any = {};
      // @ts-ignore - API response needs proper type definition
      forEach(response?.value?.dailyForecasts, (forecast: any) => {
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

  // Gọi API chỉ 1 lần khi component mount (và reload nếu cần)
  useEffect(() => {
    fetchEventsAndForecasts();
  }, [fetchEventsAndForecasts, reload]);

  const handleEventClick = useCallback(
    (arg: any) => {
      arg.jsEvent.preventDefault();
      const clickedEvent = events.find((x) => x.id === arg.event.id);
      if (clickedEvent && setEventSelected && setIsOpenGPEventInfoModal) {
        setEventSelected(clickedEvent);
        setIsOpenGPEventInfoModal(true);
      }
    },
    [events, setEventSelected, setIsOpenGPEventInfoModal]
  );

  const renderEventContent = useCallback((arg: any) => (
    <div className="custom-event">
      <EventTypeLabel type={arg.event.extendedProps.type} title={arg.event.title} />
    </div>
  ), []);

  const renderDayCellContent = useCallback(
    (args: any) => {
      const dateObj = moment(args.date);
      const gregorianDay = dateObj.date();
      const lunarDay = (dateObj as any).lunar().date();
      const dayKey = moment(args.date).format("YYYY-MM-DD");
      const weather = weatherData[dayKey];
      return (
        <div className="custom-day-cell-content">
          <div className="custom-day-gregorian">{gregorianDay}</div>
          <div className="custom-day-lunar">{isShowLunarDay && lunarDay ? lunarDay : ""}</div>
          {weather && viewWeather && (
            <div className="custom-day-weather">
              <span className="temp">{weather.temp}</span>
              <img className="weather-icon" src={weather.icon} alt="weather icon" />
            </div>
          )}
        </div>
      );
    },
    [weatherData, viewWeather, isShowLunarDay]
  );

  const handleMoreLinkClick = useCallback(
    (arg: any) => {
      setTimeout(() => {
        const popover = document.querySelector(".fc-popover") as HTMLElement;
        if (popover) {
          popover.style.maxHeight = "300px";
          popover.style.overflowY = "auto";
        }
      }, 0);
      if (onMoreClick) {
        onMoreClick(arg.date);
      }
      return false;
    },
    [onMoreClick]
  );

  return (
    <div className="month-calendar-container">
      {/* @ts-ignore - FullCalendar type definitions need updating */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={viLocale}
        firstDay={1}
        headerToolbar={false}
        dayHeaderFormat={(arg: any) => {
          const dayOfWeek = moment(arg.date).isoWeekday();
          const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
          return dayNames[dayOfWeek - 1];
        }}
        events={events}
        dayMaxEvents={2}
        moreLinkClick={handleMoreLinkClick}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dayCellContent={renderDayCellContent}
        height={'100%'}
        selectable={true} // Bật tính năng chọn
        select={handleSelect} // Xử lý sự kiện chọn
      />
    </div>
  );
};

export default MonthCalendar;
