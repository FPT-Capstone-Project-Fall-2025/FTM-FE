// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Input, DatePicker, Radio, Switch } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import 'moment/locale/vi';

// Components
import EventSidebar from './EventSidebar';
import MonthCalendar from './MonthCalendar';
import WeekCalendar from './WeekCalendar';
import DayCalendar from './DayCalendar';
import YearCalendar from './YearCalendar';
import InfiniteYearCalendar from './InfiniteYearCalendar';
import GPEventInfoModal from './GPEventInfoModal';
import GPEventDetailsModal from './GPEventDetailsModal';

// Services
// (eventService will be used when delete functionality is needed)

// Assets
import calendarTodayIcon from '@/assets/img/icon/calendar_today.svg';
import calendarMonthIcon from '@/assets/img/icon/calendar_month.svg';
import ArrowRight from '@/assets/img/icon/ArrowRight.svg';
import ArrowLeft from '@/assets/img/icon/ArrowLeft.svg';
import weatherSwitch from '@/assets/img/icon/event/weather-switch.svg';

// Types
import type {
  ViewMode,
  EventFilters,
  FamilyEvent as FamilyEventType,
  CalendarSelectInfo,
} from '@/types/event';


// Configure moment
moment.locale('vi');
moment.updateLocale('vi', { week: { dow: 1, doy: 1 } });

