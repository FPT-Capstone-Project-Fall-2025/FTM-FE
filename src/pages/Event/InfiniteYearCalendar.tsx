import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import moment from "moment";
import { get } from "lodash";
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent } from "@/types/event";
import { addLunarToMoment } from "../../utils/lunarUtils";
import { Spin } from "antd";

// Add lunar stub to moment
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
  eventFilters = { eventType: [], eventGp: [], search: '' },
  reload = false,
  setIsOpenGPEventInfoModal,
  setEventSelected,
  isShowLunarDay = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [years, setYears] = useState<number[]>([]);
  const [yearEvents, setYearEvents] = useState<YearEventsMap>({});
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set());

  const combinedFilters = useMemo(() => ({ ...eventFilters }), [eventFilters]);

  const fetchYearEvents = useCallback(
    async (year: number) => {
      if (yearEvents[year] || loadingYears.has(year)) return;
      
      setLoadingYears(prev => new Set(prev).add(year));
      
      try {
        // Fetch events for the entire year
        const promises = [];
        for (let month = 1; month <= 12; month++) {
          promises.push(eventService.getMonthEvents(year, month, combinedFilters));
        }
        
        const responses = await Promise.all(promises);
        const allEvents = responses.flatMap((response) => 
          get(response, "value.gpFamilyEvents", [])
        );
        
        const events: FamilyEvent[] = allEvents.map((event: FamilyEvent) => ({
          ...event,
          id: event.id,
          name: event.name,
          eventType: event.eventType,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          description: event.description,
          imageUrl: event.imageUrl,
          gpIds: event.gpIds || [],
          gpNames: event.gpNames || [],
          location: event.location,
          isOwner: event.isOwner,
          recurrence: event.recurrence,
          memberNames: event.memberNames || [],
          address: event.address,
          locationName: event.locationName,
          isLunar: event.isLunar,
        }));
        
        setYearEvents((prev) => ({ ...prev, [year]: events }));
      } catch (error) {
        console.error("Error fetching events for year", year, error);
      } finally {
        setLoadingYears(prev => {
          const newSet = new Set(prev);
          newSet.delete(year);
          return newSet;
        });
      }
    },
    [yearEvents, combinedFilters, loadingYears]
  );

  useEffect(() => {
    setYearEvents({});
    setYears([moment().year(), moment().year() + 1]);
  }, [reload, combinedFilters]);

  useEffect(() => {
    if (!years.length) {
      setYears([moment().year(), moment().year() + 1]);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const currentYear = parseInt(target.dataset.year || '0', 10);
            if (currentYear === years[years.length - 1]) {
              setYears((prev) => [...prev, currentYear + 1]);
            }
          }
        });
      },
      { root: containerRef.current, threshold: 0.5 }
    );
    
    const last = containerRef.current?.querySelector(".year-section:last-child");
    if (last) observer.observe(last);
    
    return () => observer.disconnect();
  }, [years]);

  useEffect(() => {
    years.forEach((y) => fetchYearEvents(y));
  }, [years, fetchYearEvents]);

  const handleEventClick = useCallback(
    (event: FamilyEvent) => {
      setEventSelected(event);
      setIsOpenGPEventInfoModal(true);
    },
    [setEventSelected, setIsOpenGPEventInfoModal]
  );

  // Group events by date
  const groupEventsByDate = (events: FamilyEvent[]): GroupedEvents => {
    const grouped: GroupedEvents = {};
    events.forEach((event) => {
      const dateKey = moment(event.startTime).format("YYYY-MM-DD");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  // Get lunar date string
  const getLunarDateString = (date: string): string => {
    try {
      const m = moment(date);
      const gregorian = m.format("D [tháng] M");
      if (!isShowLunarDay) return gregorian;
      const lunar = (m as any).lunar();
      return `${gregorian} (${lunar.date()}/${lunar.month() + 1} ÂL)`;
    } catch (error) {
      return moment(date).format("D [tháng] M");
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden p-2 bg-gray-50 rounded-lg"
    >
      {loadingYears.size > 0 && years.length === 0 && (
        <div className="flex justify-center items-center p-12 min-h-[200px]">
          <Spin size="large" tip="Đang tải..." />
        </div>
      )}
      
      {years.map((year) => {
        const events = yearEvents[year] || [];
        const groupedEvents = groupEventsByDate(events);
        const sortedDates = Object.keys(groupedEvents).sort();
        const isLoadingYear = loadingYears.has(year);

        return (
          <div 
            key={year} 
            data-year={year}
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
                <p className="m-0 text-[0.95rem]">
                  📅 Không có sự kiện nào trong năm này
                </p>
              </div>
            ) : (
              <div>
                {sortedDates.map((date) => (
                  <div 
                    key={date}
                    className="mb-5"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg mb-2 border border-blue-200 flex items-center gap-2">
                      <span className="text-lg">📆</span>
                      <span className="font-semibold text-blue-500 text-[0.95rem]">
                        {getLunarDateString(date)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(groupedEvents[date] || []).map((event: FamilyEvent) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="p-3.5 bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-l-blue-400 hover:shadow-[0_2px_12px_rgba(22,119,255,0.15)] hover:translate-x-1"
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
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InfiniteYearCalendar;
