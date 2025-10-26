import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DatePicker, Radio } from 'antd';
import { Search, Calendar, ChevronLeft, ChevronRight, CloudSun } from 'lucide-react';
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

// Types
import type {
  ViewMode,
  EventFilters,
  FamilyEvent,
  CalendarSelectInfo,
} from '@/types/event';


// Configure moment
moment.locale('vi');
moment.updateLocale('vi', { week: { dow: 1, doy: 1 } });

const EventPage: React.FC = () => {
  const now = new Date();

  // State Management
  const [viewMode, setViewMode] = useState<ViewMode>('month' as ViewMode);
  const [currentDate, setCurrentDate] = useState<Date>(now);
  const [reload, setReload] = useState<boolean>(false);
  const [isShowLunarDay, setIsShowLunarDay] = useState<boolean>(true);
  const [viewWeather, setViewWeather] = useState<boolean>(true);
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
    setViewMode('month' as ViewMode);
  }, []);

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
          onMoreClick={() => {}} 
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
        {/* @ts-ignore - Calendar component type conversion in progress */}
        return <MonthCalendar 
          {...commonProps} 
          onMoreClick={() => {}} 
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-5 flex-wrap lg:flex-nowrap">
          {/* Sidebar - Filters and Statistics */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow-sm sticky top-5 max-h-[calc(100vh-40px)] overflow-y-auto">
              <EventSidebar
                handleFilter={handleFilter}
                setIsShowLunarDay={setIsShowLunarDay}
                setEventSelected={setEventSelected}
                setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
              />
            </div>
          </div>

          {/* Main Content - Calendar */}
          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-lg p-5 shadow-sm max-h-[calc(100vh-60px)] overflow-hidden flex flex-col">
              {/* Header Section */}
              <div className="mb-3 flex-shrink-0">
                {/* Title */}
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                  Lịch Sự Kiện Gia Phả
                </h2>

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      <button
                        onClick={() => setViewWeather(!viewWeather)}
                        className={`p-2.5 rounded-lg transition-colors ${
                          viewWeather 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        } border`}
                        title={viewWeather ? 'Ẩn thời tiết' : 'Hiện thời tiết'}
                        aria-label="Toggle weather"
                      >
                        <CloudSun className="w-4 h-4" />
                      </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Event Info Modal */}
      {isOpenGPEventInfoModal && eventSelected && (
        <GPEventInfoModal
          isOpenModal={isOpenGPEventInfoModal}
          setIsOpenModal={setIsOpenGPEventInfoModal}
          defaultValues={eventSelected}
          setConfirmDeleteModal={() => {}}
          setConfirmDeleteAllModal={() => {}}
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
    </div>
  );
};

export default EventPage;
