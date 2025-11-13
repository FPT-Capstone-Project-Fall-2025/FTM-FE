import { Select } from "antd";
import heartHandshakeIcon from "@/assets/img/icon/heart-handshake.svg";
import mapIcon from "@/assets/img/icon/Map.svg";
import mapOtherIcon from "@/assets/img/icon/Map-Other.svg";
import NonCategorizedIcon from "@/assets/img/icon/Non-categorized.svg";
import celebrationIcon from "@/assets/img/icon/celebration.svg";

const CONFIG = {
  FUNERAL: { label: "Ma chay, giỗ", icon: mapIcon, color: "#9B51E0" },
  WEDDING: { label: "Cưới hỏi", icon: heartHandshakeIcon, color: "#52c41a" },
  BIRTHDAY: { label: "Sinh nhật - Mừng thọ", icon: NonCategorizedIcon, color: "#1677FF" },
  HOLIDAY: { label: "Ngày lễ", icon: celebrationIcon, color: "#fa8c16" },
  OTHER: { label: "Khác", icon: mapOtherIcon, color: "#FAAD14" },
};

// Danh sách options có icon + text
const eventTypes = Object.entries(CONFIG).map(([key, { label, icon, color }]) => ({
  value: key,
  label: (
    <div className="flex items-center gap-2">
      <img src={icon} alt={key} className="w-4 h-4" />
      <span style={{ color }}>{label}</span>
    </div>
  ),
}));

export default function EventTypeSelect({ field }: { field: any; fieldState?: any }) {
  return (
    <Select
      {...field}
      placeholder="Chọn loại sự kiện"
      options={eventTypes}
      className="w-full"
      popupMatchSelectWidth={false}
      optionLabelProp="label" // ✅ Quan trọng: để hiển thị JSX label trong input
    />
  );
}
