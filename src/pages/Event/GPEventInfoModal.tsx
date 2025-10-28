// @ts-nocheck
import { useEffect } from "react";
import { Input, Select } from "antd";
import { X, Calendar, MapPin, Repeat, User, Users, FileText, Trash2, ChevronDown } from "lucide-react";
import "moment/locale/vi";
import moment from "moment";

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
  } = defaultValues;

  const startTimeText = start ? moment(start).format("dddd, DD/MM/YYYY - HH:mm") : "";
  const endTimeText = end ? moment(end).format("dddd, DD/MM/YYYY - HH:mm") : "";
  const memberNamesJoin = Array.isArray(memberNames) ? memberNames.join(", ") : "";
  const gpNamesJoin = Array.isArray(gpNames) ? gpNames.join(", ") : "";

  useEffect(() => {
    // Nếu cần load thêm dữ liệu khác, có thể gọi ở đây
  }, []);

  const handleMenuClick = (e) => {
    if (e.key === "1") {
      setConfirmDeleteModal(true);
    }
    if (e.key === "2") {
      setConfirmDeleteAllModal(true);
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
            <h2 className="text-xl font-bold text-gray-900">Chi tiết sự kiện: {name}</h2>
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
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="font-medium text-sm">{startTimeText} - {endTimeText}</span>
            </div>
            
            {/* Địa chỉ */}
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{address || "Không có địa chỉ"}</span>
            </div>
            
            {/* Lặp lại */}
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
          {isOwner ? (
            <>
              <button
                onClick={handleOnCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>

              {recurrence === "ONCE" ? (
                <button
                  onClick={() => setConfirmDeleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              )}

              <button
                onClick={handelOnUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Chỉnh sửa
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPEventInfoModal;
