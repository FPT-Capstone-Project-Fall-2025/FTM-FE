import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Clock, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { deleteNotification, markAllRead, markAsRead } from '@/stores/slices/notificationSlice';
import parse from 'html-react-parser';
import notificationService from '@/services/notificationService';
import { formatNotificationTime } from '@/utils/dateUtils';
import { toast } from 'react-toastify';

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.notifications);

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

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

  const markAsUnread = (id: string) => {
    console.log(id);

    // setNotifications(prev =>
    //   prev.map(notif =>
    //     notif.id === id ? { ...notif, isRead: false } : notif
    //   )
    // );
  };

  const handleRespond = async (relatedId: string, accepted: boolean) => {
    try {
      const response = await notificationService.invitationResponse(relatedId, accepted);
      toast.success(response.message)
      console.log(response);
    } catch (err: any) {
      console.error(err?.Message);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Thông báo
              </h1>
              <p className="text-gray-600 mt-1.5">
                Quản lý và xem tất cả thông báo của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'all'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Tất cả
              {activeTab === 'all' && notifications.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'unread'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Actions Bar */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="text-sm text-gray-600">
                {activeTab === 'unread'
                  ? `${unreadCount} thông báo chưa đọc`
                  : `${notifications.length} thông báo`}
              </div>
              {activeTab === 'unread' && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Bell className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                {activeTab === 'unread'
                  ? 'Bạn đã đọc tất cả thông báo'
                  : 'Chưa có thông báo nào được gửi đến bạn'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-semibold mb-1 ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{parse(notification.message)}</p>

                          {/* Action buttons for actionable notifications */}
                          {notification.isActionable && (
                            <div className="flex items-center justify-start gap-2 mb-3">
                              <button
                                onClick={() => handleRespond(notification.relatedId, true)}
                                className="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                              >
                                Đồng Ý
                              </button>
                              <button
                                onClick={() => handleRespond(notification.relatedId, false)}
                                className="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                Từ Chối
                              </button>
                            </div>
                          )}

                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${getTypeColor(notification.type)} whitespace-nowrap flex-shrink-0`}>
                          {notification.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatNotificationTime(notification.createdOn)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.isRead ? (
                            <button
                              onClick={() => markAsUnread(notification.id)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Đánh dấu chưa đọc"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.relatedId)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default NotificationPage;

