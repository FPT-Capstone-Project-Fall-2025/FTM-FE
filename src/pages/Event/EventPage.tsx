import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DatePicker, Radio } from 'antd';
import { Search, Calendar, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import 'moment/locale/vi';
import './Calendar.css';

// Components
import EventSidebar from './EventSidebar';
// import YearCalendar from './YearCalendar';
import MonthCalendar from './MonthCalendar';
import WeekCalendar from './WeekCalendar';
import DayCalendar from './DayCalendar';
import InfiniteYearCalendar from './InfiniteYearCalendar';
import GPEventInfoModal from './GPEventInfoModal';
import GPEventDetailsModal from './GPEventDetailsModal';
// import MyEventsContent from './MyEventsContent'; // Removed - not used

// Types
import type {
  ViewMode,
  EventFilters,
  FamilyEvent,
  CalendarSelectInfo,
} from '@/types/event';
import { normalizeEventType } from '@/utils/eventUtils';


// Configure moment
moment.locale('vi');
moment.updateLocale('vi', { week: { dow: 1, doy: 1 } });

const EventPage: React.FC = () => {
  const now = new Date();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  // Debug: Log when tab changes
  useEffect(() => {
    console.log('EventPage - Current tab:', tab);
  }, [tab]);

  // State Management
  const [viewMode, setViewMode] = useState<ViewMode>('month' as ViewMode);
  const [currentDate, setCurrentDate] = useState<Date>(now);
  const [reload, setReload] = useState<boolean>(false);
  const [isShowLunarDay, setIsShowLunarDay] = useState<boolean>(true);
  const [viewWeather] = useState<boolean>(true);
  const [eventFilters, setEventFilters] = useState<EventFilters | null>(null);
  const [search, setSearch] = useState<string>('');
  const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);

  // Loading states
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  // Modal States
  const [isOpenGPEventInfoModal, setIsOpenGPEventInfoModal] = useState<boolean>(false);
  const [isOpenGPEventDetailsModal, setIsOpenGPEventDetailsModal] = useState<boolean>(false);
  const [eventSelected, setEventSelected] = useState<FamilyEvent | null>(null);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FamilyEvent[]>([]);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('GPEventDetailsModal state changed:', isOpenGPEventDetailsModal);
  }, [isOpenGPEventDetailsModal]);

  // Initialize loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Date Navigation Handlers
  const handleNext = useCallback(() => {
    switch (viewMode) {
      case 'year':
        setCurrentDate(moment(currentDate).add(1, 'year').toDate());
        break;
      case 'month':
        setCurrentDate(moment(currentDate).add(1, 'month').toDate());
        break;
      case 'week': {
        const endOfCurrentWeek = moment(currentDate).endOf('isoWeek');
        const nextWeek = endOfCurrentWeek.add(1, 'week').endOf('isoWeek');
        setCurrentDate(nextWeek.toDate());
        break;
      }
      case 'day':
        setCurrentDate(moment(currentDate).add(1, 'day').toDate());
        break;
      default:
        break;
    }
  }, [viewMode, currentDate]);

  const handlePrev = useCallback(() => {
    switch (viewMode) {
      case 'year':
        setCurrentDate(moment(currentDate).subtract(1, 'year').toDate());
        break;
      case 'month':
        setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
        break;
      case 'week': {
        const startOfCurrentWeek = moment(currentDate).endOf('isoWeek');
        const prevWeek = startOfCurrentWeek.subtract(1, 'week').endOf('isoWeek');
        setCurrentDate(prevWeek.toDate());
        break;
      }
      case 'day':
        setCurrentDate(moment(currentDate).subtract(1, 'day').toDate());
        break;
      default:
        break;
    }
  }, [viewMode, currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleSelectedDate = useCallback((value: dayjs.Dayjs | null) => {
    if (value) {
      setCurrentDate(value.toDate());
      setOpenDatePicker(false);
    }
  }, []);

  // Filter Handler
  const handleFilter = useCallback((data: Partial<EventFilters>) => {
    setEventFilters((prev) => ({
      ...(prev || {}),
      eventType: data.eventType || [],
      eventGp: data.eventGp || [],
      eventLocation: data.eventLocation || null,
    }));
  }, []);

  // Search Handler with Debounce
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value) {
          setViewMode('list' as ViewMode);
        }
      }, 1000),
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
      setEventFilters((prev) => ({
        ...(prev || {}),
        search: value,
      }));
      handleSearch(value);
    },
    [handleSearch]
  );

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearch('');
    setEventFilters((prev) => ({
      ...(prev || {}),
      search: '',
    }));
    setSearchResults([]);
    setIsSearchResultsOpen(false);
    setViewMode('month' as ViewMode);
  }, []);

  // Search events handler (triggered on Enter)
  const handleSearchEvents = useCallback(async () => {
    if (!search.trim()) return;
    
    try {
      console.log('🔍 Searching for events:', search);
      
      // Import eventService
      const eventServiceModule = await import('../../services/eventService');
      const eventService = eventServiceModule.default;
      
      // Search in all family groups
      if (eventFilters?.eventGp && eventFilters.eventGp.length > 0) {
        const searchPromises = eventFilters.eventGp.map(async (ftId: string) => {
          try {
            const response = await eventService.getEventsByGp(ftId);
            const events = (response?.data as any)?.data?.data || (response?.data as any)?.data || [];
            
            // Filter events by search term
            return events.filter((event: any) => {
              const searchLower = search.toLowerCase();
              return (
                event.name?.toLowerCase().includes(searchLower) ||
                event.description?.toLowerCase().includes(searchLower) ||
                event.location?.toLowerCase().includes(searchLower) ||
                event.address?.toLowerCase().includes(searchLower)
              );
            });
          } catch (error) {
            console.error(`Error searching events in group ${ftId}:`, error);
            return [];
          }
        });
        
        const resultsArrays = await Promise.all(searchPromises);
        const allResults = resultsArrays.flat();
        
        console.log('🔍 Search results:', allResults.length, 'events found');
        setSearchResults(allResults);
        setIsSearchResultsOpen(true);
      }
    } catch (error) {
      console.error('Error searching events:', error);
    }
  }, [search, eventFilters]);

  // Handle Enter key press
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchEvents();
    }
  }, [handleSearchEvents]);

  // Event Created Handler
  const handleCreatedEvent = useCallback(() => {
    setReload((prev) => !prev);
  }, []);

  // Calendar Select Handler
  const handleSelect = useCallback(
    (selectInfo: CalendarSelectInfo) => {
      const { start, end } = selectInfo;

      // Adjust end time by subtracting 1 day for multi-day events
      const adjustedEndTime = dayjs(end).subtract(1, 'day');

      const newEvent: Partial<FamilyEvent> = {
        startTime: start,
        endTime: viewMode !== 'day' ? adjustedEndTime.toDate() : end,
        isAllDay: viewMode !== 'day',
      } as Partial<FamilyEvent>;

      setEventSelected(newEvent as FamilyEvent);
      setIsOpenGPEventDetailsModal(true);

      console.log('Selected selectInfo:', selectInfo);
      console.log('Selected event:', newEvent);
    },
    [viewMode]
  );

  // Get date display text
  const getDateDisplayText = useMemo(() => {
    const momentDate = moment(currentDate);
    switch (viewMode) {
      case 'year':
        return `Năm ${momentDate.year()}`;
      case 'month':
        return momentDate.format('MMMM YYYY');
      case 'week': {
        const startOfWeek = momentDate.clone().startOf('isoWeek');
        const endOfWeek = momentDate.clone().endOf('isoWeek');
        return `${startOfWeek.format('DD/MM/YYYY')} - ${endOfWeek.format('DD/MM/YYYY')}`;
      }
      case 'day':
        return momentDate.format('dddd, DD/MM/YYYY');
      default:
        return momentDate.format('MMMM YYYY');
    }
  }, [currentDate, viewMode]);

  // Render Calendar based on view mode
  const renderCalendar = () => {
    const commonProps = {
      year: moment(currentDate).year(),
      month: moment(currentDate).month() + 1,
      reload,
      eventFilters: eventFilters || {},
      isShowLunarDay,
      viewWeather,
      setEventSelected,
      setIsOpenGPEventInfoModal,
      setIsOpenGPEventDetailsModal,
      handleSelect,
    };

    switch (viewMode) {
      case 'year':
        return <InfiniteYearCalendar
          reload={reload}
          eventFilters={eventFilters || {}}
          isShowLunarDay={isShowLunarDay}
          setEventSelected={setEventSelected}
          setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
        />;
      case 'month':
        return <MonthCalendar
          {...commonProps}
          onMoreClick={() => { }}
        />;
      case 'week':
        return (
          <WeekCalendar
            {...commonProps}
            week={moment(currentDate).isoWeek()}
          />
        );
      case 'day':
        return <DayCalendar
          date={currentDate}
          reload={reload}
          {...(eventFilters && { eventFilters })}
          isShowLunarDay={isShowLunarDay}
          viewWeather={viewWeather}
          setEventSelected={setEventSelected}
          setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
          setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
          handleSelect={handleSelect}
        />;
      case 'list':
        return <InfiniteYearCalendar
          reload={reload}
          eventFilters={eventFilters || {}}
          isShowLunarDay={isShowLunarDay}
          setEventSelected={setEventSelected}
          setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
        />;
      default:
        {/* @ts-ignore - Calendar component type conversion in progress */ }
        return <MonthCalendar
          {...commonProps}
          onMoreClick={() => { }}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10 overflow-x-hidden">
      <div className="mx-auto px-4 py-5">
        <div className="flex gap-5 flex-wrap lg:flex-nowrap">
          {/* Sidebar - Filters and Statistics */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow-sm sticky top-5 max-h-[calc(100vh-100px)] overflow-y-auto">
              <EventSidebar
                handleFilter={handleFilter}
                setIsShowLunarDay={setIsShowLunarDay}
                setEventSelected={setEventSelected}
                setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
              />
            </div>
          </div>

          {/* Main Content - Calendar or My Events */}
          <div className="bg-white rounded-lg p-5 shadow-sm max-h-[calc(100vh-100px)] w-full overflow-auto flex flex-col">
            <div className="flex-1 w-full min-w-0">
              <>
                {/* Header Section */}
                <div className="mb-3 flex-shrink-0">
                    {/* Title */}
                    {/* <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                      Lịch sự kiện gia phả
                    </h2> */}

                    {/* Search Bar */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={handleSearchChange}
                        onKeyPress={handleSearchKeyPress}
                        className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      
                      {/* Enter button/icon */}
                      <button
                        onClick={handleSearchEvents}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-gray-300 hover:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                        title="Tìm kiếm (Enter)"
                        type="button"
                      >
                        <CornerDownLeft className="w-3 h-3" />
                       
                      </button>
                      
                      {search && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                          title="Xóa tìm kiếm"
                          type="button"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Calendar Controls */}
                    <div className="pb-2 border-b border-gray-200">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex gap-2">
                            <button
                              onClick={handlePrev}
                              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                              aria-label="Previous"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={handleToday}
                              className="px-3 py-2 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors font-medium"
                            >
                              Hôm nay
                            </button>
                            <button
                              onClick={handleNext}
                              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                              aria-label="Next"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Date Display with Picker */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenDatePicker(!openDatePicker)}
                              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span>{getDateDisplayText}</span>
                            </button>
                            <DatePicker
                              open={openDatePicker}
                              value={dayjs(currentDate)}
                              onChange={handleSelectedDate}
                              onOpenChange={setOpenDatePicker}
                              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                              getPopupContainer={(trigger: any) => trigger.parentElement || document.body}
                            />
                          </div>
                        </div>

                        {/* Right Side Controls */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* View Mode Selector */}
                          <Radio.Group
                            value={viewMode}
                            onChange={(e: any) => setViewMode(e.target.value as ViewMode)}
                            buttonStyle="solid"
                            size="middle"
                          >
                            <Radio.Button value="day">Ngày</Radio.Button>
                            <Radio.Button value="week">Tuần</Radio.Button>
                            <Radio.Button value="month">Tháng</Radio.Button>
                            <Radio.Button value="year">Năm</Radio.Button>
                          </Radio.Group>

                          {/* Weather Toggle */}
                          {/* <button
                            onClick={() => setViewWeather(!viewWeather)}
                            className={`p-2.5 rounded-lg transition-colors ${viewWeather
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                              } border`}
                            title={viewWeather ? 'Ẩn thời tiết' : 'Hiện thời tiết'}
                            aria-label="Toggle weather"
                          >
                            <CloudSun className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calendar View Content */}
                  <div className="mt-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-auto">
                    {initialLoading ? (
                      <div className="flex justify-center items-center py-20 min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-20 min-h-[400px]">
                        <p className="text-red-500 mb-5">{error}</p>
                        <button
                          onClick={() => setReload(!reload)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        {renderCalendar()}
                      </div>
                    )}
        </div>
              </>
            </div>
          </div>
        </div>
      </div>

      {/* Event Info Modal */}
      {isOpenGPEventInfoModal && eventSelected && (
        <GPEventInfoModal
          isOpenModal={isOpenGPEventInfoModal}
          setIsOpenModal={setIsOpenGPEventInfoModal}
          defaultValues={{
            ...eventSelected,
            onEventDeleted: () => {
              setReload((prev) => !prev);
              setEventSelected(null);
              setIsOpenGPEventInfoModal(false);
            },
          }}
          setConfirmDeleteModal={() => { }}
          setConfirmDeleteAllModal={() => { }}
          setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
          setEventSelected={setEventSelected}
        />
      )}

      {/* Event Details Modal (Create/Edit) */}
      {isOpenGPEventDetailsModal && (
        <GPEventDetailsModal
          isOpenModal={isOpenGPEventDetailsModal}
          setIsOpenModal={setIsOpenGPEventDetailsModal}
          eventSelected={eventSelected}
          // defaultValues={eventSelected}
          handleCreatedEvent={handleCreatedEvent}
        />
      )}

      {/* Search Results Modal */}
      {isSearchResultsOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsSearchResultsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="flex items-center space-x-3">
                <Search className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">
                  Kết quả tìm kiếm "{search}"
                </h2>
              </div>
              <button
                onClick={() => setIsSearchResultsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Không tìm thấy sự kiện nào</p>
                  <p className="text-gray-400 text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Tìm thấy <span className="font-semibold text-blue-600">{searchResults.length}</span> sự kiện
                  </p>
                  {searchResults.map((event: any, index: number) => (
                    <div
                      key={event.id || index}
                      onClick={() => {
                        // Map API event to FamilyEvent format
                        const mappedEvent: FamilyEvent = {
                          ...event,
                          name: event.name || '',
                          startTime: event.startTime,
                          endTime: event.endTime,
                          eventType: normalizeEventType(event.eventType),
                          recurrence: event.recurrenceType === 'NONE' || event.recurrenceType === 0 ? 'ONCE'
                            : event.recurrenceType === 1 ? 'DAILY'
                            : event.recurrenceType === 2 ? 'WEEKLY'
                            : event.recurrenceType === 3 ? 'MONTHLY'
                            : event.recurrenceType === 4 ? 'YEARLY'
                            : 'ONCE',
                          memberNames: event.eventMembers?.map((m: any) => m.memberName || m.name) || [],
                          gpNames: [],
                          gpIds: event.ftId ? [event.ftId] : [],
                          isOwner: event.isOwner || false,
                          isAllDay: event.isAllDay || false,
                          description: event.description || '',
                          imageUrl: event.imageUrl || '',
                          location: event.location || '',
                          address: event.address || '',
                          locationName: event.locationName || '',
                          isLunar: event.isLunar || false,
                          isPublic: event.isPublic !== undefined ? event.isPublic : true,
                          referenceEventId: event.referenceEventId || null,
                          recurrenceEndTime: event.recurrenceEndTime || null,
                          createdOn: event.createdOn || new Date().toISOString(),
                          lastModifiedOn: event.lastModifiedOn || new Date().toISOString(),
                          eventMembers: event.eventMembers || [],
                          targetMemberId: event.targetMemberId || null,
                          targetMemberName: event.targetMemberName || null,
                        };
                        setEventSelected(mappedEvent);
                        setIsSearchResultsOpen(false);
                        setIsOpenGPEventInfoModal(true);
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                            {event.name}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {moment(event.startTime).format('DD/MM/YYYY HH:mm')} - {moment(event.endTime).format('DD/MM/YYYY HH:mm')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.description && (
                              <p className="text-gray-500 line-clamp-2 mt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            typeof event.eventType === 'string' && event.eventType.toUpperCase() === 'WEDDING' ? 'bg-pink-100 text-pink-700' :
                            event.eventType === 1 ? 'bg-pink-100 text-pink-700' :
                            typeof event.eventType === 'string' && event.eventType.toUpperCase() === 'BIRTHDAY' ? 'bg-blue-100 text-blue-700' :
                            event.eventType === 2 ? 'bg-blue-100 text-blue-700' :
                            typeof event.eventType === 'string' && event.eventType.toUpperCase() === 'FUNERAL' ? 'bg-gray-100 text-gray-700' :
                            event.eventType === 0 ? 'bg-gray-100 text-gray-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {typeof event.eventType === 'string' ? event.eventType : 
                             event.eventType === 0 ? 'Giỗ' :
                             event.eventType === 1 ? 'Cưới' :
                             event.eventType === 2 ? 'Sinh nhật - Mừng thọ' :
                             event.eventType === 3 ? 'Lễ' :
                             'Khác'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPage;
