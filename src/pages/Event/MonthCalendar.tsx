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
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import './Calendar.css';

// MOCK data for demonstration
const MOCK_EVENTS: FamilyEvent[] = [
  {
    id: "mock-1",
    name: "Sinh nhật",
    startTime: moment().add(1, 'days').set({ hour: 19, minute: 0 }).toISOString(),
    endTime: moment().add(1, 'days').set({ hour: 21, minute: 0 }).toISOString(),
    eventType: "BIRTHDAY",
    isAllDay: false,
    description: "Tiệc sinh nhật gia đình",
    imageUrl: "",
    gpIds: [],
    location: "",
    isOwner: true,
    recurrence: "ONCE",
    memberNames: ["Nguyễn Văn A"],
    gpNames: [],
    address: "Nhà hàng ABC",
    locationName: "Nhà hàng ABC",
    isLunar: false,
  },
  {
    id: "mock-2",
    name: "Du lịch với gia đình tại Paris",
    startTime: moment().add(3, 'days').startOf('day').toISOString(),
    endTime: moment().add(3, 'days').endOf('day').toISOString(),
    eventType: "HOLIDAY",
    isAllDay: true,
    description: "Chuyến du lịch gia đình",
    imageUrl: "",
    gpIds: [],
    location: "Paris",
    isOwner: true,
    recurrence: "ONCE",
    memberNames: ["Gia đình"],
    gpNames: [],
    address: "Paris, France",
    locationName: "Paris",
    isLunar: false,
  },
  {
    id: "mock-3",
    name: "Đám cưới Trần Huyền",
    startTime: moment().add(5, 'days').set({ hour: 11, minute: 0 }).toISOString(),
    endTime: moment().add(5, 'days').set({ hour: 13, minute: 0 }).toISOString(),
    eventType: "WEDDING",
    isAllDay: false,
    description: "Đám cưới của Trần Huyền",
    imageUrl: "",
    gpIds: [],
    location: "Trung tâm hội nghị",
    isOwner: false,
    recurrence: "ONCE",
    memberNames: ["Trần Huyền"],
    gpNames: [],
    address: "Trung tâm hội nghị ABC",
    locationName: "Trung tâm hội nghị",
    isLunar: false,
  },
  {
    id: "mock-4",
    name: "Giỗ họ",
    startTime: moment().add(8, 'days').set({ hour: 17, minute: 30 }).toISOString(),
    endTime: moment().add(8, 'days').set({ hour: 18, minute: 30 }).toISOString(),
    eventType: "DEATH_ANNIVERSARY",
    isAllDay: false,
    description: "Giỗ tổ tiên",
    imageUrl: "",
    gpIds: [],
    location: "Nhà thờ họ",
    isOwner: true,
    recurrence: "YEARLY",
    memberNames: ["Họ Nguyễn"],
    gpNames: [],
    address: "Nhà thờ họ Nguyễn",
    locationName: "Nhà thờ họ",
    isLunar: true,
  },
];

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
  const [hoveredDay, setHoveredDay] = useState<{ date: string; x: number; y: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
      
      let apiEvents: CalendarEvent[] = ((response?.value?.gpFamilyEvents || []) as FamilyEvent[]).map((event: FamilyEvent) => ({
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
      
      // Add MOCK events for demonstration (only if API returns no events)
      if (apiEvents.length === 0) {
        apiEvents = MOCK_EVENTS.map(event => ({
          ...event,
          title: event.name,
          start: event.startTime,
          end: event.endTime,
          type: event.eventType,
          allDay: event.isAllDay,
          extendedProps: {
            type: event.eventType,
            description: event.description,
            location: event.location,
          }
        })) as CalendarEvent[];
      }
      
      setEvents(apiEvents);

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
      // Use MOCK data on error
      const mockEvents = MOCK_EVENTS.map(event => ({
        ...event,
        title: event.name,
        start: event.startTime,
        end: event.endTime,
        type: event.eventType,
        allDay: event.isAllDay,
        extendedProps: {
          type: event.eventType,
          description: event.description,
          location: event.location,
        }
      })) as CalendarEvent[];
      setEvents(mockEvents);
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
      const isPast = dateObj.isBefore(moment(), 'day');
      
      return (
        <div className={`flex flex-col items-center p-1 w-full ${isPast ? 'opacity-50' : ''}`}>
          <div className={`text-base font-semibold mb-0.5 ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
            {gregorianDay}
          </div>
          {isShowLunarDay && lunarDay > 0 && (
            <div className={`text-xs mb-1 ${isPast ? 'text-gray-300' : 'text-gray-400'}`}>
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
              <span className={`text-[0.7rem] ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
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

  const dayCellClassNames = useCallback((arg: any) => {
    const isPast = moment(arg.date).isBefore(moment(), 'day');
    return isPast ? 'fc-day-past' : 'fc-day-future';
  }, []);

  const selectAllow = useCallback((selectInfo: any) => {
    // Only allow selection for future dates
    return moment(selectInfo.start).isSameOrAfter(moment(), 'day');
  }, []);

  // Handle day cell mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dayCell = target.closest('.fc-daygrid-day');
      
      if (dayCell) {
        const dateAttr = dayCell.getAttribute('data-date');
        if (dateAttr && hoveredDay?.date === dateAttr) {
          setTooltipPosition({ x: e.clientX, y: e.clientY });
        }
      }
    };

    const handleDayCellEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const dateAttr = target.getAttribute('data-date');
      
      if (dateAttr) {
        const mouseEvent = e as unknown as MouseEvent;
        setHoveredDay({ 
          date: dateAttr, 
          x: mouseEvent.clientX, 
          y: mouseEvent.clientY 
        });
        setTooltipPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
      }
    };

    const handleDayCellLeave = () => {
      setHoveredDay(null);
    };

    // Add event listeners to all day cells
    const dayCells = document.querySelectorAll('.fc-daygrid-day');
    dayCells.forEach(cell => {
      cell.addEventListener('mouseenter', handleDayCellEnter);
      cell.addEventListener('mouseleave', handleDayCellLeave);
    });

    // Track mouse movement for tooltip positioning
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      dayCells.forEach(cell => {
        cell.removeEventListener('mouseenter', handleDayCellEnter);
        cell.removeEventListener('mouseleave', handleDayCellLeave);
      });
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoveredDay]);

  // Get events for hovered day
  const hoveredDayEvents = useMemo(() => {
    if (!hoveredDay) return [];
    return events.filter(event => {
      const eventDate = moment(event.start).format("YYYY-MM-DD");
      return eventDate === hoveredDay.date;
    });
  }, [hoveredDay, events]);

  const handleCreateEventForDay = useCallback(() => {
    if (!hoveredDay) return;
    const date = moment(hoveredDay.date).toDate();
    setEventSelected({
      startTime: date,
      endTime: date,
      isAllDay: true,
    } as FamilyEvent);
    setIsOpenGPEventInfoModal(true);
    setHoveredDay(null);
  }, [hoveredDay, setEventSelected, setIsOpenGPEventInfoModal]);

  return (
    <div className="w-full bg-white rounded-lg relative overflow-auto">
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
        dayMaxEvents={2}
        moreLinkClick={handleMoreLinkClick}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dayCellContent={renderDayCellContent}
        dayCellClassNames={dayCellClassNames}
        height="auto"
        contentHeight="auto"
        selectable={true}
        select={handleSelect}
        selectAllow={selectAllow}
        selectMirror={true}
        unselectAuto={true}
        editable={false}
      />

      {/* Hover Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 15}px`,
            top: `${tooltipPosition.y + 15}px`,
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-3 max-w-xs pointer-events-auto">
            {/* Date Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm text-gray-900">
                {moment(hoveredDay.date).format("dddd, DD/MM/YYYY")}
              </span>
            </div>

            {/* Events List or No Events Message */}
            {hoveredDayEvents.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hoveredDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </div>
                      {!event.allDay && (
                        <div className="text-xs text-gray-500">
                          {moment(event.start).format("HH:mm")} - {moment(event.end).format("HH:mm")}
                        </div>
                      )}
                      {event.allDay && (
                        <div className="text-xs text-gray-500">Cả ngày</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 mb-2">Chưa có sự kiện</p>
              </div>
            )}

            {/* Create Event Button */}
            {moment(hoveredDay.date).isSameOrAfter(moment(), 'day') && (
              <button
                onClick={handleCreateEventForDay}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sự kiện</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthCalendar;

