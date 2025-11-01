import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setFontSize, setMinimizeHeader, type FontSize } from '@/stores/slices/settingsSlice';
import { Settings, Type, Minimize2, Maximize2 } from 'lucide-react';
import { Card } from 'antd';

const SettingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fontSize, minimizeHeader } = useAppSelector((state) => state.settings);

  const handleFontSizeChange = (newFontSize: FontSize) => {
    dispatch(setFontSize(newFontSize));
  };

  const handleMinimizeHeaderChange = (value: boolean) => {
    dispatch(setMinimizeHeader(value));
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          </div>
          <p className="text-gray-600">
            Tùy chỉnh giao diện và trải nghiệm của bạn
          </p>
        </div>

        <div className="space-y-6">

          {/* Font Size Settings */}
          <div className="mb-6">
            <Card className="shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Kích thước chữ</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Điều chỉnh kích thước chữ cho toàn bộ ứng dụng
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleFontSizeChange('small')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  fontSize === 'small'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
              >
                <div className={`text-center ${fontSize === 'small' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <div className="text-2xl font-bold mb-1">Aa</div>
                  <span className="font-medium text-sm">Nhỏ</span>
                </div>
              </button>
              <button
                onClick={() => handleFontSizeChange('medium')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  fontSize === 'medium'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
              >
                <div className={`text-center ${fontSize === 'medium' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <div className="text-3xl font-bold mb-1">Aa</div>
                  <span className="font-medium text-sm">Vừa</span>
                </div>
              </button>
              <button
                onClick={() => handleFontSizeChange('large')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  fontSize === 'large'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
              >
                <div className={`text-center ${fontSize === 'large' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <div className="text-4xl font-bold mb-1">Aa</div>
                  <span className="font-medium text-sm">Lớn</span>
                </div>
              </button>
            </div>
            </Card>
          </div>

          {/* Minimize Header Settings */}
          <div className="mb-6">
            <Card className="shadow-md">
            <div className="flex items-center gap-3 mb-4">
              {minimizeHeader ? (
                <Minimize2 className="w-6 h-6 text-blue-600" />
              ) : (
                <Maximize2 className="w-6 h-6 text-blue-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">Thu gọn Header</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Giảm chiều cao của thanh điều hướng để tiết kiệm không gian màn hình
            </p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {minimizeHeader ? 'Header đã được thu gọn (48px)' : 'Header ở kích thước bình thường (64px)'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {minimizeHeader ? 'Thanh điều hướng đã được thu nhỏ' : 'Bấm để thu gọn header'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={minimizeHeader}
                  onChange={(e) => handleMinimizeHeaderChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;

