import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../hooks/redux';
import uploadImg from "@/assets/dashboard/import-image.png";
import defaultPicture from "@/assets/dashboard/default-avatar.png";
import provinceData from "@/assets/json/province.json";
import wardData from "@/assets/json/ward.json";

interface UserProfile {
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  occupation: string;
  gender: string;
  birthDate: string;
  address: string;
  province: string;
  ward: string;
  picture: string;
}

interface Province {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
}

interface Ward {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
  parent_code: string;
}

const DashboardPage: React.FC = () => {
  // const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  // Eye icon components for password visibility
  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );

  // Toggle password visibility functions
  // Password visibility is handled by refs and the showPassword function above.

  // Refs for direct DOM access to password inputs
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const newPasswordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  // Generic show/hide password that toggles input.type directly
  const showPassword = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!inputRef || !inputRef.current) return;
    const el = inputRef.current;
    if (el.type === 'password') {
      el.type = 'text';
    } else {
      el.type = 'password';
    }
  };

  // Date format helper functions
        const formatDateForInput = (dateStr: string) => {
    // Convert "dd/MM/yyyy" to "yyyy-MM-dd"
    if (!dateStr || !dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const [day, month, year] = parts;
    return `${year!}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
  };  const formatDateForDisplay = (dateStr: string) => {
    // Convert "yyyy-MM-dd" to "dd/MM/yyyy"
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [, setPasswordToggle] = useState(false);
  // Password visibility will be controlled via input refs and `showPassword`.
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // DOM DATA 
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: 'Nguyễn Ngọc A',
    nickname: 'A',
    email: 'an@example.com',
    phone: '0777456770',
    occupation: 'Designer',
    gender: 'Nữ',
    birthDate: '09/02/1992',
    address: '516 Cách Mạng Tháng 8',
    province: 'Đà Nẵng',
    ward: 'Cẩm Lệ',
    picture: '',
  });
  // DOM DATA 

  const [editData, setEditData] = useState<UserProfile>(profileData);
  const [isLoading, setIsLoading] = useState(false);

  // Province and Ward management
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [availableWards, setAvailableWards] = useState<Ward[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    // Load user profile data from Redux store or API
    if (user) {
      // Update profileData with actual user data
    }
  }, [user]);

  // Load provinces and wards data
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        setIsLoadingLocation(true);

        // Process provinces data
        const processedProvinces = Object.entries(provinceData as Record<string, any>).map(([code, data]) => ({
          code,
          ...data
        })).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));

        // Process wards data
        const processedWards = Object.entries(wardData as Record<string, any>).map(([code, data]) => ({
          code,
          ...data
        }));

        setProvinces(processedProvinces);
        setWards(processedWards);

        // Set default province if user has one
        const currentProvince = profileData.province;
        const foundProvince = processedProvinces.find(p => p.name === currentProvince);
        if (foundProvince) {
          setSelectedProvinceCode(foundProvince.code);
        }

      } catch (error) {
        console.error('Error loading location data:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    loadLocationData();
  }, []);

  // Update available wards when province changes
  useEffect(() => {
    if (selectedProvinceCode && wards.length > 0) {
      const filteredWards = wards.filter(ward => ward.parent_code === selectedProvinceCode);
      setAvailableWards(filteredWards);
    } else {
      setAvailableWards([]);
    }
  }, [selectedProvinceCode, wards]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsEditing(false); // Reset editing mode when switching tabs
  };

  const openPopup = (popupType: string) => {
    setPopupType(popupType);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType('');
    setSelectedAvatar(null);
    setAvatarPreview('');
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
    
    // Skip province updates here since it's handled by province selection
    if (name === 'province') {
      return;
    }
    
    // Handle date conversion for birthDate
    let finalValue = value;
    if (name === 'birthDate' && value.includes('-')) {
      // Convert from "yyyy-MM-dd" to "dd/MM/yyyy" for internal storage
      finalValue = formatDateForDisplay(value);
    }
    
    setEditData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    const selectedProvince = provinces.find(p => p.code === provinceCode);
    
    setSelectedProvinceCode(provinceCode);
    setEditData(prev => ({
      ...prev,
      province: selectedProvince ? selectedProvince.name : '',
      ward: '', // Reset ward when province changes
    }));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardNameWithType = e.target.value;
    const selectedWard = availableWards.find(w => w.name_with_type === wardNameWithType);
    
    setEditData(prev => ({
      ...prev,
      ward: selectedWard ? selectedWard.name_with_type : wardNameWithType,
    }));
  };

  const handleSave = () => {
    setIsLoading(true);
    // Find the selected province name from the code
    const selectedProvince = provinces.find(p => p.code === selectedProvinceCode);
    const provinceName = selectedProvince ? selectedProvince.name_with_type : editData.province;
    
    setProfileData({
      ...editData,
      province: provinceName
    });
    setIsEditing(false);
    // TODO: Save to backend
    // Simulate async save
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setSelectedProvinceCode('');
    setAvailableWards([]);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      // TODO: Implement delete account functionality
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
    // TODO: Implement password change API call
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
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 2MB');
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file định dạng JPEG, JPG, PNG, GIF');
        return;
      }

      setSelectedAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSave = () => {
    if (selectedAvatar) {
      // TODO: Implement avatar upload API call
      console.log('Uploading avatar...', selectedAvatar);
      setIsLoading(true);
      // Update the picture in profileData with the preview URL
      const updatedProfileData = {
        ...profileData,
        picture: avatarPreview
      };
      setProfileData(updatedProfileData);
      setEditData(updatedProfileData);
      
      alert('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => {
        setIsLoading(false);
        closePopup();
      }, 400);
    }
  };

  const handleAvatarRemove = () => {
    // TODO: Implement avatar removal API call
    console.log('Removing avatar...');
    alert('Xóa ảnh đại diện thành công!');
    closePopup();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TÀI KHOẢN CỦA TÔI
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-12">
            <button
              onClick={() => handleTabChange('personal')}
              className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${
                activeTab === 'personal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              THÔNG TIN CƠ BẢN
            </button>
            <button
              onClick={() => handleTabChange('family')}
              className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${
                activeTab === 'family'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              GIA PHẢ
            </button>
            <button
              onClick={() => handleTabChange('activities')}
              className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${
                activeTab === 'activities'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              HOẠT ĐỘNG GẦN ĐÂY
            </button>
          </nav>
        </div>

        {/* Personal Info Tab Content */}
        {activeTab === 'personal' && (
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
                        src={profileData.picture || defaultPicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
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
                        name="fullName"
                        value={
                          isEditing ? editData.fullName : profileData.fullName
                        }
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
                        value={isEditing ? editData.email : profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
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
                        value={
                          isEditing ? editData.nickname : profileData.nickname
                        }
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
                        name="phone"
                        value={isEditing ? editData.phone : profileData.phone}
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
                        name="occupation"
                        value={
                          isEditing
                            ? editData.occupation
                            : profileData.occupation
                        }
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
                          value={editData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={profileData.gender}
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
                        name="birthDate"
                        value={
                          isEditing 
                            ? formatDateForInput(editData.birthDate) 
                            : profileData.birthDate
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
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name_with_type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={profileData.province}
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
                          value={editData.ward}
                          onChange={handleWardChange}
                          disabled={isLoadingLocation || !selectedProvinceCode}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">
                            {!selectedProvinceCode ? "Chọn tỉnh/thành phố trước" : "Chọn quận/huyện"}
                          </option>
                          {availableWards.map((ward) => (
                            <option key={ward.code} value={ward.name_with_type}>
                              {ward.name_with_type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={profileData.ward}
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
                        value={
                          isEditing ? editData.address : profileData.address
                        }
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
                          // Find and set the current province code when starting to edit
                          const currentProvince = provinces.find(p => 
                            p.name_with_type === profileData.province ||
                            p.name === profileData.province ||
                            p.name_with_type.includes(profileData.province) ||
                            profileData.province.includes(p.name)
                          );
                          if (currentProvince) {
                            setSelectedProvinceCode(currentProvince.code);
                            // Load wards for the current province
                            const provinceWards = wards.filter(ward => 
                              ward.parent_code === currentProvince.code
                            );
                            setAvailableWards(provinceWards);
                            
                            // Find and set the current ward in the correct format
                            const currentWard = provinceWards.find(ward => 
                              ward.name === profileData.ward || 
                              ward.name_with_type === profileData.ward ||
                              ward.name_with_type.includes(profileData.ward) ||
                              profileData.ward.includes(ward.name)
                            );
                            if (currentWard) {
                              setEditData(prev => ({
                                ...prev,
                                ward: currentWard.name_with_type
                              }));
                            }
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
        )}

        {/* Popup Modal */}
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              
              {/* Avatar Change Popup */}
              {popupType === 'change-avatar' && (
                <>
                  {/* Header */}
                  <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                    <h2 className="text-xl font-bold text-center">THAY ĐỔI ẢNH ĐẠI DIỆN</h2>
                  </div>

                  {/* Content */}
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

                    {/* File Upload Area */}
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
                              <p className="text-sm text-gray-600">Nhấn để chọn ảnh khác</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center">
                                 <img src={uploadImg} alt="Upload" className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <p className="text-gray-600 font-medium mb-1">Kéo thả ảnh vào đây</p>
                                <p className="text-gray-500 text-sm">hoặc nhấn để chọn ảnh</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                          className="flex-1 flex items-center justify-center space-x-1 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="font-medium">Chọn ảnh đại diện</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  {/* Header */}
                  <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                    <h2 className="text-xl font-bold text-center">
                      Thay đổi mật khẩu
                    </h2>
                    <p className="text-blue-100 text-sm text-center mt-2">
                      Việc thay đổi mật khẩu yêu cầu bạn phải đăng xuất và đăng nhập
                      lại.
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Current Password */}
                      <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        ref={currentPasswordRef}
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          showPassword(currentPasswordRef);
                          setPasswordToggle(prev => !prev);
                        }}
                        aria-label={currentPasswordRef.current?.type === 'password' ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {currentPasswordRef.current?.type === 'password' ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        ref={newPasswordRef}
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          showPassword(newPasswordRef);
                          setPasswordToggle(prev => !prev);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={newPasswordRef.current?.type === 'password' ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                      >
                        {newPasswordRef.current?.type === 'password' ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Xác nhận Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        ref={confirmPasswordRef}
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          showPassword(confirmPasswordRef);
                          setPasswordToggle(prev => !prev);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={confirmPasswordRef.current?.type === 'password' ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                      >
                        {confirmPasswordRef.current?.type === 'password' ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
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

        {/* Other Tab Contents */}
        {activeTab === 'family' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-8">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Thông tin gia phả
                </h3>
                <p className="text-gray-500">Chức năng đang được phát triển</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-8">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Hoạt động gần đây
                </h3>
                <p className="text-gray-500">Chức năng đang được phát triển</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
