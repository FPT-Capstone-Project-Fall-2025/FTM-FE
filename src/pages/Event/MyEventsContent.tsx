import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Edit, Trash2, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import familyTreeService from '../../services/familyTreeService';
import { EVENT_TYPE_CONFIG } from './EventTypeLabel';
import type { ApiEventResponse } from '../../types/event';
import GPEventDetailsModal from './GPEventDetailsModal';
import EventCardSkeleton from '../../components/skeleton/EventCardSkeleton';

const MyEventsContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<ApiEventResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<ApiEventResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch events from all family trees
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    // Only fetch if we're on the my-events tab
    if (tab !== 'my-events') return;
    
    const fetchMyEvents = async () => {
      setLoading(true);
      try {
        // Step 1: Get all family trees of current user
        const familyTreesRes: any = await familyTreeService.getAllFamilyTrees(1, 100);
        const familyTrees = familyTreesRes?.data?.data?.data || familyTreesRes?.data?.data || [];
        
        if (familyTrees.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch events from each family tree
        const eventPromises = familyTrees.map((tree: any) => 
          eventService.getMyEventsByFtId(tree.id)
        );

        const eventResponses = await Promise.all(eventPromises);

        // Step 3: Combine all events from all family trees
        const allEvents: ApiEventResponse[] = [];
        eventResponses.forEach(response => {
          if (response.data && Array.isArray(response.data)) {
            allEvents.push(...response.data);
          }
        });

        // Step 4: Sort events by start time (newest first)
        allEvents.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching my events:", error);
        toast.error("Không thể tải danh sách sự kiện");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [searchParams]);

  const handleEdit = (event: ApiEventResponse) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      const response = await eventService.deleteEventById(eventId);
      if (response.status) {
        toast.success("Xóa sự kiện thành công!");
        setEvents(prev => prev.filter(e => e.id !== eventId));
      } else {
        toast.error(response.message || "Không thể xóa sự kiện");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Có lỗi xảy ra khi xóa sự kiện");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEventUpdated = async () => {
    // Refresh events list after update
    try {
      const familyTreesRes: any = await familyTreeService.getAllFamilyTrees(1, 100);
      const familyTrees = familyTreesRes?.data?.data?.data || familyTreesRes?.data?.data || [];
      
      if (familyTrees.length === 0) return;

      const eventPromises = familyTrees.map((tree: any) => 
        eventService.getMyEventsByFtId(tree.id)
      );

      const eventResponses = await Promise.all(eventPromises);

      const allEvents: ApiEventResponse[] = [];
      eventResponses.forEach(response => {
        if (response.data && Array.isArray(response.data)) {
          allEvents.push(...response.data);
        }
      });

      allEvents.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      setEvents(allEvents);
    } catch (error) {
      console.error("Error refreshing events:", error);
    }
  };

  const formatEventTime = (event: ApiEventResponse) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    if (event.isAllDay) {
      return `${format(startDate, 'dd/MM/yyyy', { locale: vi })} - Cả ngày`;
    }

    return `${format(startDate, 'dd/MM/yyyy HH:mm', { locale: vi })} - ${format(endDate, 'HH:mm', { locale: vi })}`;
  };

  // Skeleton loading UI
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(index => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có sự kiện nào
        </h3>
        <p className="text-gray-600">
          Bạn chưa được tag trong bất kỳ sự kiện nào
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-w-0 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Sự kiện của tôi</h2>
        <p className="text-sm text-gray-600 mt-1">{events.length} sự kiện</p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <div
            key={event.id}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-[520px]"
          >
            {/* Event Type Header */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>

            {/* Event Image */}
            <div className="w-full h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50';
                      placeholder.innerHTML = `
                        <div class="text-center">
                          <Calendar class="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p class="text-sm text-gray-500">${event.name}</p>
                        </div>
                      `;
                      target.parentElement.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 px-4 line-clamp-2">{event.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Event Content */}
            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              {/* Event Type Badge */}
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                {(() => {
                  // @ts-ignore - eventType from API is string
                  const config = EVENT_TYPE_CONFIG[event.eventType];
                  return config && (
                    <>
                      <img
                        src={config.icon}
                        alt={String(event.eventType)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {config.label}
                      </span>
                    </>
                  );
                })()}
                {event.recurrenceType !== 'None' && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {event.recurrenceType}
                  </span>
                )}
              </div>

              {/* Event Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 flex-shrink-0">
                {event.name}
              </h3>

              {/* Event Time */}
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-2 flex-shrink-0">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{formatEventTime(event)}</span>
              </div>

              {/* Event Location */}
              {event.locationName && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-2 flex-shrink-0">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{event.locationName}</span>
                </div>
              )}

              {/* Event Members */}
              {event.eventMembers && event.eventMembers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 flex-shrink-0">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{event.eventMembers.length} thành viên</span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-shrink-0">
                  {event.description}
                </p>
              )}

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1"></div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 flex-shrink-0">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={() => setDeleteConfirmId(event.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal - Outside the grid */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa sự kiện này không?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedEvent && (
        <GPEventDetailsModal
          isOpenModal={isEditModalOpen}
          setIsOpenModal={setIsEditModalOpen}
          eventSelected={selectedEvent}
          defaultValues={{
            name: selectedEvent.name,
            eventType: selectedEvent.eventType,
            isAllDay: selectedEvent.isAllDay,
            startTime: selectedEvent.startTime,
            endTime: selectedEvent.endTime,
            location: selectedEvent.location,
            locationName: selectedEvent.locationName,
            recurrence: selectedEvent.recurrenceType,
            description: selectedEvent.description,
            imageUrl: selectedEvent.imageUrl,
            address: selectedEvent.address,
            recurrenceEndTime: selectedEvent.recurrenceEndTime,
            targetMemberId: selectedEvent.targetMemberId,
            isPublic: selectedEvent.isPublic,
            isLunar: selectedEvent.isLunar,
            members: selectedEvent.eventMembers?.map(m => m.ftMemberId) || [],
            gpIds: [],
          }}
          handleCreatedEvent={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default MyEventsContent;

