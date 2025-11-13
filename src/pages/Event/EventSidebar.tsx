import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from "antd";
import { Plus, MapPin, ChevronDown } from "lucide-react";
import { useCombobox } from "downshift";
import { EVENT_TYPE_CONFIG, EVENT_TYPE } from "./EventTypeLabel";
import type { EventType } from "./EventTypeLabel";
import EventStatistics from "./EventStatistics";
import provinceService from "../../services/provinceService";
import familyTreeService from "../../services/familyTreeService";

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
  const ALL_EVENT_TYPES = useMemo(
    () => Object.values(EVENT_TYPE).filter((type) => !!EVENT_TYPE_CONFIG[type]) as EventType[],
    []
  );

  const [eventTypes, setEventTypes] = useState<EventType[]>([...ALL_EVENT_TYPES]);
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
  const [loadingFamilyTrees, setLoadingFamilyTrees] = useState<boolean>(false);
  const [weather, setWeather] = useState<{
    temp: number;
    icon: string;
    description: string;
    cityName?: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        const res = await provinceService.getAllProvinces();
        const provinces = res?.data?.data || res?.data || [];
        const listCityMapped: CityItem[] = provinces.map((p: any) => ({
          name: p.nameWithType || p.name,
          code: p.code || p.slug || p.id,
          lat: p.lat,
          lon: p.lon,
        }));
        const fallback = MOCK_CITIES;
        const finalList = listCityMapped.length > 0 ? listCityMapped : fallback;
        setListCity(finalList);
        setInputValue("");
        setEventLocation("");

        // Set default to Đà Nẵng
        const daNangCity = finalList.find(c => 
          c.name.toLowerCase().includes('đà nẵng') || 
          c.name.toLowerCase().includes('da nang') ||
          c.code === 'dn'
        );
        
        if (daNangCity) {
          setEventLocation(daNangCity.code);
          // Fetch weather for Đà Nẵng by default
          setTimeout(() => {
            fetchWeatherForCity(daNangCity);
          }, 500);
        }
      } catch (error) {
        console.error("Error preparing sidebar data:", error);
        // Use fallback on error
        setListCity(MOCK_CITIES);
        
        // Set default to Đà Nẵng from MOCK_CITIES
        const daNangCity = MOCK_CITIES.find(c => c.code === 'dn');
        if (daNangCity) {
          setEventLocation(daNangCity.code);
          setTimeout(() => {
            fetchWeatherForCity(daNangCity);
          }, 500);
        }
      }
    };
    fetchData();
    setIsShowLunarDay(showLunar);
  }, []);

  // Fetch family trees (Gia phả)
  useEffect(() => {
    const fetchFamilyTrees = async () => {
      setLoadingFamilyTrees(true);
      try {
        const response: any = await familyTreeService.getAllFamilyTrees(1, 100);
        const familyTrees = response?.data?.data?.data || response?.data?.data || [];

        const mappedGps: GPItem[] = familyTrees.map((tree: any) => ({
          label: tree.name || 'Gia phả',
          value: tree.id,
        }));

        setEventGp(mappedGps);

        // Auto-select all family groups on initialization
        const allGroupIds = mappedGps.map(gp => gp.value);
        setEventGroups(allGroupIds);
        console.log('🎯 Auto-selected all family groups:', allGroupIds);
      } catch (error) {
        console.error("Error fetching family trees:", error);
        setEventGp([]);
      } finally {
        setLoadingFamilyTrees(false);
      }
    };

    fetchFamilyTrees();
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

  // Get current location using Geolocation API
  const getCurrentLocation = async (): Promise<{ lat: number; lon: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Trình duyệt không hỗ trợ Geolocation');
        resolve(null);
        return;
      }

      setLocationLoading(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false);
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          setLocationLoading(false);
          console.error('Geolocation error:', error);
          let errorMessage = 'Không thể lấy vị trí hiện tại';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Quyền truy cập vị trí bị từ chối';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Thông tin vị trí không khả dụng';
              break;
            case error.TIMEOUT:
              errorMessage = 'Hết thời gian chờ lấy vị trí';
              break;
          }
          setLocationError(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  // Fetch weather by coordinates
  const fetchWeatherByCoordinates = async (lat: number, lon: number) => {
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

      // Get city name from reverse geocoding
      const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${apiKey}`;
      const reverseGeoRes = await fetch(reverseGeoUrl);
      let cityName = '';
      let stateName = '';
      
      if (reverseGeoRes.ok) {
        const reverseGeoData = await reverseGeoRes.json();
        if (Array.isArray(reverseGeoData) && reverseGeoData.length > 0) {
          const location = reverseGeoData[0];
          cityName = location.name || '';
          stateName = location.state || '';
        }
      }

      // Fetch weather data
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=vi`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

      const data = await res.json();
      const icon = data.weather?.[0]?.icon;
      const description = data.weather?.[0]?.description || '';
      const temp = typeof data.main?.temp === 'number' ? data.main.temp : NaN;

      const displayCityName = cityName || data.name || 'Vị trí hiện tại';
      
      setWeather({
        temp,
        icon: icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '',
        description,
        cityName: displayCityName,
      });

      // Update event location to show in dropdown (only if listCity is loaded)
      if (listCity.length > 0) {
        let foundCity: CityItem | undefined;
        
        // First try: exact name match
        if (cityName) {
          foundCity = listCity.find(c => {
            const cityNameLower = cityName.toLowerCase().trim();
            const cityListNameLower = c.name.toLowerCase().trim();
            // Exact match
            if (cityNameLower === cityListNameLower) return true;
            // Remove common suffixes like "Thành phố", "Tỉnh", etc.
            const cleanCityName = cityNameLower.replace(/^(thành phố|tỉnh|thị xã|huyện)\s+/i, '').trim();
            const cleanListName = cityListNameLower.replace(/^(thành phố|tỉnh|thị xã|huyện)\s+/i, '').trim();
            if (cleanCityName === cleanListName) return true;
            // Partial match (contains)
            return cityNameLower.includes(cityListNameLower) || cityListNameLower.includes(cityNameLower);
          });
        }
        
        // Second try: find by coordinates (find nearest city)
        if (!foundCity) {
          let nearestCity: CityItem | undefined;
          let nearestDistance = Infinity;
          
          listCity.forEach(city => {
            if (typeof city.lat === 'number' && typeof city.lon === 'number') {
              const distance = Math.sqrt(
                Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2)
              );
              
              if (distance < nearestDistance && distance < 0.5) { // Within ~50km
                nearestDistance = distance;
                nearestCity = city;
              }
            }
          });
          
          foundCity = nearestCity;
        }
        
        // Third try: find by state/province name if available
        if (!foundCity && stateName) {
          foundCity = listCity.find(c => {
            const stateNameLower = stateName.toLowerCase().trim();
            const cityNameLower = c.name.toLowerCase().trim();
            return cityNameLower.includes(stateNameLower) || stateNameLower.includes(cityNameLower);
          });
        }
        
        if (foundCity) {
          setEventLocation(foundCity.code);
          console.log('✅ Tự động chọn dropdown:', foundCity.name, '(Code:', foundCity.code + ')');
        } else {
          console.log('⚠️ Không tìm thấy thành phố khớp trong danh sách. Tên từ API:', cityName);
        }
      } else {
        console.log('⚠️ Danh sách thành phố chưa được load');
      }
    } catch (err: any) {
      console.error('Error fetching weather by coordinates:', err);
      setWeatherError(err?.message || 'Lỗi khi lấy thời tiết');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handle use current location button click
  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      await fetchWeatherByCoordinates(location.lat, location.lon);
    }
  };

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
          <div className="flex items-center gap-2">
            <span>Loại sự kiện</span>
            <span className="text-xs text-gray-500 font-normal">
              ({eventTypes.length}/{ALL_EVENT_TYPES.length})
            </span>
          </div>
          <ChevronDown
            className={`text-gray-500 w-4 h-4 transition-transform duration-300 ${openSections.eventType ? "rotate-180" : "rotate-0"
              }`}
          />
        </div>

        {openSections.eventType && (
          <div className="py-2">
            {/* Select All / Deselect All Buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEventTypes([...ALL_EVENT_TYPES]);
                }}
                className="flex-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors font-medium"
                type="button"
              >
                ✓ Chọn tất cả
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEventTypes([]);
                }}
                className="flex-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors font-medium"
                type="button"
              >
                ✕ Bỏ chọn
              </button>
            </div>

            {/* Event Type Checkboxes */}
            {ALL_EVENT_TYPES.map((type) => {
              const config = EVENT_TYPE_CONFIG[type];
              if (!config) {
                console.warn('Missing EVENT_TYPE_CONFIG for type:', type);
                return null;
              }
              return (
                <div key={type} className="mb-2.5">
                  <Checkbox
                    checked={eventTypes.includes(type)}
                    onChange={() => toggleCheckbox(eventTypes, setEventTypes, type)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2">
                      {config.icon ? (
                        <img src={config.icon} alt={config.label} className="w-5 h-5" />
                      ) : (
                        <span className="w-5 h-5 inline-flex items-center justify-center text-xs bg-gray-200 rounded">
                          ?
                        </span>
                      )}
                      <span className="text-sm">{config.label || type}</span>
                    </div>
                  </Checkbox>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Family Groups */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection("familyGroups")}
          className="flex justify-between items-center py-2 cursor-pointer font-medium text-sm border-b border-gray-100 select-none"
        >
          <div className="flex items-center gap-2">
            <span>Sự kiện gia phả</span>
            <span className="text-xs text-gray-500 font-normal">
              ({eventGroups.length}/{eventGp.length})
            </span>
          </div>
          <ChevronDown
            className={`text-gray-500 w-4 h-4 transition-transform duration-300 ${openSections.familyGroups ? "rotate-180" : "rotate-0"
              }`}
          />
        </div>
        {openSections.familyGroups && (
          <div className="overflow-y-auto py-2">
            {loadingFamilyTrees ? (
              <div className="text-sm text-gray-400 italic py-2">
                Đang tải...
              </div>
            ) : eventGp.length === 0 ? (
              <div className="text-sm text-gray-400 italic py-2">
                Không có gia phả nào
              </div>
            ) : (
              <>
                {/* Select All / Deselect All Buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventGroups(eventGp.map(g => g.value));
                    }}
                    className="flex-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors font-medium"
                    type="button"
                  >
                    ✓ Chọn tất cả
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventGroups([]);
                    }}
                    className="flex-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors font-medium"
                    type="button"
                  >
                    ✕ Bỏ chọn
                  </button>
                </div>

                {/* Group Checkboxes */}
                {eventGp.map((group) => (
                  <div key={group.value} className="mb-2.5">
                    <Checkbox
                      checked={eventGroups.includes(group.value)}
                      onChange={() => toggleCheckbox(eventGroups, setEventGroups, group.value)}
                      className="w-full"
                    >
                      <span className="text-sm">{group.label}</span>
                    </Checkbox>
                  </div>
                ))}
              </>
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
 
        
        {/* Province dropdown and location button in one row */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
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
          
          {/* Use current location button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
            className="px-2 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title={locationLoading ? 'Đang lấy vị trí...' : 'Sử dụng vị trí hiện tại'}
          >
            {locationLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Location error message */}
        {locationError && (
          <div className="text-xs text-red-500 mb-2">{locationError}</div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6">
        <EventStatistics />
      </div>
    </div>
  );
};

export default EventSidebar;
