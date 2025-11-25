/**
 * Vietnamese Holidays and Special Days
 * Danh sách các ngày lễ và ngày đặc biệt của Việt Nam
 */

export interface VietnameseHoliday {
  id: string;
  name: string;
  date: string; // Format: MM-DD for solar, or use lunar flag
  isLunar: boolean;
  lunarDate?: string; // Format: MM-DD (for lunar calendar)
  description: string;
  type: 'national' | 'traditional' | 'international' | 'religious';
  color: string;
  isRecurring: boolean;
}

/**
 * Solar Calendar Holidays (Dương lịch)
 */
export const solarHolidays: VietnameseHoliday[] = [
  // January
  {
    id: 'new-year',
    name: 'Tết Dương Lịch',
    date: '01-01',
    isLunar: false,
    description: 'Năm mới Dương lịch',
    type: 'international',
    color: '#EF4444', // Red
    isRecurring: true,
  },
  
  // February
  {
    id: 'valentines',
    name: 'Ngày Lễ Tình Nhân',
    date: '02-14',
    isLunar: false,
    description: 'Valentine\'s Day',
    type: 'international',
    color: '#EC4899', // Pink
    isRecurring: true,
  },
  
  // March
  {
    id: 'womens-day',
    name: 'Ngày Quốc Tế Phụ Nữ',
    date: '03-08',
    isLunar: false,
    description: 'International Women\'s Day',
    type: 'international',
    color: '#F59E0B', // Amber
    isRecurring: true,
  },
  {
    id: 'hung-kings',
    name: 'Giỗ Tổ Hùng Vương',
    date: '03-10', // Lunar
    isLunar: true,
    lunarDate: '03-10',
    description: 'Ngày giỗ tổ Hùng Vương (10/3 Âm lịch)',
    type: 'traditional',
    color: '#8B5CF6', // Purple
    isRecurring: true,
  },
  
  // April
  {
    id: 'liberation-day',
    name: 'Ngày Giải Phóng Miền Nam',
    date: '04-30',
    isLunar: false,
    description: 'Ngày thống nhất đất nước',
    type: 'national',
    color: '#DC2626', // Red
    isRecurring: true,
  },
  
  // May
  {
    id: 'labor-day',
    name: 'Ngày Quốc Tế Lao Động',
    date: '05-01',
    isLunar: false,
    description: 'International Labor Day',
    type: 'international',
    color: '#DC2626', // Red
    isRecurring: true,
  },
  
  // June
  {
    id: 'childrens-day',
    name: 'Ngày Quốc Tế Thiếu Nhi',
    date: '06-01',
    isLunar: false,
    description: 'International Children\'s Day',
    type: 'international',
    color: '#3B82F6', // Blue
    isRecurring: true,
  },
  
  // September
  {
    id: 'national-day',
    name: 'Ngày Quốc Khánh',
    date: '09-02',
    isLunar: false,
    description: 'Ngày Quốc khánh Việt Nam',
    type: 'national',
    color: '#DC2626', // Red
    isRecurring: true,
  },
  
  // October
  {
    id: 'vietnamese-womens-day',
    name: 'Ngày Phụ Nữ Việt Nam',
    date: '10-20',
    isLunar: false,
    description: 'Ngày Phụ nữ Việt Nam 20/10',
    type: 'national',
    color: '#F59E0B', // Amber
    isRecurring: true,
  },
  {
    id: 'halloween',
    name: 'Halloween',
    date: '10-31',
    isLunar: false,
    description: 'Lễ hội Halloween',
    type: 'international',
    color: '#F97316', // Orange
    isRecurring: true,
  },
  
  // November
  {
    id: 'teachers-day',
    name: 'Ngày Nhà Giáo Việt Nam',
    date: '11-20',
    isLunar: false,
    description: 'Ngày Nhà giáo Việt Nam 20/11',
    type: 'national',
    color: '#3B82F6', // Blue
    isRecurring: true,
  },
  
  // December
  {
    id: 'christmas',
    name: 'Giáng Sinh',
    date: '12-25',
    isLunar: false,
    description: 'Lễ Giáng Sinh',
    type: 'religious',
    color: '#DC2626', // Red
    isRecurring: true,
  },
];

/**
 * Lunar Calendar Holidays (Âm lịch)
 */
