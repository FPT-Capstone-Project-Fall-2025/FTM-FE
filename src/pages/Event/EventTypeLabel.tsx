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
} as const;

export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
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

interface EventTypeLabelProps {
  type: EventType | string;
  title: string;
  timeStart?: string | null;
  timeEnd?: string | null;
  allDay?: boolean;
  durationDays?: number;
}

export default function EventTypeLabel({ type, title, timeStart = null, timeEnd = null, allDay = false, durationDays = 1 }: EventTypeLabelProps) {
  const { icon, color } = EVENT_TYPE_CONFIG[type as EventType] || EVENT_TYPE_CONFIG.OTHER;

  // Tính toán width dựa trên số ngày diễn ra sự kiện
  const widthStyle = {
    maxWidth: `${durationDays * 100}%`,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div
      className={`event-type-label ${type}`}
      style={{ borderLeft: `5px solid ${color}` }}
    >
      <img className="event-type-icon" src={icon} alt={type} />
      <span className="event-type-text" style={{ color, ...widthStyle }}>
        {title}
        {
          !allDay 
          && timeStart 
          && timeEnd
          && (<><br /><span className="event-time">{timeStart}</span> - <span className="event-time">{timeEnd}</span></>)
        }
        {
          allDay 
          && (<><br /><span className="event-time">Cả ngày</span></>)
        }
      </span>
    </div>
  );
}
