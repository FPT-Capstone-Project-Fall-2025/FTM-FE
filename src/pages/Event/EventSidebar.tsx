// @ts-nocheck
import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Card, Space, Divider } from "antd";
import { PlusOutlined, UpOutlined, DownOutlined, CloseOutlined, EnvironmentOutlined } from "@ant-design/icons";
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

export default function EventSidebar({ 
  handleFilter, 
  setIsShowLunarDay, 
  setIsOpenGPEventDetailsModal, 
  setEventSelected 
}: EventSidebarProps) {
  // State management
  const [eventTypes, setEventTypes] = useState<EventType[]>([...Object.values(EVENT_TYPE)]);
  const [eventGroups, setEventGroups] = useState<string[]>([]);
  const [showLunar, setShowLunar] = useState(true);
  const [eventLocation, setEventLocation] = useState<string>("");
  const [openSections, setOpenSections] = useState({
    eventType: true,
    familyGroups: true,
  });
  const [listCity, setListCity] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [eventGp, setEventGp] = useState<any[]>([]);

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
    <div style={{ 
      width: '100%', 
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
    }}>
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
        style={{
          backgroundColor: '#1677ff',
          borderRadius: '8px',
          height: '48px',
          fontSize: '15px',
          fontWeight: 500,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Thêm sự kiện mới
      </Button>

      {/* Event Type Section */}
      <div style={{ marginBottom: '16px' }}>
        <div
          onClick={() => toggleSection("eventType")}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span>Loại sự kiện {openSections.eventType ? '∧' : '∨'}</span>
        </div>
        {openSections.eventType && (
          <div style={{ padding: '16px 0' }}>
            {Object.values(EVENT_TYPE).map((type) => (
              <div key={type} style={{ marginBottom: '10px' }}>
                <Checkbox
                  checked={eventTypes.includes(type)}
                  onChange={() => toggleCheckbox(eventTypes, setEventTypes, type)}
                  style={{ width: '100%' }}
                >
                  <Space size={8}>
                    <img 
                      src={EVENT_TYPE_CONFIG[type].icon} 
                      alt={EVENT_TYPE_CONFIG[type].label}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '14px' }}>
                      {EVENT_TYPE_CONFIG[type].label}
                    </span>
                  </Space>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Groups Section */}
      <div style={{ marginBottom: '16px' }}>
        <div
          onClick={() => toggleSection("familyGroups")}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span>Sự kiện gia phả {openSections.familyGroups ? '∧' : '∨'}</span>
        </div>
        {openSections.familyGroups && (
          <div style={{ padding: '16px 0', maxHeight: '150px', overflowY: 'auto' }}>
            {eventGp.map((group) => (
              <div key={group.value} style={{ marginBottom: '10px' }}>
                <Checkbox
                  checked={eventGroups.includes(group.value)}
                  onChange={() => toggleCheckbox(eventGroups, setEventGroups, group.value)}
                  style={{ width: '100%' }}
                >
                  <span style={{ fontSize: '14px' }}>{group.label}</span>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lunar Calendar Toggle */}
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Checkbox
          checked={showLunar}
          onChange={(e) => {
            setIsShowLunarDay(e.target.checked);
            setShowLunar(e.target.checked);
          }}
          style={{ width: '100%' }}
        >
          <span style={{ fontSize: '14px' }}>Hiển thị lịch âm</span>
        </Checkbox>
      </div>

      {/* Location Filter */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 500, 
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          Xem thời tiết theo vị trí địa lí
        </div>
        <div style={{ position: 'relative' }}>
          <Input
            {...getInputProps()}
            value={inputValue}
            placeholder="Nhập địa điểm..."
            prefix={<EnvironmentOutlined style={{ color: '#999' }} />}
            suffix={
              inputValue ? (
                <CloseOutlined 
                  onClick={() => { 
                    setInputValue(""); 
                    setEventLocation("") 
                  }}
                  style={{ cursor: 'pointer', color: '#999' }}
                />
              ) : null
            }
            style={{ borderRadius: '8px' }}
          />
          {inputValue && isOpen && locationFilteredItems.length > 0 && (
            <ul 
              {...getMenuProps()}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                listStyle: 'none',
                padding: '4px 0',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {locationFilteredItems.map((item, index) => (
                <li
                  key={item.code}
                  {...getItemProps({ item, index })}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: highlightedIndex === index ? '#f5f5f5' : 'white',
                    fontSize: '14px',
                  }}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div style={{ marginTop: '24px' }}>
        <EventStatistics />
      </div>
    </div>
  );
}