export default function FamilyEvent() {
  const now = new Date();

  // State Management
  const [viewMode, setViewMode] = useState<ViewMode>('month' as ViewMode);
  const [currentDate, setCurrentDate] = useState<Date>(now);
  const [reload, setReload] = useState<boolean>(false);
  const [isShowLunarDay, setIsShowLunarDay] = useState<boolean>(true);
  const [viewWeather, setViewWeather] = useState<boolean>(() => {
    const saved = localStorage.getItem('viewWeather');
    return saved ? saved === 'true' : true;
  });
  const [eventFilters, setEventFilters] = useState<EventFilters | null>(null);
  const [search, setSearch] = useState<string>('');
  const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);

  // Modal States
  const [isOpenGPEventInfoModal, setIsOpenGPEventInfoModal] = useState<boolean>(false);
  const [isOpenGPEventDetailsModal, setIsOpenGPEventDetailsModal] = useState<boolean>(false);
  const [eventSelected, setEventSelected] = useState<FamilyEventType | null>(null);

  moment.locale("vi");
  moment.updateLocale("vi", { week: { dow: 1, doy: 1 } });

  // Date Navigation Handlers
  const handleNext = useCallback(() => {
    switch (viewMode) {
      case "year":
        setCurrentDate(moment(currentDate).add(1, "year").toDate());
        break;
      case "month":
        setCurrentDate(moment(currentDate).add(1, "month").toDate());
        break;
      case "week": {
        const endOfCurrentWeek = moment(currentDate).endOf("isoWeek");
        const nextWeek = endOfCurrentWeek.add(1, "week").endOf("isoWeek");
        setCurrentDate(nextWeek.toDate());
        break;
      }
      case "day":
        setCurrentDate(moment(currentDate).add(1, "day").toDate());
        break;
      default:
        break;
    }
  }, [viewMode, currentDate]);

  const handlePrev = useCallback(() => {
    switch (viewMode) {
      case "year":
        setCurrentDate(moment(currentDate).subtract(1, "year").toDate());
        break;
      case "month":
        setCurrentDate(moment(currentDate).subtract(1, "month").toDate());
        break;
      case "week": {
        const startOfCurrentWeek = moment(currentDate).endOf("isoWeek");
        const prevWeek = startOfCurrentWeek.subtract(1, "week").endOf("isoWeek");
        setCurrentDate(prevWeek.toDate());
        break;
      }
      case "day":
        setCurrentDate(moment(currentDate).subtract(1, "day").toDate());
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

  const handleCreatedEvent = useCallback(() => {
    setReload(!reload);
  }, [reload]);

  // Search Handler with Debounce
  const handleSearch = useCallback(
    debounce((value: string) => {
      if (value) {
        setViewMode("list" as ViewMode);
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

  // Calendar Select Handler
  const handleSelect = useCallback(
    (selectInfo: CalendarSelectInfo) => {
      const { start, end } = selectInfo;

      // Subtract 1 day from endTime for multi-day events
      const adjustedEndTime = dayjs(end).subtract(1, 'day');

      const newEvent: Partial<FamilyEventType> = {
        startTime: start,
        endTime: viewMode !== "day" ? adjustedEndTime.toDate() : end,
        isAllDay: viewMode !== "day",
      };

      setEventSelected(newEvent as FamilyEventType);
      setIsOpenGPEventDetailsModal(true);

      console.log("Selected selectInfo:", selectInfo);
      console.log("Selected event:", newEvent);
    },
    [viewMode]
  );

  // Handle weather toggle
  // Handle weather toggle
  const handleWeatherToggle = useCallback((checked: boolean) => {
    setViewWeather(checked);
    localStorage.setItem('viewWeather', checked.toString());
  }, []);

  // Get date display text
  const getDateDisplayText = () => {
    switch (viewMode) {
      case "month":
        return `Tháng ${currentDate.getMonth() + 1} năm ${currentDate.getFullYear()}`;
      case "week":
        return `Tuần ${moment(currentDate).isoWeek()} năm ${currentDate.getFullYear()}`;
      case "day":
        return moment(currentDate).format("DD/MM/YYYY");
      case "year":
        return currentDate.getFullYear().toString();
      default:
        return moment(currentDate).format("MMMM YYYY");
    }
  };

  return (
    <Row className="family-event-container">
      <Col xs={10} md={6} className="d-flex flex-column align-items-center">
        <EventSidebar
          handleFilter={handleFilter}
          handleCreatedEvent={handleCreatedEvent}
          setIsShowLunarDay={setIsShowLunarDay}
          setEventSelected={setEventSelected}
          setIsOpenGPEventDetailsModal={setIsOpenGPEventDetailsModal}
        />
      </Col>

      <Col xs={14} md={18}>
        {/* Search Section */}
        <div className="mb-2">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            value={search}
            onChange={handleSearchChange}
            className="event-search"
            allowClear
          />
        </div>

        {/* Calendar Header */}
        <div className="calendar-header d-flex justify-content-between mb-1">
          <div className="calendar-navigation d-flex align-items-center">
            <span className="text-year-title" onClick={() => setOpenDatePicker(!openDatePicker)}>
              {getDateDisplayText()}
            </span>
            {viewMode !== "list" && (
              <>
                <div className="custom-datepicker" style={{ position: "relative" }}>
                  <DatePicker
                    open={openDatePicker}
                    value={dayjs(currentDate)}
                    onOpenChange={(status) => setOpenDatePicker(status)}
                    showTime={false}
                    picker={viewMode === "year" ? "year" : viewMode === "month" ? "month" : "date"}
                    onChange={handleSelectedDate}
                  />
                </div>
                <button className="btn me-2" onClick={handlePrev}>
                  <img className="px-1" src={ArrowLeft} alt="Previous" />
                </button>
                <button className="btn ms-2" onClick={handleNext}>
                  <img className="px-1" src={ArrowRight} alt="Next" />
                </button>
              </>
            )}
          </div>

          <div className="calendar-actions d-flex align-items-center">
            <Radio.Group
              className="calendar-event-radio-group"
              value={viewMode}
              buttonStyle="solid"
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <Radio.Button value="year">Năm</Radio.Button>
              <Radio.Button value="month">Tháng</Radio.Button>
              <Radio.Button value="week">Tuần</Radio.Button>
              <Radio.Button value="day">Ngày</Radio.Button>
              <Radio.Button value="list">Danh sách</Radio.Button>
            </Radio.Group>
            <button
              type="button"
              className="action-btn btn btn-light ms-2"
              onClick={handleToday}
            >
              <img className="px-1" src={calendarTodayIcon} alt="Today" />
              <span>Hôm nay</span>
            </button>
            <Link to="/admin/events/event" style={{ textDecoration: "none" }}>
              <button type="button" className="action-btn mx-2 btn btn-light">
                <img className="px-1" src={calendarMonthIcon} alt="Culture Calendar" />
                <span> Xem lịch văn hóa</span>
              </button>
            </Link>
          </div>

          {/* Weather Switch */}
          {(viewMode === "month" || viewMode === "week" || viewMode === "day") && (
            <div className="weather-switch">
              <Switch
                checkedChildren={<img src={weatherSwitch} height={30} alt="weather" />}
                unCheckedChildren={<img src={weatherSwitch} height={30} alt="weather" />}
                checked={viewWeather}
                onChange={handleWeatherToggle}
              />
            </div>
          )}
        </div>

        {/* Calendar Content */}
        {viewMode === "year" && (
          <div>
            <YearCalendar
              year={currentDate.getFullYear()}
              setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
              setEventSelected={setEventSelected}
              isShowLunarDay={isShowLunarDay}
            />
          </div>
        )}

        {viewMode !== "year" && (
          <div className="calendar-content">
            {viewMode === "month" && eventFilters && (
            
              <MonthCalendar
                year={currentDate.getFullYear()}
                month={currentDate.getMonth() + 1}
                eventFilters={eventFilters}
                isShowLunarDay={isShowLunarDay}
                reload={reload}
                setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
                setEventSelected={setEventSelected}
                viewWeather={viewWeather}
                handleSelect={handleSelect}
              />
            )}
            {viewMode === "week" && eventFilters && (
            
              <WeekCalendar
                year={currentDate.getFullYear()}
                month={currentDate.getMonth() + 1}
                week={moment(currentDate).isoWeek()}
                eventFilters={eventFilters}
                isShowLunarDay={isShowLunarDay}
                reload={reload}
                setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
                setEventSelected={setEventSelected}
                viewWeather={viewWeather}
                handleSelect={handleSelect}
              />
            )}
            {viewMode === "day" && eventFilters && (
            
              <DayCalendar
                date={currentDate}
                eventFilters={eventFilters}
                isShowLunarDay={isShowLunarDay}
                reload={reload}
                setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
                setEventSelected={setEventSelected}
                viewWeather={viewWeather}
                handleSelect={handleSelect}
              />
            )}
            {viewMode === "list" && eventFilters && (
            
              <InfiniteYearCalendar
                eventFilters={eventFilters}
                reload={reload}
                setIsOpenGPEventInfoModal={setIsOpenGPEventInfoModal}
                setEventSelected={setEventSelected}
                isShowLunarDay={isShowLunarDay}
              />
            )}

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
                handleCreatedEvent={handleCreatedEvent}
                eventSelected={eventSelected}
                defaultValues={eventSelected}
              />
            )}
          </div>
        )}
      </Col>
    </Row>
  );
}
