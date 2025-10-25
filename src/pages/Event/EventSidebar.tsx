import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Checkbox, Input } from "antd";
import { useAppSelector } from '../../hooks/redux';
import { getUserIdFromToken, getFullNameFromToken } from '@/utils/jwtUtils';
import { PlusOutlined, CloseOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useCombobox } from "downshift";
import { EVENT_TYPE_CONFIG, EVENT_TYPE } from "./EventTypeLabel";
import type { EventType } from "./EventTypeLabel";
import EventStatistics from "./EventStatistics";

/**
 * EventSidebar Component
 * 
 * Purpose: Left sidebar for Event page with filters and statistics
 * - Create new event button
 * - Event type filters (Ma chay, Cuoi hoi, Sinh nhat, Ngay)
 * - Family group filters
 * - Location filter
 * - Lunar calendar toggle
 * - Event statistics
 * 
 * Props:
 * - handleFilter: Function to update event filters
 * - setIsShowLunarDay: Toggle lunar calendar display
 * - setIsOpenGPEventDetailsModal: Open event creation modal
 * - setEventSelected: Set selected event
 */

interface EventSidebarProps {
  handleFilter: (filters: any) => void;
  setIsShowLunarDay: (value: boolean) => void;
  setIsOpenGPEventDetailsModal: (value: boolean) => void;
  setEventSelected: (value: any) => void;
}

interface GPItem {
  label: string;
  value: string;
}

interface CityItem {
  name: string;
  code: string;
  // lat/lon may not be available from provinces API; they are optional
  lat?: number;
  lon?: number;
}

// Mock data for demonstration
const MOCK_FAMILY_GROUPS = [
  { label: 'Gia phả họ Nguyễn', value: 'nguyen-family' },
  { label: 'Gia phả họ Trần', value: 'tran-family' },
  { label: 'Gia phả họ Lê', value: 'le-family' },
];

const MOCK_CITIES = [
  { name: 'Hồ Chí Minh', code: 'hcm', lat: 10.8231, lon: 106.6297 },
  { name: 'Hà Nội', code: 'hn', lat: 21.0285, lon: 105.8542 },
  { name: 'Đà Nẵng', code: 'dn', lat: 16.0544, lon: 108.2022 },
];

