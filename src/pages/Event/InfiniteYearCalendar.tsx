import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import moment from "moment";
import { get } from "lodash";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent } from "@/types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
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

  const combinedFilters = useMemo(() => ({ ...eventFilters }), [eventFilters]);

  const fetchYearEvents = useCallback(
    async (year: number) => {
      if (yearEvents[year] || loadingYears.has(year)) return;

      setLoadingYears((prev) => new Set(prev).add(year));
      try {
        const promises = Array.from({ length: 12 }, async (_, i) => {
          const month = i + 1;
          try {
            const res = await eventService.getMonthEvents(year, month, combinedFilters);
            return get(res, "value.gpFamilyEvents", []);
          } catch (err: any) {
            // ✅ Nếu là lỗi 404 (Not Found) → bỏ qua tháng đó
            if (err?.response?.status === 404) {
              console.warn(`Không có dữ liệu tháng ${month}/${year}`);
              return [];
            }
            // ✅ Các lỗi khác thì dừng hẳn
            console.error(`Lỗi khi lấy dữ liệu tháng ${month}/${year}:`, err);
            throw err;
          }
        });

        const responses = await Promise.all(promises);
        const allEvents = responses.flat();

        // ✅ Nếu cả năm không có dữ liệu → bỏ qua
        if (allEvents.length === 0) {
          console.info(`Không có sự kiện nào trong năm ${year}. Dừng tải thêm.`);
          return;
        }

        const events: FamilyEvent[] = allEvents.map((event: FamilyEvent) => ({
          ...event,
          gpIds: event.gpIds || [],
          gpNames: event.gpNames || [],
          memberNames: event.memberNames || [],
        }));

        setYearEvents((prev) => ({ ...prev, [year]: events }));
      } catch (error) {
        console.error(`⛔ Dừng tải năm ${year} do lỗi hệ thống:`, error);
      } finally {
        setLoadingYears((prev) => {
          const newSet = new Set(prev);
          newSet.delete(year);
          return newSet;
        });
      }
    },
    [yearEvents, combinedFilters, loadingYears]
  );

  // ✅ Load initial years
  useEffect(() => {
    const currentYear = moment().year();
    const initialYears = Array.from({ length: 10 }, (_, i) => currentYear + i);
    setYears(initialYears);
    setYearEvents({});
  }, [reload, combinedFilters]);

  // ✅ Infinite scroll (bottom loading)
  useEffect(() => {
    if (!containerRef.current || years.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isBatchLoading) {
          setIsBatchLoading(true);
          const lastYear = years[years.length - 1];
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
    years.forEach((year) => fetchYearEvents(year));
  }, [years, fetchYearEvents]);

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
                      {groupedEvents[date].map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`p-3.5 bg-white border rounded-lg transition-all duration-200 ${
                            isPastDate
                              ? 'border-gray-200 border-l-4 border-l-gray-400 opacity-60 cursor-default'
                              : 'border-gray-200 border-l-4 border-l-blue-500 cursor-pointer hover:bg-gray-50 hover:border-l-blue-400 hover:shadow-[0_2px_12px_rgba(22,119,255,0.15)] hover:translate-x-1'
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
