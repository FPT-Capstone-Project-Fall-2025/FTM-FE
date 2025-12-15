import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import moment from "moment";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import familyTreeService from "../../services/familyTreeService";
import type { EventFilters, FamilyEvent } from "@/types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { normalizeEventType } from "../../utils/eventUtils";
import { Spin } from "antd";
import "./Calendar.css";
import { useAppSelector } from "../../hooks/redux";
import { getUserIdFromToken } from "../../utils/jwtUtils";

addLunarToMoment(moment);
moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

interface InfiniteYearCalendarProps {
  eventFilters?: EventFilters;
  reload?: boolean;
  setIsOpenGPEventInfoModal: (value: boolean) => void;
  setEventSelected: (event: FamilyEvent | null) => void;
  isShowLunarDay?: boolean;
}

interface YearEventsMap {
  [year: number]: FamilyEvent[];
}

interface GroupedEvents {
  [date: string]: FamilyEvent[];
}

const InfiniteYearCalendar: React.FC<InfiniteYearCalendarProps> = ({
  eventFilters = { eventType: [], eventGp: [], search: "" },
  reload = false,
  setIsOpenGPEventInfoModal,
  setEventSelected,
  isShowLunarDay = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [years, setYears] = useState<number[]>([]);
  const [yearEvents, setYearEvents] = useState<YearEventsMap>({});
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set());
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Optimization: State to hold ALL fetched events to avoid repeated API calls
  const [allFetchedEvents, setAllFetchedEvents] = useState<FamilyEvent[] | null>(null);

  const { token, user } = useAppSelector(state => state.auth);
  const currentUserId = getUserIdFromToken(token || '') || user?.userId;

  // ✅ Optimization: Fetch ALL events once when filters/user change
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!currentUserId) return;

      // If no family groups selected, clear events
      if (!eventFilters?.eventGp || eventFilters.eventGp.length === 0) {
        setAllFetchedEvents([]);
        return;
      }

      try {
        console.log(`📅 InfiniteYearCalendar - Fetching ALL events for user ${currentUserId}...`);

        // Fetch events for each selected family group using getEventsByMember API
        const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            // First, get the memberId of the current user in this family tree
            const memberResponse = await familyTreeService.getMyMemberId(ftId, currentUserId);
            const memberId = memberResponse.data.data[0]?.id;

            if (memberId) {
              // Use getEventsByMember(ftId, userId) to fetch events for this member in this specific group
              const response = await eventService.getEventsByMember(ftId, memberId);
              return (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
            }
            return [];
          } catch (error) {
            console.error(`Error fetching events for ftId ${ftId}:`, error);
            return [];
          }
        });

        const eventArrays = await Promise.all(eventPromises);
        const events = eventArrays.flat();

        // Filter events based on selected family groups (double check)
        const filteredEvents = events.filter((event: any) => {
          const eventFtId = event.ftId;
          return eventFtId && eventFilters.eventGp!.includes(eventFtId);
        });

        // Normalize events
        const normalizedEvents: FamilyEvent[] = filteredEvents.map((event: any) => {
          // Normalize eventType
          const normalizedEventType = normalizeEventType(event.eventType);
          const memberNames = event.eventMembers?.map((m: any) => m.memberName || m.name) || [];

          return {
            ...event,
            eventType: normalizedEventType,
            gpIds: event.ftId ? [event.ftId] : [],
            gpNames: [],
            memberNames: memberNames,
          };
        });

        console.log(`📅 InfiniteYearCalendar - Total normalized events: ${normalizedEvents.length}`);
        setAllFetchedEvents(normalizedEvents);

      } catch (error) {
        console.error("⛔ Error fetching all events:", error);
        setAllFetchedEvents([]);
      }
    };

    fetchAllEvents();
  }, [currentUserId, eventFilters?.eventGp, reload]);

  // ✅ Process events for visible years from the cache
  const processEventsForYear = useCallback((year: number) => {
    if (!allFetchedEvents) return; // Not ready yet

    setYearEvents((prev) => {
      if (prev[year]) return prev; // Already processed

      const startDate = moment(`${year}-01-01`).startOf('year');
      const endDate = moment(`${year}-12-31`).endOf('year');

      const eventsForYear = allFetchedEvents.filter((event) => {
        const eventStart = moment(event.startTime);
        const eventEnd = moment(event.endTime);
        return (
          (eventStart.isSameOrAfter(startDate) && eventStart.isSameOrBefore(endDate)) ||
          (eventEnd.isSameOrAfter(startDate) && eventEnd.isSameOrBefore(endDate)) ||
          (eventStart.isBefore(startDate) && eventEnd.isAfter(endDate))
        );
      });

      return { ...prev, [year]: eventsForYear };
    });

    // Remove from loading state
    setLoadingYears((prev) => {
      const newSet = new Set(prev);
      newSet.delete(year);
      return newSet;
    });

  }, [allFetchedEvents]);

  // ✅ Load initial years
  useEffect(() => {
    const currentYear = moment().year();
    const initialYears = Array.from({ length: 3 }, (_, i) => currentYear + i); // Start with 3 years instead of 10
    setYears(initialYears);
    setYearEvents({});
    setLoadingYears(new Set(initialYears)); // Mark initial years as loading
  }, [reload, eventFilters?.eventGp]); // Reset when filters change too

  // ✅ Infinite scroll (bottom loading)
  useEffect(() => {
    if (!containerRef.current || years.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry?.isIntersecting && !isBatchLoading) {
          setIsBatchLoading(true);
          const lastYear = years[years.length - 1];
          if (!lastYear) return;
          const newYears = Array.from({ length: 10 }, (_, i) => lastYear + i + 1);

          // Avoid infinite overflow (limit to 2100)
          const filtered = newYears.filter((y) => y <= 2100);
          if (filtered.length > 0) setYears((prev) => [...prev, ...filtered]);

          setTimeout(() => setIsBatchLoading(false), 1000);
        }
      },
      { root: containerRef.current, rootMargin: "200px", threshold: 0.1 }
    );

    const lastYearEl = containerRef.current.querySelector(".year-section:last-child");
    if (lastYearEl) observer.observe(lastYearEl);

    return () => observer.disconnect();
  }, [years, isBatchLoading]);

  // ✅ Fetch events for each visible year
  useEffect(() => {
    if (years.length === 0) return;

    // Only proceed if we have fetched all events or known it's empty
    if (allFetchedEvents === null) return;

    years.forEach((year) => {
      processEventsForYear(year);
    });
  }, [years, allFetchedEvents, processEventsForYear]);

  const handleEventClick = useCallback(
    (event: FamilyEvent) => {
      setEventSelected(event);
      setIsOpenGPEventInfoModal(true);
    },
    [setEventSelected, setIsOpenGPEventInfoModal]
  );

  const groupEventsByDate = (events: FamilyEvent[]): GroupedEvents => {
    const grouped: GroupedEvents = {};
    events.forEach((event) => {
      const dateKey = moment(event.startTime).format("YYYY-MM-DD");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const getLunarDateString = (date: string): string => {
    try {
      const m = moment(date);
      const gregorian = m.format("D [tháng] M");
      if (!isShowLunarDay) return gregorian;
      const lunar = (m as any).lunar();
      return `${gregorian} (${lunar.date()}/${lunar.month() + 1} ÂL)`;
    } catch {
      return moment(date).format("D [tháng] M");
    }
  };

  // Filter events by eventType when filter changes (client-side filtering)
  const filteredYearEvents = useMemo(() => {
    const filtered: Record<number, FamilyEvent[]> = {};
    Object.keys(yearEvents).forEach((yearStr) => {
      const year = parseInt(yearStr, 10);
      const events = yearEvents[year] || [];
      filtered[year] = events.filter((event: FamilyEvent) => {
        // Filter by event type if filters are set
        if (eventFilters?.eventType && Array.isArray(eventFilters.eventType) && eventFilters.eventType.length > 0) {
          return eventFilters.eventType.includes(event.eventType);
        }
        return true; // Show all events if no filter is set
      });
    });
    return filtered;
  }, [yearEvents, eventFilters?.eventType]);

  return (
    <div
      ref={containerRef}
      className="w-full max-h-[calc(100vh-200px)] overflow-y-auto p-2 bg-gray-50 rounded-lg"
    >
      {years.map((year) => {
        const events = filteredYearEvents[year] || [];
        const groupedEvents = groupEventsByDate(events);
        const sortedDates = Object.keys(groupedEvents).sort();
        const isLoadingYear = loadingYears.has(year);

        return (
          <div
            key={year}
            className="year-section mb-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-5 pb-3 border-b-[3px] border-blue-500 flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
                Năm {year}
              </span>
              {isLoadingYear && <Spin size="small" />}
            </h2>

            {isLoadingYear ? (
              <div className="p-8 text-center">
                <Spin tip="Đang tải sự kiện..." />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p>📅 Không có sự kiện nào trong năm này</p>
              </div>
            ) : (
              sortedDates.map((date) => {
                const isPastDate = moment(date).isBefore(moment(), 'day');
                const dateEvents = groupedEvents[date] || [];

                if (dateEvents.length === 0) return null;

                return (
                  <div key={date} className="mb-5">
                    <div className={`p-3 rounded-lg mb-2 border flex items-center gap-2 ${isPastDate
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                      : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                      }`}>
                      <span className="text-lg">{isPastDate ? '🗓️' : '📆'}</span>
                      <span className={`font-semibold text-[0.95rem] ${isPastDate ? 'text-gray-500' : 'text-blue-500'
                        }`}>
                        {getLunarDateString(date)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`rounded-lg transition-all duration-200 ${isPastDate
                            ? 'border-gray-200 p-2 border-l-gray-400 opacity-60 cursor-default'
                            : 'border-gray-200 p-2 border-l-blue-500 cursor-pointer hover:bg-gray-50 hover:border-l-blue-400 hover:shadow-[0_2px_12px_rgba(22,119,255,0.15)] hover:translate-x-1'
                            }`}
                        >
                          <EventTypeLabel
                            type={event.eventType}
                            title={event.name}
                            timeStart={event.isAllDay ? null : moment(event.startTime).format("HH:mm")}
                            timeEnd={event.isAllDay ? null : moment(event.endTime).format("HH:mm")}
                            allDay={event.isAllDay}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {isBatchLoading && (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" tip="Đang tải thêm 10 năm..." />
        </div>
      )}
    </div>
  );
};

export default InfiniteYearCalendar;