export const lunarHolidays: VietnameseHoliday[] = [
  {
    id: 'tet-nguyen-tieu',
    name: 'Tết Nguyên Tiêu',
    date: '01-15',
    isLunar: true,
    lunarDate: '01-15',
    description: 'Rằm tháng Giêng',
    type: 'traditional',
    color: '#F59E0B', // Amber
    isRecurring: true,
  },
  {
    id: 'cold-food-festival',
    name: 'Tết Hàn Thực',
    date: '03-03',
    isLunar: true,
    lunarDate: '03-03',
    description: 'Tết Hàn Thực (3/3 Âm lịch)',
    type: 'traditional',
    color: '#10B981', // Green
    isRecurring: true,
  },
  {
    id: 'mid-autumn',
    name: 'Tết Trung Thu',
    date: '08-15',
    isLunar: true,
    lunarDate: '08-15',
    description: 'Tết Trung Thu - Rằm tháng 8',
    type: 'traditional',
    color: '#F59E0B', // Amber
    isRecurring: true,
  },
  {
    id: 'vu-lan',
    name: 'Lễ Vu Lan',
    date: '07-15',
    isLunar: true,
    lunarDate: '07-15',
    description: 'Lễ Vu Lan - Rằm tháng 7',
    type: 'religious',
    color: '#8B5CF6', // Purple
    isRecurring: true,
  },
  {
    id: 'double-nine',
    name: 'Tết Trùng Cửu',
    date: '09-09',
    isLunar: true,
    lunarDate: '09-09',
    description: 'Tết Trùng Cửu (9/9 Âm lịch)',
    type: 'traditional',
    color: '#6366F1', // Indigo
    isRecurring: true,
  },
  {
    id: 'kitchen-god',
    name: 'Ông Táo Chầu Trời',
    date: '12-23',
    isLunar: true,
    lunarDate: '12-23',
    description: 'Ông Táo về trời (23/12 Âm lịch)',
    type: 'traditional',
    color: '#DC2626', // Red
    isRecurring: true,
  },
];

/**
 * Get all Vietnamese holidays
 */
export const getAllVietnameseHolidays = (): VietnameseHoliday[] => {
  return [...solarHolidays, ...lunarHolidays];
};

/**
 * Get holidays for a specific month (solar calendar)
 */
export const getHolidaysForMonth = (month: number): VietnameseHoliday[] => {
  return solarHolidays.filter(holiday => {
    const parts = holiday.date.split('-');
    const holidayMonth = parseInt(parts[0] || '0', 10);
    return holidayMonth === month;
  });
};

/**
 * Get holiday for a specific date
 */
export const getHolidayForDate = (date: Date): VietnameseHoliday | null => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;
  
  const holiday = solarHolidays.find(h => h.date === dateStr);
  return holiday || null;
};

/**
 * Check if a date is a holiday
 */
export const isHoliday = (date: Date): boolean => {
  return getHolidayForDate(date) !== null;
};

/**
 * Get holiday type color
 */
export const getHolidayTypeColor = (type: VietnameseHoliday['type']): string => {
  const colors = {
    national: '#DC2626',      // Red - Ngày lễ quốc gia
    traditional: '#F59E0B',   // Amber - Tết truyền thống
    international: '#3B82F6', // Blue - Ngày lễ quốc tế
    religious: '#8B5CF6',     // Purple - Lễ tôn giáo
  };
  return colors[type];
};

/**
 * Get holidays for a year (convert lunar to solar for display)
 */
export const getHolidaysForYear = (year: number): Array<VietnameseHoliday & { solarDate: Date }> => {
  const holidays: Array<VietnameseHoliday & { solarDate: Date }> = [];
  
  // Add solar holidays
  solarHolidays.forEach(holiday => {
    const parts = holiday.date.split('-').map(Number);
    const month = parts[0] ?? 1;
    const day = parts[1] ?? 1;
    const solarDate = new Date(year, month - 1, day);
    holidays.push({ ...holiday, solarDate });
  });
  
  // Add lunar holidays (need lunar-solar conversion)
  // For now, we'll add them with approximate dates
  // In production, use lunar-solar conversion library
  lunarHolidays.forEach(holiday => {
    if (holiday.lunarDate) {
      const parts = holiday.lunarDate.split('-').map(Number);
      const month = parts[0] ?? 1;
      const day = parts[1] ?? 1;
      // Approximate: add 30 days offset for lunar calendar
      // TODO: Use proper lunar-solar conversion
      const approximateDate = new Date(year, month - 1, day);
      holidays.push({ ...holiday, solarDate: approximateDate });
    }
  });
  
  return holidays.sort((a, b) => a.solarDate.getTime() - b.solarDate.getTime());
};

/**
 * Format holiday for calendar display
 */
export const formatHolidayForCalendar = (holiday: VietnameseHoliday & { solarDate?: Date }, year: number) => {
  let date: Date;
  
  if (holiday.solarDate) {
    date = holiday.solarDate;
  } else {
    const parts = holiday.date.split('-').map(Number);
    const month = parts[0] ?? 1;
    const day = parts[1] ?? 1;
    date = new Date(year, month - 1, day);
  }
  
  return {
    id: `holiday-${holiday.id}-${year}`,
    title: holiday.name,
    start: date,
    end: date,
    allDay: true,
    backgroundColor: holiday.color,
    borderColor: holiday.color,
    textColor: '#FFFFFF',
    extendedProps: {
      isHoliday: true,
      holidayType: holiday.type,
      description: holiday.description,
      isLunar: holiday.isLunar,
    },
    classNames: ['holiday-event'],
  };
};

