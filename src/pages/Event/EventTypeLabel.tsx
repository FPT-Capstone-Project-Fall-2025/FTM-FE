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
  OTHER: "OTHER",
} as const;

export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
  FUNERAL: {
    label: "Ma chay, giỗ",
    icon: mapIcon,
    color: "#9B51E0",
  },
  WEDDING: {
    label: "Cưới hỏi",
    icon: heartHandshakeIcon,
    color: "#52c41a",
  },
  BIRTHDAY: {
    label: "Sinh nhật",
    icon: NonCategorizedIcon,
    color: "#1677FF",
  },
  HOLIDAY: {
    label: "Ngày lễ",
    icon: celebrationIcon,
    color: "#fa8c16",
  },
  OTHER: {
    label: "Khác",
    icon: mapOtherIcon,
    color: "#FAAD14",
  },
};

interface EventTypeLabelProps {
  type: EventType | string;
  title: string;
  timeStart?: string | null;
  timeEnd?: string | null;
  allDay?: boolean;
  durationDays?: number;
}

export default function EventTypeLabel({
  type,
  title,
  timeStart = null,
  timeEnd = null,
  allDay = false,
  durationDays = 1,
}: EventTypeLabelProps) {
  const { icon, color } = EVENT_TYPE_CONFIG[type as EventType] || EVENT_TYPE_CONFIG.OTHER;

  return (
    <div
      className="flex items-start gap-2 p-2 rounded-lg shadow-sm border-l-4 bg-white"
      style={{ borderColor: color, maxWidth: `${durationDays * 100}%` }}
    >
      <img src={icon} alt={type} className="w-5 h-5 flex-shrink-0 mt-0.5" />

      <div className="flex flex-col text-sm leading-tight truncate">
        <span
          className="font-medium truncate"
          style={{ color }}
          title={title}
        >
          {title}
        </span>

        {allDay ? (
          <span className="text-gray-500 text-xs mt-0.5">Cả ngày</span>
        ) : (
          timeStart &&
          timeEnd && (
            <span className="text-gray-500 text-xs mt-0.5">
              {timeStart} – {timeEnd}
            </span>
          )
        )}
      </div>
    </div>
  );
}
