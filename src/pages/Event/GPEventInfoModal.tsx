// @ts-nocheck
import { useState } from "react";
import { Input, Select } from "antd";
import { X, Calendar, MapPin, Repeat, User, Users, FileText, Trash2, ChevronDown, CalendarPlus, Loader2 } from "lucide-react";
import "moment/locale/vi";
import moment from "moment";
import eventService from "../../services/eventService";
import { toast } from 'react-toastify';

// API Base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://be.dev.familytree.io.vn/api';
const PREFIX_URL = API_BASE_URL.replace('/api', ''); // Remove /api suffix for image paths

/**
 * Giải mã các ký tự HTML entities như &lt; &gt; &amp; &quot;
 */
function decodeHTML(html: string = ""): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const GPEventInfoModal = ({
  isOpenModal,
  setIsOpenModal,
  defaultValues = {},
  setConfirmDeleteModal,
  setConfirmDeleteAllModal,
  setIsOpenGPEventDetailsModal,
  setEventSelected,
}) => {
  const {
    name,
    title,
    start,
    end,
    recurrence,
    memberNames,
    gpNames,
    description,
    imageUrl,
    isOwner,
    type,
    address,
    isLunar,
    id,
    onEventDeleted,
    onEventUpdated,
    extendedProps,
  } = defaultValues;

  // Use name or title (title is used by holiday events)
  const eventName = name || title || 'Sự kiện';

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check if this is a Vietnamese holiday event
  const isVietnameseHoliday = extendedProps?.isHoliday === true || (id && id.toString().startsWith('holiday-'));

  const startTimeText = start ? moment(start).locale("vi").format("dddd, DD/MM/YYYY - HH:mm") : "";
  const endTimeText = end ? moment(end).locale("vi").format("dddd, DD/MM/YYYY - HH:mm") : "";
  const memberNamesJoin = Array.isArray(memberNames) ? memberNames.join(", ") : "";
  const gpNamesJoin = Array.isArray(gpNames) ? gpNames.join(", ") : "";

  const handleMenuClick = (e) => {
    if (e.key === "1") {
      setConfirmDeleteModal(true);
    }
    if (e.key === "2") {
      setConfirmDeleteAllModal(true);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }

    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await eventService.deleteEventById(id);
      
      if (response?.data || response?.data?.data) {
        toast.success('Xóa sự kiện thành công!');
        setIsOpenModal(false);
        setEventSelected(null);
        
        // Call callback if provided
        if (onEventDeleted && typeof onEventDeleted === 'function') {
          onEventDeleted();
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error?.response?.data?.message || 'Xóa sự kiện thất bại. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handelOnUpdate = () => {
    setIsOpenModal(false);
    setIsOpenGPEventDetailsModal(true);
  };

  const handleOnCancel = () => {
    setEventSelected(null);
    setIsOpenModal(false);
  };

  const handleAddToGoogleCalendar = () => {
    // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
    const formatGoogleDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const startDateTime = start ? formatGoogleDate(new Date(start)) : '';
    const endDateTime = end ? formatGoogleDate(new Date(end)) : '';

    // Build Google Calendar URL
    const details = [];
    if (description) details.push(`📝 ${decodeHTML(description)}`);
    if (memberNamesJoin) details.push(`👥 Thành viên: ${memberNamesJoin}`);
    if (gpNamesJoin) details.push(`👨‍👩‍👧‍👦 Gia phả: ${gpNamesJoin}`);
    if (isLunar) details.push(`🌙 Sự kiện theo lịch âm`);

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', eventName);
    googleCalendarUrl.searchParams.set('dates', `${startDateTime}/${endDateTime}`);
    if (address) googleCalendarUrl.searchParams.set('location', address);
    if (details.length > 0) googleCalendarUrl.searchParams.set('details', details.join('\n\n'));

    // Open Google Calendar in new tab
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  const items = [
    { label: "Xóa lần này", key: "1" },
    { label: "Xóa chuỗi sự kiện", key: "2" },
  ];

  const menuProps = { items, onClick: handleMenuClick };

  if (!isOpenModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpenModal(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">Chi tiết sự kiện: {eventName}</h2>
          </div>
          <button
            onClick={() => setIsOpenModal(false)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {imageUrl && (
            <div className="relative w-full">
              <img
                src={imageUrl.startsWith('http') ? imageUrl : `${PREFIX_URL}/${imageUrl}`}
                alt="Event"
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  console.error('Failed to load image:', imageUrl);
                }}
              />
            </div>
          )}

          {/* Thông tin sự kiện dạng text display (không thể chỉnh sửa) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            {/* Thời gian */}
            {(startTimeText || endTimeText) && (
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="font-medium text-sm">{startTimeText} {startTimeText && endTimeText ? '-' : ''} {endTimeText}</span>
              </div>
            )}
            
            {/* Địa chỉ */}
            {address && (
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{address}</span>
              </div>
            )}
            
            {/* Lặp lại */}
            {recurrence && (
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                <Repeat className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="text-sm">
                  {recurrence === "ONCE"
                    ? "Không lặp lại"
                    : recurrence === "DAILY"
                    ? "Mỗi ngày"
                    : recurrence === "WEEKLY"
                    ? "Mỗi tuần"
                    : recurrence === "MONTHLY"
                    ? "Mỗi tháng"
                    : recurrence === "YEARLY"
                    ? "Mỗi năm"
                    : "Khác"}
                </span>
              </div>
            )}
            
            {/* Lịch âm */}
            {isLunar && (
              <div className="flex items-center gap-3 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-blue-600 text-lg">🌙</span>
                <span className="text-sm text-blue-700 font-medium">Sự kiện theo lịch âm</span>
              </div>
            )}
            
            {/* Thành viên */}
            {memberNamesJoin && (
              <div className="flex items-start gap-3 bg-gray-50 px-3 py-2 rounded-lg col-span-1 md:col-span-2">
                <User className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Thành viên tham gia:</div>
                  <span className="text-sm">{memberNamesJoin}</span>
                </div>
              </div>
            )}
            
            {/* Gia phả */}
            {gpNamesJoin && (
              <div className="flex items-start gap-3 bg-gray-50 px-3 py-2 rounded-lg col-span-1 md:col-span-2">
                <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Gia phả:</div>
                  <span className="text-sm">{gpNamesJoin}</span>
                </div>
              </div>
            )}
            
            {/* Mô tả */}
            {description && (
              <div className="flex items-start gap-3 bg-gray-50 px-3 py-3 rounded-lg col-span-1 md:col-span-2">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Mô tả:</div>
                  <p className="text-sm whitespace-pre-wrap">{decodeHTML(description)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          {isVietnameseHoliday ? (
            // For Vietnamese holidays, only show "Add to Google Calendar" button
            <>
              <button
                onClick={handleAddToGoogleCalendar}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285F4" opacity="0.1"/>
                  <path d="M19 4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4Z" stroke="#4285F4" strokeWidth="2" fill="none"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="#4285F4" strokeWidth="1.5"/>
                  <rect x="7" y="12" width="2" height="2" rx="0.5" fill="#4285F4"/>
                  <rect x="11" y="12" width="2" height="2" rx="0.5" fill="#4285F4"/>
                  <rect x="15" y="12" width="2" height="2" rx="0.5" fill="#4285F4"/>
                  <rect x="7" y="16" width="2" height="2" rx="0.5" fill="#4285F4"/>
                  <rect x="11" y="16" width="2" height="2" rx="0.5" fill="#4285F4"/>
                  <circle cx="18" cy="6" r="2.5" fill="white"/>
                  <path d="M18 4L16.5 5.5L18 7L19.5 5.5L18 4Z" fill="#4285F4"/>
                </svg>
                <span>Thêm vào Google Calendar</span>
              </button>
              <button
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </>
          ) : (
            // For regular events, show all buttons
            <>
              <button
                onClick={handleAddToGoogleCalendar}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Thêm vào Google Calendar</span>
              </button>

              {recurrence === "ONCE" ? (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isEditing}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isEditing}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                      <span>Xóa</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handelOnUpdate}
                disabled={isDeleting || isEditing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPEventInfoModal;
