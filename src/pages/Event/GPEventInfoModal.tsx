// @ts-nocheck
import { useEffect } from "react";
import { Input, Select } from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  RetweetOutlined,
  UserOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  DeleteOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { X } from "lucide-react";
import "moment/locale/vi";
import moment from "moment";

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
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
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
                src={`${PREFIX_URL}/${imageUrl}`}
                alt="Event"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Thông tin sự kiện dạng inline input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            {/* Thời gian */}
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-blue-500" />
              <Input value={`${startTimeText} - ${endTimeText}`} readOnly className="font-medium uppercase" />
            </div>
            {/* Địa chỉ */}
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-green-500" />
              <Input value={address || ""} readOnly placeholder="Địa chỉ" />
            </div>
            {/* Lặp lại */}
            <div className="flex items-center gap-2">
              <RetweetOutlined className="text-orange-500" />
              <Input value={recurrence === "ONCE"
                ? "Không lặp lại"
                : recurrence === "DAILY"
                ? "Mỗi ngày"
                : recurrence === "WEEKLY"
                ? "Mỗi tuần"
                : recurrence === "MONTHLY"
                ? "Mỗi tháng"
                : recurrence === "YEARLY"
                ? "Mỗi năm"
                : "Khác"} readOnly />
            </div>
            {/* Thành viên */}
            <div className="flex items-center gap-2">
              <UserOutlined className="text-gray-500" />
              <Input value={memberNamesJoin} readOnly placeholder="Thành viên" />
            </div>
            {/* Gia phả */}
            <div className="flex items-center gap-2">
              <ApartmentOutlined className="text-purple-500" />
              <Input value={gpNamesJoin} readOnly placeholder="Gia phả" />
            </div>
            {/* Mô tả */}
            <div className="flex items-center gap-2 col-span-1 md:col-span-2">
              <FileTextOutlined className="text-gray-400" />
              <Input.TextArea value={decodeHTML(description)} readOnly autoSize placeholder="Mô tả" />
            </div>
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
                  <DeleteOutlined />
                  <span>Xóa</span>
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <DeleteOutlined />
                  <DownOutlined />
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
