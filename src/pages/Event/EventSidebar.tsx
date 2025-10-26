import React, { useState, useEffect } from 'react';
import { Checkbox } from "antd";
import { Plus, MapPin, ChevronDown } from "lucide-react";
import { useCombobox } from "downshift";
import { EVENT_TYPE_CONFIG, EVENT_TYPE } from "./EventTypeLabel";
import type { EventType } from "./EventTypeLabel";
import EventStatistics from "./EventStatistics";
import api from "../../services/apiService";

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
  lat?: number;
  lon?: number;
}

// Mock data (optional fallback)
const MOCK_CITIES = [
  { name: 'Hồ Chí Minh', code: 'hcm', lat: 10.8231, lon: 106.6297 },
  { name: 'Hà Nội', code: 'hn', lat: 21.0285, lon: 105.8542 },
  { name: 'Đà Nẵng', code: 'dn', lat: 16.0544, lon: 108.2022 },
];

const EventSidebar: React.FC<EventSidebarProps> = ({
  handleFilter,
  setIsShowLunarDay,
  setIsOpenGPEventDetailsModal,
  setEventSelected
}) => {
  // --- States ---
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
  const [eventGp] = useState<GPItem[]>([]);
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

  // Apply filters
  useEffect(() => {
    handleFilter({ eventType: eventTypes, eventGp: eventGroups, eventLocation });
  }, [eventTypes, eventGroups, eventLocation]);

  // Fetch provinces and prepare data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/account/provinces");
        const provinces = Array.isArray(res.data) ? res.data : [];
        const listCityMapped: CityItem[] = provinces.map((p: any) => ({
          name: p.nameWithType || p.name,
          code: p.code || p.slug || p.id,
        }));
        const fallback = MOCK_CITIES;
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

  // Filter cities by user input
  const locationFilteredItems = listCity.filter((item) =>
    item.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const { } = useCombobox({
    items: locationFilteredItems,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || "");
      if (!inputValue) setEventLocation("");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const found = listCity.find(x => x.code === selectedItem.code);
        setEventLocation(found?.name || "");
        if (found) fetchWeatherForCity(found);
      }
    },
    itemToString: (item) => (item ? item.name : ""),
  });

  // Fetch weather data
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

      let lat = city.lat;
      let lon = city.lon;

      // Fallback: use province name + ',Vietnam' for geocoding
      if ((typeof lat !== 'number' || typeof lon !== 'number') && city.name) {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city.name + ',Vietnam')}&limit=1&appid=${apiKey}`;
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
        setWeatherError('Không thể xác định tọa độ cho địa điểm này');
        setWeatherLoading(false);
        return;
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=vi`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

      const data = await res.json();
      const icon = data.weather?.[0]?.icon;
      const description = data.weather?.[0]?.description || '';
      const temp = typeof data.main?.temp === 'number' ? data.main.temp : NaN;

      setWeather({
        temp,
        icon: icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '',
        description,
        cityName: data.name,
      });
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setWeatherError(err?.message || 'Lỗi khi lấy thời tiết');
    } finally {
      setWeatherLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="w-full p-5 bg-white rounded-lg">
      <button
        onClick={() => {
          setEventSelected(null);
          setIsOpenGPEventDetailsModal(true);
        }}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-10 text-[15px] font-medium mb-4 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm sự kiện mới</span>
      </button>

      {/* Event Type Section */}
      <div>
        <div
          onClick={() => toggleSection("eventType")}
          className="flex justify-between items-center py-2 cursor-pointer font-medium text-sm border-b border-gray-100 select-none"
        >
          <span>Loại sự kiện</span>
          <ChevronDown
            className={`text-gray-500 w-4 h-4 transition-transform duration-300 ${openSections.eventType ? "rotate-180" : "rotate-0"
              }`}
          />
        </div>

        {openSections.eventType && (
          <div className="py-2">
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
                    <span className="text-sm">{EVENT_TYPE_CONFIG[type].label}</span>
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Groups */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection("familyGroups")}
          className="flex justify-between items-center py-2 cursor-pointer font-medium text-sm border-b border-gray-100 select-none"
        >
          <span>Sự kiện gia phả</span>
          <ChevronDown
            className={`text-gray-500 w-4 h-4 transition-transform duration-300 ${openSections.familyGroups ? "rotate-180" : "rotate-0"
              }`}
          />
        </div>
        {openSections.familyGroups && (
          <div className=" overflow-y-auto">
            {eventGp.length === 0 ? (
              <div className="text-sm text-gray-400 italic py-2">
                Không có gia phả nào
              </div>
            ) : (
              eventGp.map((group) => (
                <div key={group.value} className="mb-2.5">
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

      {/* Lunar Calendar */}
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

      {/* Weather & Location */}
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
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 w-full">
              {weather.icon ? (
                <img src={weather.icon} alt="icon" className="w-8 h-8" />
              ) : (
                <MapPin className="text-blue-500 w-5 h-5" />
              )}
              <div className="text-sm">
                <div className="font-medium">{weather.cityName || ''}</div>
                <div className="text-xs text-gray-500">
                  {Math.round(weather.temp)}°C • {weather.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Chọn địa điểm để xem thời tiết</div>
          )}
        </div>
        {/* Province dropdown */}
        <div className="relative">
          <select
            value={eventLocation}
            onChange={e => {
              const code = e.target.value;
              setEventLocation(code);
              const found = listCity.find(x => x.code === code);
              if (found) fetchWeatherForCity(found);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Chọn địa điểm...</option>
            {listCity.map(city => (
              <option key={city.code} value={city.code}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6">
        <EventStatistics />
      </div>
    </div>
  );
};

export default EventSidebar;
