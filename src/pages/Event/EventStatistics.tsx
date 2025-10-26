import React, { useEffect, useState } from "react";
import eventService from "../../services/eventService";
import moment from "moment";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

const unitMap: { [key: string]: string } = {
  days: "ngày",
  weeks: "tuần",
  months: "tháng",
};

// Mock data for demo
const MOCK_EVENTS = [
  {
    id: "1",
    name: "Giáng sinh",
    startTime: "2025-12-24T00:00:00",
    endTime: "2025-12-25T00:00:00",
    eventType: "HOLIDAY",
    imageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400",
    statisticsEvent: { days: 51, weeks: 7, months: 2 }
  },
  {
    id: "2",
    name: "Tết Nguyên Đán",
    startTime: "2026-01-29T00:00:00",
    endTime: "2026-02-02T00:00:00",
    eventType: "HOLIDAY",
    imageUrl: "https://images.unsplash.com/photo-1548247661-3d7905940716?w=400",
    statisticsEvent: { days: 87, weeks: 12, months: 3 }
  },
  {
    id: "3",
    name: "Sinh nhật Bà",
    startTime: "2025-11-15T00:00:00",
    endTime: "2025-11-15T00:00:00",
    eventType: "BIRTHDAY",
    imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400",
    statisticsEvent: { days: 12, weeks: 2, months: 0 }
  }
];

interface Event {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  eventType: string;
  imageUrl: string;
  statisticsEvent: {
    days: number;
    weeks: number;
    months: number;
  };
}

interface TotalEvent {
  oldEventNumber: number;
  nextEventNumber: number;
}

const EventStatistics: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvent, setTotalEvent] = useState<TotalEvent>({ oldEventNumber: 105, nextEventNumber: 24 });
  const [segmentOrder, setSegmentOrder] = useState<string[]>(["days", "weeks", "months"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await eventService.getUpcomingEvents();
        
        if (response?.value?.gpFamilyEvents && response.value.gpFamilyEvents.length > 0) {
          const mappedEvents = response.value.gpFamilyEvents.map((event: any) => ({
            id: event.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            eventType: event.eventType,
            imageUrl: event.imageUrl || MOCK_EVENTS[0].imageUrl,
            statisticsEvent: event.statisticsEvent || { days: 0, weeks: 0, months: 0 },
          }));
          
          setEvents(mappedEvents);
          setTotalEvent({
            oldEventNumber: response.value.oldEventNumber || 105,
            nextEventNumber: response.value.nextEventNumber || 24,
          });
        } else {
          // Use mock data if no real events
          setEvents(MOCK_EVENTS);
        }
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        // Fallback to mock data on error
        setEvents(MOCK_EVENTS);
      }
    };
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const next = events.find((x) => x.statisticsEvent.days >= 0);
      setSelectedEvent(next || events[0]);
    }
  }, [events, selectedEvent]);

  const handleOnChanged = (eventId: string) => {
    const newEvent = events.find((x) => x.id === eventId);
    if (newEvent) {
      setSelectedEvent(newEvent);
      setDropdownOpen(false);
    }
  };

  const handleSegmentClick = (segment: string) => {
    const base = ["days", "weeks", "months"];
    const idx = base.indexOf(segment);
    const newOrder = [
      base[(idx + 2) % 3],
      base[idx],
      base[(idx + 1) % 3],
    ];
    setSegmentOrder(newOrder);
  };

  const handleCycleUp = () => {
    // Move to previous time unit (months -> weeks -> days -> months)
    const base = ["days", "weeks", "months"];
    const currentIdx = base.indexOf(segmentOrder[1]);
    const prevIdx = (currentIdx - 1 + 3) % 3;
    handleSegmentClick(base[prevIdx]);
  };

  const handleCycleDown = () => {
    // Move to next time unit (days -> weeks -> months -> days)
    const base = ["days", "weeks", "months"];
    const currentIdx = base.indexOf(segmentOrder[1]);
    const nextIdx = (currentIdx + 1) % 3;
    handleSegmentClick(base[nextIdx]);
  };

  return (
    <div className="space-y-3">
      {/* Top Section - Countdown & Event Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
        <div className="flex gap-3">
          {/* Left - Countdown Circle */}
          <div className="flex-1 flex flex-col items-center justify-center">
          <button
                onClick={handleCycleUp}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cycle up"
              >
                <ChevronUp className="w-4 h-4 text-white" />
              </button>
            <div className="flex items-center justify-center gap-2 mb-1">
           
              <div className="text-white text-xs font-medium uppercase tracking-wider">còn</div>
              
            </div>
            
            <div className="relative">
              {segmentOrder.map((seg, idx) => {
                const value = selectedEvent?.statisticsEvent[seg] || 0;
                const isCurrent = idx === 1;
                const isTop = idx === 0;
                const isBottom = idx === 2;
                
                return (
                  <div
                    key={seg}
                    onClick={() => handleSegmentClick(seg)}
                    className={`cursor-pointer transition-all duration-300 ${
                      isCurrent
                        ? 'text-center scale-100'
                        : 'text-center scale-75 opacity-60'
                    } ${isTop ? '-mb-2' : ''} ${isBottom ? '-mt-2' : ''}`}
                  >
                    <div className={`${isCurrent ? 'text-5xl' : 'text-2xl'} font-bold text-white leading-none`}>
                      {value}
                    </div>
                    {isCurrent && (
                      <div className="mt-1 bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full inline-block">
                        <span className="text-white text-xs font-medium">{unitMap[seg]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-1">
            
              <div className="text-white text-xs font-medium uppercase tracking-wider">nữa</div>
            </div>
            <button
                onClick={handleCycleDown}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cycle down"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
          </div>

          {/* Right - Event Card */}
          <div className="w-40 bg-white rounded-xl shadow-md overflow-hidden">
            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-3 py-2 text-sm text-blue-600 font-medium flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <span className="truncate">{selectedEvent?.name || "Chọn sự kiện"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg z-10 max-h-48 overflow-y-auto border border-t-0 border-gray-200">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleOnChanged(event.id)}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                        selectedEvent?.id === event.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Display */}
            {selectedEvent && (
              <div className="text-center py-2 border-b border-gray-100">
                <div className="text-4xl font-bold text-blue-600">
                  {moment(selectedEvent.startTime).format("DD")}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Tháng {moment(selectedEvent.startTime).format("M")}
                </div>
              </div>
            )}

            {/* Event Image */}
            {selectedEvent && (
              <div className="relative h-24 overflow-hidden">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Statistics */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-around gap-4">
          {/* Past Events */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white leading-none">
                {totalEvent.oldEventNumber}
              </div>
              <div className="text-xs text-white/90 font-medium mt-0.5">
                Sự kiện đã qua
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/30"></div>

          {/* Upcoming Events */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-3xl font-bold text-white leading-none text-right">
                {totalEvent.nextEventNumber}
              </div>
              <div className="text-xs text-white/90 font-medium mt-0.5 text-right">
                Sự kiện sắp tới
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventStatistics;
