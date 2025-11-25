import React, { useMemo } from "react";
import moment from "moment";
import "moment/locale/vi";
import { addLunarToMoment } from "../../utils/lunarUtils";
import type { FamilyEvent } from "../../types/event";
import './Calendar.css';

// Add lunar stub to moment
addLunarToMoment(moment);

moment.locale("vi");

interface YearCalendarProps {
  year: number;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  isShowLunarDay?: boolean;
  setEventSelected: (event: Partial<FamilyEvent>) => void;
}

const YearCalendar: React.FC<YearCalendarProps> = ({ 
  year,
  setIsOpenGPEventInfoModal, 
  isShowLunarDay = false,
  setEventSelected 
}) => {
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const today = useMemo(() => moment(), []);
  
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const getLunarDay = (day: number, month: number, year: number): number => {
    try {
      return (moment(`${year}-${month}-${day}`, "YYYY-MM-DD") as any).lunar().date();
    } catch {
      return 0;
    }
  };

  const handleDayClick = (date: moment.Moment) => {
    // Only allow clicking on future dates
    if (date.isBefore(moment(), 'day')) {
      return;
    }
    
    setEventSelected({
      startTime: date.toDate(),
      endTime: date.toDate(),
      isAllDay: true,
    } as Partial<FamilyEvent>);
    setIsOpenGPEventInfoModal(true);
  };

  return (
    <div className="w-full p-2 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 max-h-[calc(100vh-250px)] overflow-y-auto p-2">
        {months.map((month) => {
          const firstDayOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").isoWeekday();
          const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
          const startOffset = firstDayOfMonth - 1;

          return (
            <div 
              key={month} 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Month Header */}
              <div className="text-center text-lg font-semibold text-gray-900 mb-3 pb-3 border-b-2 border-gray-100">
                Tháng {month}
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, idx) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-semibold py-1 ${idx === 6 ? 'text-red-500' : 'text-gray-600'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, d) => {
                  const day = d + 1;
                  const date = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
                  const lunarDay = getLunarDay(day, month, year);
                  const isSunday = date.isoWeekday() === 7;
                  const isToday = today.isSame(date, "day");
                  const isPast = date.isBefore(moment(), 'day');

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(date)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 relative p-1 ${
                        isPast
                          ? 'bg-gray-100 cursor-not-allowed opacity-50'
                          : isToday 
                            ? 'bg-blue-500 border-2 border-blue-500 cursor-pointer' 
                            : 'bg-transparent border border-transparent hover:bg-blue-50 hover:border-blue-200 cursor-pointer'
                      }`}
                    >
                      <div className={`text-sm mb-0.5 ${
                        isPast
                          ? 'font-medium text-gray-400'
                          : isToday 
                            ? 'font-bold text-white' 
                            : isSunday 
                              ? 'font-medium text-red-500' 
                              : 'font-medium text-gray-900'
                      }`}>
                        {day}
                      </div>
                      {isShowLunarDay && lunarDay > 0 && (
                        <div className={`text-[0.625rem] ${
                          isPast
                            ? 'text-gray-300'
                            : isToday 
                              ? 'text-white/85' 
                              : 'text-gray-400'
                        }`}>
                          {lunarDay}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearCalendar;
