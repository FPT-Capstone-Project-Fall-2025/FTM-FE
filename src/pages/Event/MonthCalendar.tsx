import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import moment from "moment";
import "moment/locale/vi";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent, CalendarEvent } from "../../types/event";
import { normalizeEventType } from "../../utils/eventUtils";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { processRecurringEvents } from "../../utils/recurringEventUtils";
import { getHolidaysForYear, formatHolidayForCalendar } from "../../utils/vietnameseHolidays";
import { vietnameseCalendarLocale, commonVietnameseCalendarConfig, formatVietnameseDateTime } from "../../utils/vietnameseCalendarConfig";
import type { EventClickArg, EventContentArg, DayCellContentArg } from '@fullcalendar/core';
import { Calendar as CalendarIcon } from 'lucide-react';
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

// Configure moment for Vietnamese (already done in vietnameseCalendarConfig, but ensure it's set)
moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

interface MonthCalendarProps {
  year: number;
  month: number;
  reload?: boolean;
  eventFilters?: EventFilters;
  isShowLunarDay?: boolean;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  setIsOpenGPEventDetailsModal: (open: boolean) => void;
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
  setIsOpenGPEventDetailsModal,
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
      let allEvents: FamilyEvent[] = [];

      // Calculate start and end dates for the calendar month view (outside conditional)
      // Include days from previous and next month that are visible on the calendar
      const startOfMonth = moment(`${year}-${month.toString().padStart(2, '0')}-01`).startOf('month');
      const firstDayOfWeek = startOfMonth.clone().startOf('week'); // Monday of the first week
      const endOfMonth = startOfMonth.clone().endOf('month');
      const lastDayOfWeek = endOfMonth.clone().endOf('week'); // Sunday of the last week

      const startDate = firstDayOfWeek.toDate();
      const endDate = lastDayOfWeek.toDate();

      // Check if family groups are selected
      if (eventFilters?.eventGp && Array.isArray(eventFilters.eventGp) && eventFilters.eventGp.length > 0) {

        // Fetch events for each selected family group using getEventsByGp API
        const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            // Use getEventsByGp API to fetch all events from the group
            const response = await eventService.getEventsByGp(ftId);
            // Handle nested data structure: response.data.data.data
            const events = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];

            // Filter events to only include those in the current month view
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

