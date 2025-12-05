import { EventType } from '@/types/event';
import heartHandshakeIcon from '@/assets/img/icon/heart-handshake.svg';
import mapIcon from '@/assets/img/icon/Map.svg';
import mapOtherIcon from '@/assets/img/icon/Map-Other.svg';
import NonCategorizedIcon from '@/assets/img/icon/Non-categorized.svg';
// celebrationIcon removed - HOLIDAY event type no longer supported

// Re-export EventType for convenience
export type { EventType };

// Helper object to access enum values
export const EVENT_TYPE = {
  MEMORIAL: EventType.MEMORIAL,  // "Ma chay, giỗ" - backend number 1
  WEDDING: EventType.WEDDING,    // "Cưới hỏi" - backend number 2
  BIRTHDAY: EventType.BIRTHDAY,  // "Sinh nhật" - backend number 3
  OTHER: EventType.OTHER,        // "Khác" - backend number 4
} as const;

export const EVENT_TYPE_CONFIG: Partial<Record<EventType, { label: string; icon: string; color: string }>> = {
  [EventType.MEMORIAL]: {
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
    label: "Sinh nhật",
    icon: NonCategorizedIcon,
    color: "#1677FF",
  },
  [EventType.OTHER]: {
    label: "Khác",
    icon: mapOtherIcon,
    color: "#FAAD14",
  },
  // Legacy support for FUNERAL (alias for MEMORIAL)
  [EventType.FUNERAL]: {
    label: "Ma chay, giỗ",
    icon: mapIcon,
    color: "#9B51E0",
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
  const config =
    ((type ? EVENT_TYPE_CONFIG[type as EventType] : undefined) ??
      EVENT_TYPE_CONFIG[EventType.OTHER]) as {
      label: string;
      icon: string;
      color: string;
    };
  const { icon, color } = config;

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
