// Type definitions for lunar-javascript package
declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getDay(): number;
    getMonth(): number;
    getYear(): number;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getYearInChinese(): string;
  }
}

