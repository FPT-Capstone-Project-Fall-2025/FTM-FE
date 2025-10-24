import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import moment from "moment";
import { get } from "lodash";
// @ts-ignore - TypeScript conversion in progress
import EventTypeLabel from "./EventTypeLabel";
import eventService from "../../services/eventService";
import type { EventFilters, FamilyEvent } from "@/types/event";
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
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: 0,
        background: 'transparent',
      }}
    >
      {loading && years.length === 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          minHeight: '200px',
        }}>
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
          <div 
            key={year} 
            data-year={year}
            style={{
              marginBottom: '2rem',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: '1.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #f0f0f0',
              margin: '0 0 1.5rem 0',
            }}>
              {year}
            </h2>
            
            {sortedDates.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#999',
                fontStyle: 'italic',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px dashed #e0e0e0',
              }}>
                <p style={{ margin: 0 }}>Không có sự kiện nào trong năm này</p>
              </div>
            ) : (
              <div>
                {sortedDates.map((date) => (
                  <div 
                    key={date}
                    style={{
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{
                      background: '#f8f9fa',
                      padding: '0.875rem 1.25rem',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      border: '1px solid #e8e8e8',
                    }}>
                      <span style={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '0.95rem',
                      }}>
                        {getLunarDateString(date)}
                      </span>
                    </div>
                    <div>
                      {(groupedEvents[date] || []).map((event: any) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          style={{
                            padding: '1rem 1.25rem',
                            marginBottom: '0.75rem',
                            background: '#ffffff',
                            border: '1px solid #e8e8e8',
                            borderLeft: '4px solid #1677ff',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.borderLeftColor = '#40a9ff';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderLeftColor = '#1677ff';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
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
