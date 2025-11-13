import React, { useEffect, useState, useRef, useCallback } from "react";
import moment from "moment";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent } from "@/types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { normalizeEventType } from "../../utils/eventUtils";
import { Spin } from "antd";
import "./Calendar.css";

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

  const fetchYearEvents = useCallback(
    async (year: number) => {
      // Check if already fetched or loading
      setLoadingYears((prev) => {
        if (prev.has(year)) return prev;
        const newSet = new Set(prev);
        newSet.add(year);
        return newSet;
      });

      setYearEvents((prevYearEvents) => {
        // If already have data for this year, skip
        if (prevYearEvents[year]) {
          setLoadingYears((prev) => {
            const newSet = new Set(prev);
            newSet.delete(year);
            return newSet;
          });
          return prevYearEvents;
        }

        // Fetch events for this year
        (async () => {
          try {
            console.log(`📅 Fetching events for year ${year}...`);
            
            // Check if family groups are selected
            if (!eventFilters?.eventGp || eventFilters.eventGp.length === 0) {
              console.log(`📅 No family groups selected for year ${year}`);
              setYearEvents((prev) => ({ ...prev, [year]: [] }));
              setLoadingYears((prev) => {
                const newSet = new Set(prev);
                newSet.delete(year);
                return newSet;
              });
              return;
            }

            // Calculate start and end dates for the year
            const startDate = moment(`${year}-01-01`).startOf('year').toDate();
            const endDate = moment(`${year}-12-31`).endOf('year').toDate();

            // Fetch events for each selected family group
            const eventPromises = eventFilters.eventGp.map(async (ftId: string) => {
              try {
                const response = await eventService.getEventsByGp(ftId);
                const events = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
                
                // Filter events for this year
                const yearEvents = events.filter((event: any) => {
                  const eventStart = moment(event.startTime);
                  const eventEnd = moment(event.endTime);
                  return (
                    (eventStart.isSameOrAfter(startDate) && eventStart.isSameOrBefore(endDate)) ||
                    (eventEnd.isSameOrAfter(startDate) && eventEnd.isSameOrBefore(endDate)) ||
                    (eventStart.isBefore(startDate) && eventEnd.isAfter(endDate))
                  );
                });
                
                console.log(`📅 Year ${year} - ftId ${ftId}: ${yearEvents.length} events`);
                return yearEvents;
              } catch (error) {
                console.error(`Error fetching events for ftId ${ftId} in year ${year}:`, error);
                return [];
              }
            });

            const eventArrays = await Promise.all(eventPromises);
            const allEvents = eventArrays.flat();

            // Normalize events
            const normalizedEvents: FamilyEvent[] = allEvents.map((event: any) => {
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

            console.log(`📅 Total events for year ${year}: ${normalizedEvents.length}`);
            setYearEvents((prev) => ({ ...prev, [year]: normalizedEvents }));
          } catch (error) {
            console.error(`⛔ Error loading year ${year}:`, error);
            setYearEvents((prev) => ({ ...prev, [year]: [] }));
          } finally {
            setLoadingYears((prev) => {
              const newSet = new Set(prev);
              newSet.delete(year);
              return newSet;
            });
          }
        })();

        return prevYearEvents;
      });
    },
    [eventFilters?.eventGp]
  );

  // ✅ Load initial years
  useEffect(() => {
    const currentYear = moment().year();
    const initialYears = Array.from({ length: 3 }, (_, i) => currentYear + i); // Start with 3 years instead of 10
    setYears(initialYears);
    setYearEvents({});
    setLoadingYears(new Set());
  }, [reload]);

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
    
    // Only fetch if we have family groups selected
    if (!eventFilters?.eventGp || eventFilters.eventGp.length === 0) {
      console.log('📅 No family groups selected, skipping year events fetch');
      return;
    }
    
    years.forEach((year) => {
      // Only fetch if not already loading and not already have data
      if (!loadingYears.has(year) && !yearEvents[year]) {
        fetchYearEvents(year);
      }
    });
  }, [years, eventFilters?.eventGp]);

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

  return (
    <div
      ref={containerRef}
      className="w-full max-h-[calc(100vh-200px)] overflow-y-auto p-2 bg-gray-50 rounded-lg"
    >
      {years.map((year) => {
        const events = yearEvents[year] || [];
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
                    <div className={`p-3 rounded-lg mb-2 border flex items-center gap-2 ${
                      isPastDate 
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' 
                        : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                    }`}>
                      <span className="text-lg">{isPastDate ? '🗓️' : '📆'}</span>
                      <span className={`font-semibold text-[0.95rem] ${
                        isPastDate ? 'text-gray-500' : 'text-blue-500'
                      }`}>
                        {getLunarDateString(date)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`rounded-lg transition-all duration-200 ${
                            isPastDate
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
