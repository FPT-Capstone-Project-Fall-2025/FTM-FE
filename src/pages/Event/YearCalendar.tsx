// @ts-nocheck
import React, { useEffect, useRef } from "react";
import moment from "moment";
import "moment/locale/vi";
// import "moment-lunar"; // Temporarily disabled due to compatibility issues
import { addLunarToMoment } from "../../utils/lunarUtils";

// Add lunar stub to moment
addLunarToMoment(moment);

moment.locale("vi");

interface YearCalendarProps {
  year: number;
  setIsOpenGPEventInfoModal: (open: boolean) => void;
  isShowLunarDay?: boolean;
  setEventSelected: (event: any) => void;
}

const YearCalendar: React.FC<YearCalendarProps> = ({ 
  year,
  setIsOpenGPEventInfoModal, 
  isShowLunarDay = false,
  setEventSelected }) => {
  const gridContainerRefs = useRef<any>({});

  useEffect(() => {
    const handleResize = () => {
      const t = Object.values(gridContainerRefs.current);
      if (!t.length) return;
      const firstDiv = t[0];
      if (!firstDiv) return;
      const mainHeight = window.innerHeight - 200;
      const cw = firstDiv.offsetWidth;
      t.forEach((div) => {
        if (div) {
          div.style.height = `${cw - cw / 2.2}px`;
          div.style.minHeight = `${mainHeight / 4}px`;
          firstDiv.style.maxHeight = `${mainHeight / 2}px`;
        }
      });
    };

    window.addEventListener("resize", handleResize);

    const navbarLg = document.querySelector(".navbar-toggler-lg");
    if (navbarLg) {
      const handleToggleLgClick = () => setTimeout(handleResize, 300);
      navbarLg.addEventListener("click", handleToggleLgClick);
    }

    const navbarMd = document.querySelector(".navbar-toggler-md");
    if (navbarMd) {
      const handleToggleMdClick = () => setTimeout(handleResize, 300);
      navbarMd.addEventListener("click", handleToggleMdClick);
    }

    const sidebar = document.querySelector(".sidebar-minimizer");
    let resizeSidebarObserver;
    if (sidebar) {
      resizeSidebarObserver = new ResizeObserver(() => setTimeout(handleResize, 300));
      resizeSidebarObserver.observe(sidebar);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (navbarLg) navbarLg.removeEventListener("click", handleResize);
      if (navbarMd) navbarMd.removeEventListener("click", handleResize);
      if (resizeSidebarObserver && sidebar) resizeSidebarObserver.unobserve(sidebar);
    };
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const today = moment();
  const getLunarDay = (day, month, year) =>
    moment(`${year}-${month}-${day}`, "YYYY-MM-DD").lunar().date();

  return (
    <div className="year-event-calendar">
      <div className="year-family-event">
        <div className="calendar-container">
          {months.map((month) => {
            const firstDayOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").day();
            const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
            const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
            const totalCells = daysInMonth + startOffset;
            const endOffset = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
            const prevMonthDays = moment(`${year}-${month - 1}`, "YYYY-MM").daysInMonth();
            const nextMonth = month === 12 ? 1 : month + 1;
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const nextYear = month === 12 ? year + 1 : year;

            return (
              <div key={month} className="bg-white month-item">
                <span className="month-tile">Tháng {month}</span>
                <div className="month-container text-center grid grid-cols-7 gap-1">
                  {Array.from({ length: startOffset }).map((_, i) => {
                    const day = prevMonthDays - startOffset + i + 1;
                    return (
                      <div key={`prev-${day}`} className="text-prev-month"></div>
                    );
                  })}

                  {Array.from({ length: daysInMonth }).map((_, d) => {
                    const day = d + 1;
                    const date = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
                    const lunarDay = getLunarDay(day, month, year);
                    const isSunday = date.day() === 0;
                    const isToday = today.isSame(date, "day");

                    return (
                      <div
                        key={day}
                        className={`relative ${isToday ? "today" : ""} cursor-pointer`}
                        onClick={() => {
                          setEventSelected({
                            date: date.format("YYYY-MM-DD"),
                            day,
                            month,
                            year,
                          });
                          setIsOpenGPEventInfoModal(true);
                        }}
                      >
                        <div className={`text-gregorian ${isSunday ? "text-sunday" : ""}`}>
                          <span className="text-today">{day}</span>
                        </div>
                        <div className="text-lunar" style={{height: "20px"}}>
                          <span className="text-today-lunar">{isShowLunarDay ? lunarDay : ""}</span>
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({ length: endOffset }).map((_, i) => {
                    const day = i + 1;
                    return (
                      <div key={`next-${day}`} className="text-gray-400"></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearCalendar;
