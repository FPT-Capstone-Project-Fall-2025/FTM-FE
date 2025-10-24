import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
import celebrationIcon from '@/assets/img/icon/celebration.svg';

export const EVENT_TYPE = {
  FUNERAL: "FUNERAL",
  WEDDING: "WEDDING",
  BIRTHDAY: "BIRTHDAY",
  HOLIDAY: "HOLIDAY",
  OTHER: "OTHER"
};

export const CONFIG = {
  FUNERAL: {
    label: "Ma chay, giỗ",
    icon: mapIcon,
    color: "#9B51E0"
  },
  WEDDING: {
    label: "Cưới hỏi",
    icon: heartHandshakeIcon,
    color: "#52c41a"
  },
  BIRTHDAY: {
    label: "Sinh nhật",
    icon: NonCategorizedIcon,
    color: "#1677FF"
  },
  HOLIDAY: {
    label: "Ngày lễ",
    icon: celebrationIcon,
    color: "#fa8c16"
  },
  OTHER: {
    label: "Khác",
    icon: mapOtherIcon,
    color: "#FAAD14"
  }
};

interface EventTitleProps {
  type: keyof typeof CONFIG;
  title: string;
  durationDays?: number;
}

export default function EventTitle({ type, title, durationDays = 1 }: EventTitleProps) {
  const { icon, color } = CONFIG[type] || CONFIG.OTHER;

  // Tính toán width dựa trên số ngày diễn ra sự kiện
  const widthStyle = {
    maxWidth: `${durationDays * 100}%`,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div
      className={`event-type-title ${type}`}
    >
      <img className="event-type-icon" src={icon} alt={type} />
      <span className="event-type-text" style={{ color, ...widthStyle }}>
        {title}        
      </span>
    </div>
  );
}
