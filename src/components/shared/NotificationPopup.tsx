import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Trash2, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { deleteNotification, markAllRead, markAsRead } from '@/stores/slices/notificationSlice';
import parse from 'html-react-parser';
import { formatNotificationTime } from '@/utils/dateUtils';
import notificationService from '@/services/notificationService';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose, anchorRef }) => {
  const navigate = useNavigate();
  const popupRef = useRef<HTMLDivElement>(null);
  const { notifications } = useAppSelector(state => state.notifications);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  // Calculate position
  useEffect(() => {
    if (isOpen && anchorRef.current && popupRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popup = popupRef.current;

      // Position popup below and aligned to the right of anchor
      popup.style.top = `${anchorRect.bottom + 8}px`;
      popup.style.right = `${window.innerWidth - anchorRect.right}px`;
    }
  }, [isOpen, anchorRef]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllRead());
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      dispatch(deleteNotification(id));
      await notificationService.deleteNotifications(id);
    } catch (error) {
      console.log(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRespond = async (relatedId: string, accepted: boolean) => {
    try {
      const response = await notificationService.invitationResponse(relatedId, accepted);
      console.log(response);

    } catch (err) {
      console.error(err);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={popupRef}
        className="absolute bg-white rounded-lg shadow-xl w-96 max-h-[500px] flex flex-col pointer-events-auto border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${!notification.isRead ? "bg-blue-500" : "bg-gray-300"
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"
                            }`}
                        >
                          {notification.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${getTypeColor(
                            notification.type
                          )}`}
                        >
                          {notification.type}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        {parse(notification.message)}
                      </div>

                      {/* Action buttons (only if actionable) */}
                      {notification.isActionable && (
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <button
                            onClick={() => {
                              handleRespond(notification.relatedId, true);
                            }}
                            className="px-3 py-1 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                          >
                            Đồng Ý
                          </button>
                          <button
                            onClick={() => {
                              handleRespond(notification.relatedId, false);
                            }}
                            className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Từ Chối
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatNotificationTime(notification.createdOn)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.relatedId)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3 text-center">
            <button
              onClick={() => {
                onClose();
                navigate('/notification');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Xem tất cả thông báo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;

