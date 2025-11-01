import React, { useEffect, useState, useCallback } from "react";
import eventService from "../../services/eventService";
import familyTreeService from "../../services/familyTreeService";
import moment from "moment";
import "moment/locale/vi";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

moment.locale("vi");

const unitMap: { [key: string]: string } = {
  days: "ngày",
  weeks: "tuần",
  months: "tháng",
};

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
  const [totalEvent, setTotalEvent] = useState<TotalEvent>({ oldEventNumber: 0, nextEventNumber: 0 });
  const [segmentOrder, setSegmentOrder] = useState<string[]>(["days", "weeks", "months"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, weeks: 0, months: 0 });

  // Calculate countdown for an event
  const calculateCountdown = useCallback((eventStartTime: string) => {
    const now = moment();
    const eventDate = moment(eventStartTime);
    
    if (eventDate.isBefore(now)) {
      return { days: 0, weeks: 0, months: 0 };
    }
    
    const totalDays = eventDate.diff(now, 'days');
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = eventDate.diff(now, 'months');
    
    return {
      days: totalDays,
      weeks: totalWeeks,
      months: totalMonths,
    };
  }, []);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        // 1. First, get all family trees for the user
        const familyTreesResponse = await familyTreeService.getMyFamilytrees();
        console.log('📊 EventStatistics - Family Trees Response:', familyTreesResponse);
        
        const familyTrees = familyTreesResponse?.data || [];
        
        if (familyTrees.data.length === 0) {
          console.log('📊 EventStatistics - No family trees found');
          setEvents([]);
          setTotalEvent({ oldEventNumber: 0, nextEventNumber: 0 });
          return;
        }
        
        // 2. Fetch events from all family trees
        const eventPromises = familyTrees.data.map((ft: any) => 
          eventService.getEventsByGp(ft.id).catch((err: any) => {
            console.error(`Error fetching events for ftId ${ft.id}:`, err);
            return { data: { data: [] } };
          })
        );
        
        const eventResponses = await Promise.all(eventPromises);
        
        // 3. Combine all events from all family trees
        const allEventsFromAPI: any[] = [];
        eventResponses.forEach((response: any) => {
          const eventsData = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
          if (Array.isArray(eventsData)) {
            allEventsFromAPI.push(...eventsData);
          }
        });
        
        console.log('📊 EventStatistics - Total events from all family trees:', allEventsFromAPI.length);
        
        if (allEventsFromAPI.length === 0) {
          console.log('📊 EventStatistics - No events found');
          setEvents([]);
          setTotalEvent({ oldEventNumber: 0, nextEventNumber: 0 });
          return;
        }
        
        const now = moment();
        
        // 4. Separate past and upcoming events based on startTime
        const upcomingEventsFromAPI = allEventsFromAPI.filter((event: any) => 
          moment(event.startTime).isAfter(now)
        );
        
        const pastEventsFromAPI = allEventsFromAPI.filter((event: any) => 
          moment(event.startTime).isBefore(now)
        );
        
        // 5. Map upcoming events and calculate countdown
        const mappedEvents = upcomingEventsFromAPI
          .map((event: any) => ({
            id: event.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            eventType: event.eventType,
            imageUrl: event.imageUrl || '',
            statisticsEvent: calculateCountdown(event.startTime),
          }))
          // Sort by closest first
          .sort((a: Event, b: Event) => 
            moment(a.startTime).diff(moment(b.startTime))
          );
        
        setEvents(mappedEvents);
        setTotalEvent({
          oldEventNumber: pastEventsFromAPI.length,
          nextEventNumber: upcomingEventsFromAPI.length,
        });
        
        console.log('📊 EventStatistics - Final results:', {
          total: allEventsFromAPI.length,
          past: pastEventsFromAPI.length,
          upcoming: upcomingEventsFromAPI.length,
          mappedEvents,
        });
        
      } catch (error) {
        console.error("📊 EventStatistics - Error fetching events:", error);
        // No fallback - show empty state
        setEvents([]);
        setTotalEvent({ oldEventNumber: 0, nextEventNumber: 0 });
      }
    };
    fetchUpcomingEvents();
  }, [calculateCountdown]);

  // Auto-select first upcoming event
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      // Events are already sorted by closest first
      const firstEvent = events[0];
      if (firstEvent) {
        setSelectedEvent(firstEvent);
      }
    }
  }, [events, selectedEvent]);

  // Update countdown in real-time for selected event
  useEffect(() => {
    if (!selectedEvent) return;
    
    // Update countdown immediately
    const updateCountdown = () => {
      const newCountdown = calculateCountdown(selectedEvent.startTime);
      setCountdown(newCountdown);
      
      // Update the event in the list as well
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === selectedEvent.id 
            ? { ...event, statisticsEvent: newCountdown }
            : event
        )
      );
    };
    
    updateCountdown();
    
    // Update every minute
    const interval = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, [selectedEvent, calculateCountdown]);

  const handleOnChanged = (eventId: string) => {
    const newEvent = events.find((x) => x.id === eventId);
    if (newEvent) {
      // Recalculate countdown for newly selected event
      const newCountdown = calculateCountdown(newEvent.startTime);
      setSelectedEvent({
        ...newEvent,
        statisticsEvent: newCountdown,
      });
      setCountdown(newCountdown);
      setDropdownOpen(false);
    }
  };

  const handleSegmentClick = (segment: string) => {
    const base: string[] = ["days", "weeks", "months"];
    const idx = base.indexOf(segment);
    const newOrder: string[] = [
      base[(idx + 2) % 3] || "days",
      base[idx] || "weeks",
      base[(idx + 1) % 3] || "months",
    ];
    setSegmentOrder(newOrder);
  };

  const handleCycleUp = () => {
    // Move to previous time unit (months -> weeks -> days -> months)
    const base: string[] = ["days", "weeks", "months"];
    const currentSegment = segmentOrder[1];
    if (!currentSegment) return;
    
    const currentIdx = base.indexOf(currentSegment);
    const prevIdx = (currentIdx - 1 + 3) % 3;
    const prevSegment = base[prevIdx];
    if (prevSegment) {
      handleSegmentClick(prevSegment);
    }
  };

  const handleCycleDown = () => {
    // Move to next time unit (days -> weeks -> months -> days)
    const base: string[] = ["days", "weeks", "months"];
    const currentSegment = segmentOrder[1];
    if (!currentSegment) return;
    
    const currentIdx = base.indexOf(currentSegment);
    const nextIdx = (currentIdx + 1) % 3;
    const nextSegment = base[nextIdx];
    if (nextSegment) {
      handleSegmentClick(nextSegment);
    }
  };

  // Show empty state if no events
  if (events.length === 0) {
    return (
      <div className="space-y-3">
        {/* Empty State */}
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-6 shadow-lg text-center">
          <Calendar className="w-16 h-16 text-white/50 mx-auto mb-3" />
          <p className="text-white text-lg font-medium">Không có sự kiện sắp tới</p>
          <p className="text-white/80 text-sm mt-1">Tạo sự kiện mới để theo dõi</p>
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
  }

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
                // Use real-time countdown state
                const value = countdown[seg as keyof typeof countdown] || 0;
                const isCurrent = idx === 1;
                
                // Only show current segment, hide others
                if (!isCurrent) {
                  return null;
                }
                
                return (
                  <div
                    key={seg}
                    onClick={() => handleSegmentClick(seg)}
                    className="cursor-pointer transition-all duration-300 text-center scale-100"
                  >
                    <div className="text-5xl font-bold text-white leading-none">
                      {value}
                    </div>
                    <div className="mt-1 bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full inline-block">
                      <span className="text-white text-xs font-medium">{unitMap[seg]}</span>
                    </div>
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
                  {events.length > 0 ? (
                    events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleOnChanged(event.id)}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                          selectedEvent?.id === event.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">{event.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {moment(event.startTime).format('DD/MM/YYYY')}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-400 text-center">
                      Không có sự kiện sắp tới
                    </div>
                  )}
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
                  Tháng {moment(selectedEvent.startTime).format("M/YYYY")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {moment(selectedEvent.startTime).format("dddd")}
                </div>
              </div>
            )}

            {/* Event Image */}
            {selectedEvent && (
              <div className="relative h-24 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                {selectedEvent.imageUrl && selectedEvent.imageUrl.startsWith('http') ? (
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-blue-400 opacity-50" />
                  </div>
                )}
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
