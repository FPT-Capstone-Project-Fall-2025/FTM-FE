import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Row, Col, Input, DatePicker, Radio, Button } from 'antd';
import { SearchOutlined, CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import moment from 'moment';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import 'moment/locale/vi';
import './Calendar.css';

// Components
import EventSidebar from './EventSidebar';
import YearCalendar from './YearCalendar';
import MonthCalendar from './MonthCalendar';
import WeekCalendar from './WeekCalendar';
import DayCalendar from './DayCalendar';
import InfiniteYearCalendar from './InfiniteYearCalendar';
import GPEventInfoModal from './GPEventInfoModal';
import GPEventDetailsModal from './GPEventDetailsModal';


// Assets
import weatherSwitch from '@/assets/img/icon/event/weather-switch.svg';

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
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <Row gutter={[20, 20]}>
          {/* Sidebar - Filters and Statistics */}
          <Col xs={24} md={8} lg={6}>
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              padding: '0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: '20px',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto'
            }}>
              <EventSidebar
                handleFilter={handleFilter}
                setIsShowLunarDay={setIsShowLunarDay}
                setEventSelected={setEventSelected}
                setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
              />
            </div>
          </Col>

          {/* Main Content - Calendar */}
          <Col xs={24} md={16} lg={18}>
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}>
              {/* Header Section */}
              <div style={{ marginBottom: '20px' }}>
                {/* Title */}
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  margin: '0 0 16px 0',
                  color: '#1a1a1a'
                }}>
                  Lịch Sự Kiện Gia Phả
                </h2>

                {/* Search Bar */}
                <Input
                  prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                  placeholder="Tìm kiếm sự kiện..."
                  value={search}
                  onChange={handleSearchChange}
                  size="large"
                  allowClear
                  onClear={handleClearSearch}
                  style={{ 
                    marginBottom: '16px',
                    borderRadius: '8px'
                  }}
                />

                {/* Calendar Controls */}
                <div style={{ 
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* Navigation Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          icon={<LeftOutlined />}
                          onClick={handlePrev}
                          style={{ borderRadius: '6px' }}
                        />
                        <Button
                          onClick={handleToday}
                          style={{ 
                            borderRadius: '6px',
                            color: '#1677ff',
                            borderColor: '#1677ff'
                          }}
                        >
                          Hôm nay
                        </Button>
                        <Button
                          icon={<RightOutlined />}
                          onClick={handleNext}
                          style={{ borderRadius: '6px' }}
                        />
                      </div>

                      {/* Date Display with Picker */}
                      <Button
                        icon={<CalendarOutlined />}
                        onClick={() => setOpenDatePicker(!openDatePicker)}
                        style={{ 
                          borderRadius: '8px',
                          fontWeight: 500
                        }}
                      >
                        {getDateDisplayText}
                      </Button>
                      {openDatePicker && (
                        <div style={{ position: 'absolute', zIndex: 1000 }}>
                          <DatePicker
                            open={openDatePicker}
                            value={dayjs(currentDate)}
                            onChange={handleSelectedDate}
                            onOpenChange={setOpenDatePicker}
                            getPopupContainer={(trigger: any) => trigger.parentElement || document.body}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* View Mode Selector */}
                      <Radio.Group
                        value={viewMode}
                        onChange={(e: any) => setViewMode(e.target.value as ViewMode)}
                        buttonStyle="solid"
                        size="middle"
                      >
                        <Radio.Button value="day" style={{ borderRadius: '6px 0 0 6px' }}>
                          Ngày
                        </Radio.Button>
                        <Radio.Button value="week">Tuần</Radio.Button>
                        <Radio.Button value="month">Tháng</Radio.Button>
                        <Radio.Button value="year" style={{ borderRadius: '0 6px 6px 0' }}>
                          Năm
                        </Radio.Button>
                      </Radio.Group>

                      {/* Weather Toggle */}
                      <Button
                        onClick={() => setViewWeather(!viewWeather)}
                        style={{ 
                          borderRadius: '8px',
                          background: viewWeather ? '#1677ff' : 'white',
                          color: viewWeather ? 'white' : '#595959',
                          borderColor: viewWeather ? '#1677ff' : '#d9d9d9'
                        }}
                        title={viewWeather ? 'Ẩn thời tiết' : 'Hiện thời tiết'}
                      >
                        <img 
                          src={weatherSwitch} 
                          alt="Weather" 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            filter: viewWeather ? 'brightness(0) invert(1)' : 'none'
                          }} 
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar View Content */}
              <div style={{ 
                marginTop: '24px', 
                minHeight: '500px',
                overflowX: 'auto',
                overflowY: 'visible'
              }}>
                {initialLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '80px 20px',
                    minHeight: '500px'
                  }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px',
                    minHeight: '500px'
                  }}>
                    <p style={{ color: '#ff4d4f', marginBottom: '20px' }}>{error}</p>
                    <Button 
                      type="primary"
                      onClick={() => setReload(!reload)}
                      style={{ borderRadius: '6px' }}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '0',
                    width: '100%'
                  }}>
                    {renderCalendar()}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
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
          defaultValues={eventSelected}
          handleCreatedEvent={handleCreatedEvent}
        />
      )}
    </div>
  );
};

export default EventPage;