const { user, token, isAuthenticated } = useAppSelector(state => state.auth);
const EventSidebar: React.FC<EventSidebarProps> = ({ 
  handleFilter, 
  setIsShowLunarDay, 
  setIsOpenGPEventDetailsModal, 
  setEventSelected 
}) => {
  // State management
  const [eventTypes, setEventTypes] = useState<EventType[]>([...Object.values(EVENT_TYPE)]);
  const [eventGroups, setEventGroups] = useState<string[]>([]);
  const [showLunar, setShowLunar] = useState<boolean>(true);
  const [eventLocation, setEventLocation] = useState<string>("");
  const [openSections, setOpenSections] = useState({
    eventType: true,
    familyGroups: true,
  });
  const [listCity, setListCity] = useState<CityItem[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [eventGp, setEventGp] = useState<GPItem[]>([]);
  // Weather state
  const [weather, setWeather] = useState<{
    temp: number;
    icon: string;
    description: string;
    cityName?: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Toggle checkbox selection
  const toggleCheckbox = <T,>(list: T[], setList: (value: T[]) => void, value: T) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  // Toggle section open/close
  const toggleSection = (section: 'eventType' | 'familyGroups') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    handleFilter({eventType: eventTypes, eventGp: eventGroups, eventLocation: eventLocation});
  }, [eventTypes, eventGroups, eventLocation]);
  
  useEffect(() => {
  const fetchData = async () => {
    try {
      // --- 1️⃣ Lấy token chính xác ---
      let validToken: string | null = null;

      try {
        // Ưu tiên token từ redux
        validToken = token;
        if (!validToken) {
          const persisted = localStorage.getItem('persist:root');
          if (persisted) {
            const parsed = JSON.parse(persisted);
            const authState = parsed?.auth ? JSON.parse(parsed.auth) : null;
            validToken = authState?.token || null;
          }
        }
        if (!validToken) {
          validToken =
            localStorage.getItem('access_token') ||
            localStorage.getItem('auth_token') ||
            localStorage.getItem('token') ||
            null;
        }
      } catch (e) {
        console.error("Error parsing token from localStorage:", e);
      }

      if (!validToken) {
        console.warn("⚠️ Không tìm thấy token hợp lệ, bỏ qua fetch provinces");
        return;
      }

      // --- 2️⃣ Fetch provinces ---
      const provincesApiUrl = "https://be.dev.familytree.io.vn/api/account/provinces";
      const headers: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Bearer ${validToken}`,
      };

      const res = await fetch(provincesApiUrl, { headers });

      // --- 3️⃣ Nếu 401 thì clear token hoặc refresh ---
      if (res.status === 401) {
        console.warn("❌ Token hết hạn hoặc không hợp lệ, xóa localStorage và yêu cầu đăng nhập lại.");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_token");
        return;
      }

      if (!res.ok) {
        console.warn("Failed to fetch provinces:", res.status);
        return;
      }

      const json = await res.json();
      const provinces = Array.isArray(json.data) ? json.data : [];

      const listCityMapped: CityItem[] = provinces.map((p: any) => ({
        name: p.nameWithType || p.name,
        code: p.code || p.slug || p.id,
      }));

      const fallback = [
        { name: "Hồ Chí Minh", code: "hcm", lat: 10.8231, lon: 106.6297 },
        { name: "Hà Nội", code: "hn", lat: 21.0285, lon: 105.8542 },
        { name: "Đà Nẵng", code: "dn", lat: 16.0544, lon: 108.2022 },
      ];

      setListCity(listCityMapped.length > 0 ? listCityMapped : fallback);
      setInputValue("");
      setEventLocation("");
    } catch (error) {
      console.error("Error preparing sidebar data:", error);
    }
  };

  fetchData();
  setIsShowLunarDay(showLunar);
}, []);


  const locationFilteredItems = listCity.filter((item) =>
    item.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const {
    isOpen,
    getInputProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: locationFilteredItems,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || "")
      if (!inputValue) setEventLocation("");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const found = listCity.find(x => x.code === selectedItem.code);
        setEventLocation(found || "");
        if (found) {
          // fetch weather for selected city
          fetchWeatherForCity(found);
        }
      }
    },
    itemToString: (item) => (item ? item.name : ""),
  });

  // Fetch weather using OpenWeatherMap current weather API by lat/lon
  const fetchWeatherForCity = async (city: CityItem) => {
    setWeather(null);
    setWeatherError(null);
    setWeatherLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) {
        setWeatherError('Missing weather API key');
        setWeatherLoading(false);
        return;
      }
      // If lat/lon not provided, use OpenWeatherMap geocoding API to get coordinates by name
      let lat = city.lat;
      let lon = city.lon;
      if ((typeof lat !== 'number' || typeof lon !== 'number') && city.name) {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city.name + ',VN')}&limit=1&appid=${apiKey}`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (Array.isArray(geoData) && geoData.length > 0) {
            lat = geoData[0].lat;
            lon = geoData[0].lon;
          }
        }
      }

      if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('Không thể xác định tọa độ cho địa điểm này');
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=vi`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather fetch failed: ${res.status}`);
      }
      const data = await res.json();
      const icon = data.weather?.[0]?.icon;
      const description = data.weather?.[0]?.description || '';
      const temp = typeof data.main?.temp === 'number' ? data.main.temp : NaN;

      setWeather({ temp, icon: icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '', description, cityName: data.name });
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setWeatherError(err?.message || 'Lỗi khi lấy thời tiết');
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="w-full p-5 bg-white rounded-lg">
      {/* Create Event Button */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        block
        size="large"
        onClick={() => {
          console.log('Create Event button clicked');
          setEventSelected(null);
          setIsOpenGPEventDetailsModal(true);
          console.log('Modal should open now');
        }}
        className="!bg-blue-500 !rounded-lg !h-12 !text-[15px] !font-medium mb-5 flex items-center justify-center hover:!bg-blue-600"
      >
        Thêm sự kiện mới
      </Button>

      {/* Event Type Section */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection("eventType")}
          className="flex justify-between items-center py-2 cursor-pointer font-medium text-sm border-b border-gray-100"
        >
          <span>Loại sự kiện {openSections.eventType ? '∧' : '∨'}</span>
        </div>
        {openSections.eventType && (
          <div className="py-4">
            {Object.values(EVENT_TYPE).map((type) => (
              <div key={type} className="mb-2.5">
                <Checkbox
                  checked={eventTypes.includes(type)}
                  onChange={() => toggleCheckbox(eventTypes, setEventTypes, type)}
                  className="w-full"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={EVENT_TYPE_CONFIG[type].icon} 
                      alt={EVENT_TYPE_CONFIG[type].label}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">
                      {EVENT_TYPE_CONFIG[type].label}
                    </span>
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Groups Section */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection("familyGroups")}
          className="flex justify-between items-center py-2 cursor-pointer font-medium text-sm border-b border-gray-100"
        >
          <span>Sự kiện gia phả {openSections.familyGroups ? '∧' : '∨'}</span>
        </div>
        {openSections.familyGroups && (
          <div className="py-4 max-h-[150px] overflow-y-auto">
            {eventGp.length === 0 ? (
              <div className="text-sm text-gray-400 italic py-2">
                Không có gia phả nào
              </div>
            ) : (
              eventGp.map((group) => (
                <div key={group.value} className="mb-2  .5">
                  <Checkbox
                    checked={eventGroups.includes(group.value)}
                    onChange={() => toggleCheckbox(eventGroups, setEventGroups, group.value)}
                    className="w-full"
                  >
                    <span className="text-sm">{group.label}</span>
                  </Checkbox>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lunar Calendar Toggle */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <Checkbox
          checked={showLunar}
          onChange={(e) => {
            setIsShowLunarDay(e.target.checked);
            setShowLunar(e.target.checked);
          }}
          className="w-full"
        >
          <span className="text-sm">Hiển thị lịch âm</span>
        </Checkbox>
      </div>

      {/* Location Filter */}
      <div className="mb-5">
        <div className="text-sm font-medium mb-3 pb-2 border-b border-gray-100">
          Xem thời tiết theo vị trí địa lí
        </div>
          <div className="mb-2">
            {weatherLoading ? (
              <div className="text-sm text-gray-500">Đang tải thời tiết...</div>
            ) : weatherError ? (
              <div className="text-sm text-red-500">{weatherError}</div>
            ) : weather ? (
              <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                {weather.icon ? (
                  <img src={weather.icon} alt="icon" className="w-8 h-8" />
                ) : (
                  <EnvironmentOutlined className="text-blue-500 text-lg" />
                )}
                <div className="text-sm">
                  <div className="font-medium">{weather.cityName || ''}</div>
                  <div className="text-xs text-gray-500">{Math.round(weather.temp)}°C • {weather.description}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Chọn địa điểm để xem thời tiết</div>
            )}
          </div>
        <div className="relative">
          <Input
            {...getInputProps()}
            value={inputValue}
            placeholder="Nhập địa điểm..."
            prefix={<EnvironmentOutlined className="text-gray-400" />}
            suffix={
              inputValue ? (
                <CloseOutlined 
                  onClick={() => { 
                    setInputValue(""); 
                    setEventLocation("") 
                  }}
                  className="cursor-pointer text-gray-400 hover:text-gray-600"
                />
              ) : null
            }
            className="!rounded-lg"
          />
          {inputValue && isOpen && locationFilteredItems.length > 0 && (
            <ul 
              {...getMenuProps()}
              className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-[200px] overflow-y-auto list-none p-1 z-[1000] shadow-md"
            >
              {locationFilteredItems.map((item, index) => (
                <li
                  key={item.code}
                  {...getItemProps({ item, index })}
                  className={`px-3 py-2 cursor-pointer text-sm rounded transition-colors ${
                    highlightedIndex === index ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mt-6">
        <EventStatistics />
      </div>
    </div>
  );
};

export default EventSidebar;