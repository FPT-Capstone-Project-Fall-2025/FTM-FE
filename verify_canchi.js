
const { solarToLunar } = require('./src/pages/Event/utils/convertSolar2Lunar.ts');

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function getCanChi(dd, mm, yy) {
    const lunar = solarToLunar(dd, mm, yy);
    console.log(`Lunar Date: ${lunar.day}/${lunar.month}/${lunar.year}`);

    // Year Can Chi
    const canNam = (lunar.year + 6) % 10;
    const chiNam = (lunar.year + 8) % 12;

    // Month Can Chi
    // Can thang = (Can nam * 2 + thang am) % 10
    const canThang = (canNam * 2 + lunar.month) % 10;
    const chiThang = (lunar.month + 1) % 12; // Thang 1 la Dan (2) -> (1+1)=2. 

    // Day Can Chi
    // JD calculation from the file
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    const jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

    const canNgay = (jd + 9) % 10;
    const chiNgay = (jd + 1) % 12;

    return {
        ngay: `${CAN[canNgay]} ${CHI[chiNgay]}`,
        thang: `${CAN[canThang]} ${CHI[chiThang]}`,
        nam: `${CAN[canNam]} ${CHI[chiNam]}`
    };
}

console.log(getCanChi(24, 11, 2025));
