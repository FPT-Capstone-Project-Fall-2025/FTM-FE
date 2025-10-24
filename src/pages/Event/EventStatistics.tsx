// @ts-nocheck
import React, { useEffect, useState } from "react";
import eventService from "../../services/eventService";
import moment from "moment";
import { Progress, Select } from "antd";

const unitMap = {
  days: "ngày",
  weeks: "tuần",
  months: "tháng",
};

const EventStatistics = () => {
  const PREFIX_URL = window.env ? window.env.BLOB_STORAGE_DOMAIN : "";
  // @ts-ignore - Type definitions needed for event statistics
  const [selectedEvent, setSelectedEvent] = useState(null);
  // @ts-ignore - Type definitions needed for event statistics
  const [events, setEvents] = useState([]);
  // @ts-ignore - Type definitions needed for event statistics
  const [totalEvent, setTotalEvent] = useState();
  const [segmentOrder, setSegmentOrder] = useState(["days", "weeks", "months"]);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        // @ts-ignore - API response type needs proper definition
        const response = await eventService.getUpcomingEvents();
        // @ts-ignore - Event mapping needs proper types
        const mappedEvents =
        response?.value?.gpFamilyEvents?.map((event: any) => {
          const start = moment(event.startTime);
          const end = moment(event.endTime);
          const durationDays = end.diff(start, "days", true);
          const isAllDay =
            durationDays >= 1 ||
            (start.format("HH:mm:ss") === "00:00:00" &&
              end.format("HH:mm:ss") === "23:59:59");
          return {
            id: event.id,
            title: event.name,
            start,
            end,
            type: event.eventType,
            description: event.description,
            imageUrl: `${PREFIX_URL}/${event.imageUrl}`,
            allDay: isAllDay,
            statisticsEvent: event.statisticsEvent,
          };
        }) || [];
      // @ts-ignore - Sort function needs proper types
      setEvents(mappedEvents.sort((a: any, b: any) => a.start.diff(b.start)));
      // @ts-ignore - Total event object needs proper type definition
      setTotalEvent({
        oldEventNumber: response?.value?.oldEventNumber,
        nextEventNumber: response?.value?.nextEventNumber,
      });
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
      }
    };
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      // @ts-ignore - Event object needs proper type definition
      const next = events.find((x: any) => x.statisticsEvent.days >= 0);
      // @ts-ignore - Set selected event needs proper type
      setSelectedEvent(next || events[0]);
    }
  }, [events, selectedEvent]);

  const handleOnChanged = (eventId: any) => {
    // @ts-ignore - Event object needs proper type definition
    const newEvent = events.find((x: any) => x.id === eventId);
    // @ts-ignore - Set selected event needs proper type
    setSelectedEvent(newEvent);
  };

  // Khi click segment, xoay sao cho segment đó về giữa
  const handleSegmentClick = (segment: any) => {
    const base = ["days", "weeks", "months"];
    const idx = base.indexOf(segment);
    // newOrder[0] = trước, [1] = giữa, [2] = sau
    const newOrder = [
      base[(idx + 2) % 3],
      base[idx],
      base[(idx + 1) % 3],
    ];
    setSegmentOrder(newOrder);
  };

  return (
    <div className="event-statistics">
      <div className="event-statistics__top">
        <div className="event-statistics__left">
          <div className="countdown-circle">
            <div className="countdown-circle__top-label">còn</div>
            <div className="countdown-circle__content">
              {segmentOrder.map((seg, idx) => {
                const posClass =
                  idx === 0
                    ? "days--above"
                    : idx === 1
                    ? "days--center"
                    : "days--below";
                const unitClass = idx === 1 ? "days__unit-pill" : "days__unit";
                return (
                  <div
                    key={seg}
                    className={`days ${posClass}`}
                    onClick={() => handleSegmentClick(seg)}
                  >
                    <span className="days__number">
                      {selectedEvent
                        ? selectedEvent.statisticsEvent[seg]
                        : 0}
                    </span>
                    <span className={unitClass}>{unitMap[seg]}</span>
                  </div>
                );
              })}
            </div>
            <div className="countdown-circle__bottom-label">tới</div>
          </div>
        </div>
        <div className="event-statistics__right">
          <div className="event-card">
            <div className="event-card__header">
              <div className="event-card__dropdown">
                <Select
                  style={{ width: "100%" }}
                  options={events.map((x) => ({
                    value: x.id,
                    label: x.title,
                  }))}
                  onChange={handleOnChanged}
                  value={selectedEvent ? selectedEvent.id : undefined}
                />
              </div>
            </div>
            <div className="event-card__image-wrapper">
              {selectedEvent && selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="event-card__image"
                />
              )}
            </div>
            {selectedEvent && (
              <div className="event-card__date">
                <div className="event-card__date-day">
                  {moment(selectedEvent.start).format("DD")}
                </div>
                <div className="event-card__date-month">
                  {`Tháng ${moment(selectedEvent.start).format("M")}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="event-statistics__bottom">
        {totalEvent && (
          <>
            <div className="event-statistics__bottom-item">
              <div className="event-statistics__bottom-item-number old-event">
                {totalEvent.oldEventNumber}
              </div>
              <div className="event-statistics__bottom-item-label">
                sự kiện đã qua
              </div>
            </div>
            <div className="event-statistics__bottom-progress">
              <Progress
                percent={
                  (totalEvent.oldEventNumber /
                    (totalEvent.nextEventNumber +
                      totalEvent.oldEventNumber)) *
                  100
                }
                showInfo={false}
              />
            </div>
            <div className="event-statistics__bottom-item">
              <div className="event-statistics__bottom-item-number next-event">
                {totalEvent.nextEventNumber}
              </div>
              <div className="event-statistics__bottom-item-label">
                sự kiện sắp tới
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventStatistics;
