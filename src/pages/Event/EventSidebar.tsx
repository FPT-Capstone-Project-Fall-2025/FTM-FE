import { useEffect, useState } from "react";
import { Button, Checkbox, Input } from "antd";
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
  lat: number;
  lon: number;
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
        // Mock data for now - replace with actual API calls when services are available
        const mockGPData: GPItem[] = [];
        const mockCitiesData: any[] = [];

        setEventGp(mockGPData);

        const listCityMapped = mockCitiesData.map((x: any) => ({
          name: x.label,
          code: x.value,
          lat: x.lat,
          lon: x.lon,
        }));
        setListCity(listCityMapped);
        setInputValue("");
        setEventLocation("");
      } catch (error) {
        console.error("Error fetching data:", error);
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
      }
    },
    itemToString: (item) => (item ? item.name : ""),
  });

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