            return filteredEvents;
          } catch (error) {
            console.error(`Error fetching events for ftId ${ftId}:`, error);
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        allEvents = eventArrays.flat() as any as FamilyEvent[];

      } else {
        // No family groups selected - show empty
        allEvents = [];
      }

      // Process recurring events to generate instances within the month view
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
                : event.recurrenceType === 2 ? 'MONTHLY'
                  : event.recurrenceType === 3 ? 'YEARLY'
                    : 'ONCE';
          }
        }
        return { ...event, recurrence: normalizedRecurrence };
      });

      // Generate recurring event instances for the month view
      const expandedEvents = processRecurringEvents(eventsWithRecurrence, startDate, endDate);

      let apiEvents: CalendarEvent[] = expandedEvents
        .filter((event: any) => {
          // Normalize eventType to uppercase for comparison
          const normalizedEventType = normalizeEventType(event.eventType);

          // Filter by event type if filters are set
          if (eventFilters?.eventType && Array.isArray(eventFilters.eventType) && eventFilters.eventType.length > 0) {
            const eventTypeMatches = eventFilters.eventType.includes(normalizedEventType);
            if (!eventTypeMatches) {
              return false;
            }
          }

          return true;
        })
        .map((event: any) => {
          // Normalize eventType from API (can be string "Wedding" or number 1)
          const normalizedEventType = normalizeEventType(event.eventType);

          // Normalize recurrenceType from API (can be "None" or 0)
          let normalizedRecurrence = 'ONCE';
          if (event.recurrenceType) {
            if (typeof event.recurrenceType === 'string') {
              normalizedRecurrence = event.recurrenceType.toUpperCase() === 'NONE'
                ? 'ONCE'
                : event.recurrenceType.toUpperCase();
            } else if (typeof event.recurrenceType === 'number') {
              normalizedRecurrence = event.recurrenceType === 0 ? 'ONCE'
                : event.recurrenceType === 1 ? 'DAILY'
                  : event.recurrenceType === 2 ? 'MONTHLY'
                    : event.recurrenceType === 3 ? 'YEARLY'
                      : 'ONCE';
            }
          }

          // Extract member names from eventMembers array
          const memberNames = event.eventMembers?.map((m: any) => m.memberName || m.name) || [];

          const mappedEvent = {
            ...event,
            id: event.id,
            name: event.name,
            title: event.name,
            // Use start/end from recurring instances if available, otherwise use startTime/endTime from API
            start: event.start || event.startTime,
            end: event.end || event.endTime,
            eventType: normalizedEventType,
            type: normalizedEventType,
            allDay: event.isAllDay || false,
            description: event.description || '',
            imageUrl: event.imageUrl || null, // null if not provided
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
          return mappedEvent;
        });

      // Add Vietnamese holidays to calendar
      const vietnameseHolidays = getHolidaysForYear(year);
      const holidayEvents = vietnameseHolidays
        .filter(holiday => {
          const holidayMonth = holiday.solarDate.getMonth() + 1;
          return holidayMonth === month;
        })
        .map(holiday => formatHolidayForCalendar(holiday, year));

      // Combine user events and holidays
      // Deduplicate events to avoid duplicates in the same day
      // Use a key based on: name + start date (day only) + end date (day only)
      const seenEvents = new Map<string, CalendarEvent>();
      
      [...apiEvents, ...holidayEvents as any].forEach(event => {
        // Create a unique key based on name and dates (day only, ignore time)
        const startDate = moment(event.start || event.startTime).format('YYYY-MM-DD');
        const endDate = moment(event.end || event.endTime).format('YYYY-MM-DD');
        const dedupeKey = `${event.name || event.title || ''}_${startDate}_${endDate}`;
        
        // Only add if we haven't seen this exact event (same name, same dates) before
        if (!seenEvents.has(dedupeKey)) {
          seenEvents.set(dedupeKey, event);
        }
      });
      
      const combinedEvents = Array.from(seenEvents.values());
      setEvents(combinedEvents);

      // Process weather data (only available from old API)
      // TODO: Integrate weather API separately if needed
      setWeatherData({});
    } catch (error) {
      console.error("Error fetching month events:", error);
      setEvents([]);
    }
  }, [year, month, combinedFilters, eventFilters]);

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

  // Handle date click to create new event
  const handleDateClick = useCallback((arg: any) => {
    const clickedDate = moment(arg.date);

    // Only allow creating events for future dates
    if (clickedDate.isBefore(moment(), 'day')) {
      return;
    }

    // Open modal with clicked date for new event creation
    setEventSelected({
      id: '',
      startTime: clickedDate.toDate(),
      endTime: clickedDate.toDate(),
      isAllDay: true,
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
    } as FamilyEvent);
    setIsOpenGPEventDetailsModal(true);
  }, [setEventSelected, setIsOpenGPEventDetailsModal]);

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

  return (
    <div className="w-full bg-white rounded-lg relative overflow-auto">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={vietnameseCalendarLocale}
        firstDay={commonVietnameseCalendarConfig.firstDay}
        headerToolbar={commonVietnameseCalendarConfig.headerToolbar}
        dayHeaderFormat={{
          weekday: 'short'
        }}
        events={events}
        dayMaxEvents={2}
        moreLinkClick={handleMoreLinkClick}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        dayCellContent={renderDayCellContent}
        dayCellClassNames={dayCellClassNames}
        height={commonVietnameseCalendarConfig.height}
        contentHeight={commonVietnameseCalendarConfig.contentHeight}
        selectable={commonVietnameseCalendarConfig.selectable}
        select={handleSelect}
        selectAllow={selectAllow}
        selectMirror={commonVietnameseCalendarConfig.selectMirror}
        unselectAuto={commonVietnameseCalendarConfig.unselectAuto}
        editable={commonVietnameseCalendarConfig.editable}
      />

      {/* Hover Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-[999] pointer-events-none"
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
                {formatVietnameseDateTime(hoveredDay.date, 'dddd, DD/MM/YYYY')}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthCalendar;
