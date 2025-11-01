import { EventType } from '@/types/event';
import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
import celebrationIcon from '@/assets/img/icon/celebration.svg';
import calendarIcon from '@/assets/img/icon/calendar_today.svg';
import locationIcon from '@/assets/img/icon/location.svg';

// Re-export EventType for convenience
export type { EventType };

// Helper object to access enum values as strings
export const EVENT_TYPE = {
  FUNERAL: EventType.FUNERAL,
  WEDDING: EventType.WEDDING,
  BIRTHDAY: EventType.BIRTHDAY,
  HOLIDAY: EventType.HOLIDAY,
  MEMORIAL: EventType.MEMORIAL,
  MEETING: EventType.MEETING,
  GATHERING: EventType.GATHERING,
  OTHER: EventType.OTHER,
} as const;

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
  [EventType.FUNERAL]: {
    label: "Ma chay, giỗ",
    icon: mapIcon,
    color: "#9B51E0",
  },
  [EventType.WEDDING]: {
    label: "Cưới hỏi",
    icon: heartHandshakeIcon,
    color: "#52c41a",
  },
  [EventType.BIRTHDAY]: {
    label: "Mừng thọ",
    icon: NonCategorizedIcon,
    color: "#1677FF",
  },
  [EventType.HOLIDAY]: {
    label: "Ngày lễ",
    icon: celebrationIcon,
    color: "#fa8c16",
  },
  [EventType.MEMORIAL]: {
    label: "Tưởng niệm",
    icon: calendarIcon,
    color: "#722ED1",
  },
  [EventType.MEETING]: {
    label: "Họp mặt",
    icon: locationIcon,
    color: "#13C2C2",
  },
  [EventType.GATHERING]: {
    label: "Sum họp",
    icon: heartHandshakeIcon,
    color: "#EB2F96",
  },
  [EventType.OTHER]: {
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
  const { icon, color } = EVENT_TYPE_CONFIG[type as EventType] || EVENT_TYPE_CONFIG[EventType.OTHER];

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
