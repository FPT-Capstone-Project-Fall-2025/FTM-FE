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

// MOCK DATA for demonstration
const generateMockEventsForDay = (date: string) => {
  const baseDate = moment(date);
  
  return [
    {
      id: "mock-1",
      title: "Họp Gia Đình",
      start: baseDate.clone().hour(9).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      end: baseDate.clone().hour(10).minute(30).format("YYYY-MM-DDTHH:mm:ss"),
      allDay: false,
      type: "MEETING",
      description: "Họp bàn về kế hoạch gia đình",
      isOwner: true,
      location: "Nhà",
      gpNames: ["Gia đình Nguyễn"],
      memberNames: ["Nguyễn Văn A", "Nguyễn Thị B"],
      extendedProps: {
        type: "MEETING",
        description: "Họp bàn về kế hoạch gia đình",
        location: "Nhà",
      }
    },
    {
      id: "mock-2",
      title: "Sinh Nhật Bà Nội",
      start: baseDate.clone().hour(11).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      end: baseDate.clone().hour(14).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      allDay: false,
      type: "BIRTHDAY",
      description: "Chúc mừng sinh nhật bà nội 80 tuổi",
      isOwner: true,
      location: "Nhà Hàng Đông Phương",
      gpNames: ["Gia đình Nguyễn"],
      memberNames: ["Nguyễn Văn A", "Nguyễn Thị B", "Nguyễn Văn C"],
      extendedProps: {
        type: "BIRTHDAY",
        description: "Chúc mừng sinh nhật bà nội 80 tuổi",
        location: "Nhà Hàng Đông Phương",
      }
    },
    {
      id: "mock-3",
      title: "Đi Thăm Mộ Tổ Tiên",
      start: baseDate.clone().hour(15).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      end: baseDate.clone().hour(17).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      allDay: false,
      type: "MEMORIAL",
      description: "Thăm viếng và dọn dẹp mộ tổ tiên",
      isOwner: false,
      location: "Nghĩa trang Bình Hưng Hòa",
      gpNames: ["Gia đình Nguyễn"],
      memberNames: ["Nguyễn Văn A", "Nguyễn Văn D"],
      extendedProps: {
        type: "MEMORIAL",
        description: "Thăm viếng và dọn dẹp mộ tổ tiên",
        location: "Nghĩa trang Bình Hưng Hòa",
      }
    },
    {
      id: "mock-4",
      title: "Tiệc Tối Gia Đình",
      start: baseDate.clone().hour(18).minute(30).format("YYYY-MM-DDTHH:mm:ss"),
      end: baseDate.clone().hour(21).minute(0).format("YYYY-MM-DDTHH:mm:ss"),
      allDay: false,
      type: "GATHERING",
      description: "Bữa tiệc sum họp cả nhà",
      isOwner: true,
      location: "Nhà",
      gpNames: ["Gia đình Nguyễn"],
      memberNames: ["Nguyễn Văn A", "Nguyễn Thị B", "Nguyễn Văn C", "Nguyễn Thị E"],
      extendedProps: {
        type: "GATHERING",
        description: "Bữa tiệc sum họp cả nhà",
        location: "Nhà",
      }
    },
  ];
};

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
    if (!filters.date) {
      // If no date, use mock data for today
      const mockEvents = generateMockEventsForDay(moment().format("YYYY-MM-DD"));
      setEvents(mockEvents);
      return;
    }
    
    // Always load mock data first for immediate display
    const mockEvents = generateMockEventsForDay(filters.date);
    setEvents(mockEvents);
    
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
          extendedProps: {
            type: event.eventType,
            description: event.description,
            location: event.location,
          }
        };
      }) || [];

      // Only use API data if it has events, otherwise keep mock data
      if (mappedEvents.length > 0) {
        setEvents(mappedEvents);
      }

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
      // Keep mock data already set above
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
