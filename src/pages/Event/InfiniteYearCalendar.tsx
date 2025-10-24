import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import moment from "moment";
import { get } from "lodash";
// @ts-ignore - TypeScript conversion in progress
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent } from "@/types/event";
import "./InfiniteYearCalendar.scss";
import { addLunarToMoment } from "../../utils/lunarUtils";

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
  [year: number]: any[];
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
  const [loading, setLoading] = useState<boolean>(false);

  const combinedFilters = useMemo(() => ({ ...eventFilters }), [eventFilters]);

  const fetchYearEvents = useCallback(
    async (year: number) => {
      if (yearEvents[year]) return;
      setLoading(true);
      try {
        // Fetch events for the entire year
        const promises = [];
        for (let month = 1; month <= 12; month++) {
          promises.push(eventService.getMonthEvents(year, month, combinedFilters));
        }
        
        const responses = await Promise.all(promises);
        const allEvents = responses.flatMap((response) => get(response, "events", []));
        
        const events = allEvents.map((event: FamilyEvent, index: number) => {
          const start = moment(event.startTime);
          const end = moment(event.endTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
            event.isAllDay ||
            durationDays >= 1 ||
            (start.format("HH:mm:ss") === "00:00:00" &&
             end.format("HH:mm:ss") === "23:59:59");

          // Format dates for FullCalendar
          let startStr = start.format("YYYY-MM-DDTHH:mm:ss");
          let endStr = end.format("YYYY-MM-DDTHH:mm:ss");
          if (isAllDay) {
            startStr = start.format("YYYY-MM-DD");
            endStr = end.clone().add(1, "day").format("YYYY-MM-DD");
          }

          return {
            ...event,
            id: event.id || `${year}-${index}`,
            title: event.name,
            start: startStr,
            end: endStr,
            allDay: isAllDay,
            type: event.eventType,
            description: event.description,
            imageUrl: event.imageUrl,
            gpIds: event.gpIds,
            gpNames: event.gpNames,
            location: event.location,
            isOwner: event.isOwner,
            recurrence: event.recurrence,
            memberNames: event.memberNames,
            address: event.address,
            locationName: event.locationName,
            isLunar: event.isLunar,
          };
        });
        
        setYearEvents((prev) => ({ ...prev, [year]: events }));
      } catch (error) {
        console.error("Error fetching events for year", year, error);
      } finally {
        setLoading(false);
      }
    },
    [yearEvents, combinedFilters]
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
  const groupEventsByDate = (events: any[]) => {
    const grouped: { [key: string]: any[] } = {};
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
    <div className="infinite-year-calendar" ref={containerRef}>
      {loading && years.length === 0 && (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      )}
      
      {years.map((year) => {
        const events = yearEvents[year] || [];
        const groupedEvents = groupEventsByDate(events);
        const sortedDates = Object.keys(groupedEvents).sort();

        return (
          <div key={year} className="year-section" data-year={year}>
            <h2 className="year-title">{year}</h2>
            
            {sortedDates.length === 0 ? (
              <div className="no-events">
                <p>Không có sự kiện nào trong năm này</p>
              </div>
            ) : (
              <div className="events-list">
                {sortedDates.map((date) => (
                  <div key={date} className="date-group">
                    <div className="date-header">
                      <span className="date-label">{getLunarDateString(date)}</span>
                    </div>
                    <div className="events-for-date">
                      {(groupedEvents[date] || []).map((event: any) => (
                        <div
                          key={event.id}
                          className="event-item"
                          onClick={() => handleEventClick(event)}
                        >
                          {/* @ts-ignore - EventTypeLabel component type conversion in progress */}
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
