import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/redux';
import uploadImg from '@/assets/dashboard/import-image.png';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { EyeOff, Eye } from 'lucide-react';
import type { EditUserProfile, Province, UserProfile, Ward } from '@/types/user';
import dataService from '@/services/dataService';
import userService from '@/services/userService';

const DetailInformation: React.FC = () => {

  const { user, isLoading: isUserLoading } = useAppSelector(state => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    nickname: '',
    phoneNumber: '',
    job: '',
    gender: null,
    birthday: '',
    province: null,
    ward: null,
    address: '',
    picture: '',
  });
  const [editData, setEditData] = useState<EditUserProfile>({
    name: '',
    address: '',
    nickname: '',
    phoneNumber: '',
    birthday: '',
    job: '',
    gender: null,
    provinceId: '',
    wardId: '',
    picture: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'change-avatar' | 'change-password' | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';

    // Handle ISO 8601 format from backend
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]; // Returns "2025-10-05"
    }

    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
    }

    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    return '';
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';

    let year, month, day;

    // Handle ISO 8601 format
    if (dateStr.includes('T')) {
      [year, month, day] = dateStr.split('T')[0]?.split('-');
    }
    // Handle YYYY-MM-DD format
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      [year, month, day] = dateStr.split('-');
    }
    // Already in DD/MM/YYYY format
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    else {
      return '';
    }

    return `${day}/${month}/${year}`;
  };

  // Load provinces and wards data
  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        setIsLoadingLocation(true);

        // Fetch both APIs in parallel
        const [profileResponse, provincesResponse] = await Promise.all([
          userService.getProfileData(),
          dataService.getProvinces(),
        ]);

        const fetchedProfile = profileResponse.data;

        setFormData(fetchedProfile);
        setEditData({
          name: fetchedProfile.name || '',
          address: fetchedProfile.address || '',
          nickname: fetchedProfile.nickname || '',
          phoneNumber: fetchedProfile.phoneNumber || '',
          birthday: fetchedProfile.birthday || '',
          job: fetchedProfile.job || '',
          gender: fetchedProfile.gender || null,
          provinceId: fetchedProfile.province?.id || '',
          wardId: fetchedProfile.ward?.id || '',
          picture: fetchedProfile.picture || '',
        });
        setProvinces(provincesResponse.data);

        // Set selected province if it exists in formData
        const currentProvince = formData.province;
        if (currentProvince) {
          const foundProvince = provincesResponse.data.find(
            (p: any) => p.nameWithType === currentProvince || p.name === currentProvince
          );
          if (foundProvince) {
            setSelectedProvinceCode(foundProvince.code);
          }
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    loadDefaultData();
  }, []);



  useEffect(() => {
    const loadWardData = async () => {
      if (!selectedProvinceCode) return;
      try {
        const response = await dataService.getWards(selectedProvinceCode);
        setWards(response.data);
      } catch (error) {
        console.error('Error loading wards data:', error);
      }
    }
    loadWardData();
  }, [selectedProvinceCode]);

  const openPopup = (type: 'change-avatar' | 'change-password') => {
    setPopupType(type);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType(null);
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    setSelectedProvinceCode(provinceCode);
    setEditData(prev => ({
      ...prev,
      provinceId: provinceCode
    }));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    setEditData(prev => ({
      ...prev,
      wardId: wardId
    }));
  };

  const handleSave = async () => {
    console.log(editData);

    setIsLoading(true);
    try {
      const response = await userService.updateProfileData(editData);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
    setIsEditing(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: '',
        address: '',
        nickname: '',
        phoneNumber: '',
        birthday: '',
        job: '',
        gender: null,
        provinceId: null,
        wardId: null,
        picture: '',
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      console.log('Delete account');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    console.log('Changing password...', passwordData);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Đổi mật khẩu thành công!');
      closePopup();
    }, 600);
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 2MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file định dạng JPEG, JPG, PNG, GIF');
        return;
      }

      setSelectedAvatar(file);

      const reader = new FileReader();
      reader.onload = e => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSave = () => {
    if (selectedAvatar) {
      console.log('Uploading avatar...', selectedAvatar);
      setIsLoading(true);
      if (avatarPreview) {
        setFormData(prev => ({ ...prev, picture: avatarPreview }));
      }
      alert('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => {
        setIsLoading(false);
        closePopup();
      }, 400);
    }
  };

  const handleAvatarRemove = () => {
    console.log('Removing avatar...');
    setFormData(prev => ({ ...prev, picture: '' }));
    alert('Xóa ảnh đại diện thành công!');
    closePopup();
  };

  if (isUserLoading) {
    return <div>Loading user data...</div>;
  }

  const displayData = isEditing ? editData : formData;

  return (
    <>
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Profile Picture */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-6 text-center">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-blue-600 mb-4">
                  THÔNG TIN CÁ NHÂN
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Thông tin này sẽ được hiển thị công khai và vây hãy cần
                  thận với những gì bạn chia sẻ.
                </p>
              </div>

              {/* Profile Picture */}
              <div className="mb-6">
                <div
                  className="w-32 h-32 mx-auto rounded-full bg-gray-200 overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openPopup('change-avatar')}
                >
                  <img
                    src={displayData.picture || defaultPicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openPopup('change-password')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  THAY ĐỔI MẬT KHẨU
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Fields */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={displayData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={true}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Biệt danh, tên gọi nhỏ
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={displayData.nickname}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={displayData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nghề nghiệp
                  </label>
                  <input
                    type="text"
                    name="job"
                    value={displayData.job}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới tính
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={displayData.gender || 0}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Nam</option>
                      <option value={1}>Nữ</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={displayData.gender === 0 ? 'Nam' : 'Nữ'}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                    />
                  )}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type={isEditing ? 'date' : 'text'}
                    name="birthday"
                    value={
                      isEditing
                        ? formatDateForInput(displayData.birthday)
                        : formatDateForDisplay(displayData.birthday)
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành phố
                  </label>
                  {isEditing ? (
                    <select
                      name="province"
                      value={selectedProvinceCode}
                      onChange={handleProvinceChange}
                      disabled={isLoadingLocation}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map(province => (
                        <option key={province.id} value={province.id}>
                          {province.nameWithType}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.province?.name}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                    />
                  )}
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận/Huyện
                  </label>
                  {isEditing ? (
                    <select
                      name="ward"
                      value={formData.ward?.name}
                      onChange={handleWardChange}
                      disabled={isLoadingLocation || !selectedProvinceCode}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">
                        {!selectedProvinceCode
                          ? 'Chọn tỉnh/thành phố trước'
                          : 'Chọn quận/huyện'}
                      </option>
                      {wards.map(ward => (
                        <option key={ward.code} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.ward?.name}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                    />
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={displayData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  XÓA TÀI KHOẢN
                </button>

                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      HỦY
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {isLoading ? 'ĐANG LƯU...' : 'LƯU'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      const currentProvince = provinces.find(
                        p =>
                          p.nameWithType === formData.province?.nameWithType ||
                          p.name === formData.province?.name
                      );
                      if (currentProvince) {
                        setSelectedProvinceCode(currentProvince.code);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    CHỈNH SỬA
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Avatar Change Popup */}
            {popupType === 'change-avatar' && (
              <>
                <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                  <h2 className="text-xl font-bold text-center">
                    THAY ĐỔI ẢNH ĐẠI DIỆN
                  </h2>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Hãy chọn ảnh đại diện của bạn
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>• Định dạng: JFIF, PJPEG, JPEG, PJP, JPG, PNG</li>
                      <li>• Kích thước tối đa 2MB</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center">
                        {avatarPreview ? (
                          <div className="space-y-3">
                            <img
                              src={avatarPreview}
                              alt="Preview"
                              className="w-24 h-24 mx-auto rounded-full object-cover"
                            />
                            <p className="text-sm text-gray-600">
                              Nhấn để chọn ảnh khác
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center">
                              <img
                                src={uploadImg}
                                alt="Upload"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium mb-1">
                                Kéo thả ảnh vào đây
                              </p>
                              <p className="text-gray-500 text-sm">
                                hoặc nhấn để chọn ảnh
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() =>
                          (
                            document.querySelector(
                              'input[type="file"]'
                            ) as HTMLInputElement
                          )?.click()
                        }
                        className="flex-1 flex items-center justify-center space-x-1 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <svg
                          className="w-5 h-5 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="font-medium">Chọn ảnh đại diện</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="font-medium">Xóa ảnh đại diện</span>
                      </button>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closePopup}
                        className="px-6 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        HỦY
                      </button>
                      <button
                        type="button"
                        onClick={handleAvatarSave}
                        disabled={!selectedAvatar || isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        LƯU
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Password Change Popup */}
            {popupType === 'change-password' && (
              <>
                <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                  <h2 className="text-xl font-bold text-center">
                    Thay đổi mật khẩu
                  </h2>
                  <p className="text-blue-100 text-sm text-center mt-2">
                    Việc thay đổi mật khẩu yêu cầu bạn phải đăng xuất và đăng
                    nhập lại.
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showCurrentPassword ? <Eye /> : <EyeOff />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showNewPassword ? <Eye /> : <EyeOff />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Xác nhận Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <Eye /> : <EyeOff />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-8">
                    <button
                      type="button"
                      onClick={closePopup}
                      className="px-6 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      HỦY
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordSave}
                      disabled={
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword ||
                        isLoading
                      }
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      LƯU
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DetailInformation;