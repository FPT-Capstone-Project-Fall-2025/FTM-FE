import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import honorBoardService, { type HonorData, type CreateHonorData, type UpdateHonorData } from '@/services/honorBoardService';
import familyTreeService from '@/services/familyTreeService';
import { Trophy, GraduationCap, Briefcase, Plus, Edit, Trash2, X, Upload, Award, Calendar, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { Select } from 'antd';

type BoardType = 'academic' | 'career';

const HonorBoard: React.FC = () => {
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  const [activeBoard, setActiveBoard] = useState<BoardType>('academic');
  const [academicHonors, setAcademicHonors] = useState<HonorData[]>([]);
  const [careerHonors, setCareerHonors] = useState<HonorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHonor, setEditingHonor] = useState<HonorData | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    achievementTitle: '',
    organizationName: '',
    position: '',
    yearOfAchievement: new Date().getFullYear(),
    description: '',
    gpMemberId: '',
    isDisplayed: true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fetch members once when component mounts or tree changes
  useEffect(() => {
    if (selectedTree?.id) {
      fetchMembers();
    }
  }, [selectedTree?.id]);

  // Fetch honors when board type changes
  useEffect(() => {
    if (selectedTree?.id) {
      fetchHonors();
    }
  }, [selectedTree?.id, activeBoard]);

  const fetchHonors = async () => {
    if (!selectedTree?.id) return;
    
    setLoading(true);
    try {
      if (activeBoard === 'academic') {
        const response = await honorBoardService.getAcademicHonors(selectedTree.id);
        if (response.data?.data) {
          setAcademicHonors(response.data.data);
        }
      } else {
        const response = await honorBoardService.getCareerHonors(selectedTree.id);
        if (response.data?.data) {
          setCareerHonors(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching honors:', error);
      toast.error('Không thể tải danh sách danh hiệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedTree?.id) {
      setMembers([]);
      return;
    }

    try {
      console.log('📋 Fetching members for family tree:', selectedTree.id);
      
      // Use the member tree API
      const res: any = await familyTreeService.getMemberTree(selectedTree.id);
      
      console.log('📋 Member tree API response:', res);
      
      // Extract member data from the datalist
      const datalist = res?.data?.datalist || [];
      
      // Map the datalist to member options
      const memberOptions = datalist.map((item: any) => ({
        id: item.value.id,
        fullname: item.value.name,
        ftId: selectedTree.id,
      }));
      
      console.log('📋 Mapped members:', memberOptions.length, 'members found');
      setMembers(memberOptions);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error('Không thể tải danh sách thành viên');
      setMembers([]);
    }
  };

  const handleOpenModal = (honor?: HonorData) => {
    if (honor) {
      setEditingHonor(honor);
      setFormData({
        achievementTitle: honor.achievementTitle,
        organizationName: honor.organizationName,
        position: honor.position || '',
        yearOfAchievement: honor.yearOfAchievement,
        description: honor.description || '',
        gpMemberId: honor.gpMemberId,
        isDisplayed: honor.isDisplayed,
      });
      setPhotoPreview(honor.photoUrl);
    } else {
      setEditingHonor(null);
      setFormData({
        achievementTitle: '',
        organizationName: '',
        position: '',
        yearOfAchievement: new Date().getFullYear(),
        description: '',
        gpMemberId: '',
        isDisplayed: true,
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHonor(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTree?.id) {
      toast.error('Không tìm thấy gia phả');
      return;
    }

    if (!formData.achievementTitle || !formData.organizationName || !formData.gpMemberId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (editingHonor) {
        // Update
        const updateData: UpdateHonorData = {
          AchievementTitle: formData.achievementTitle,
          OrganizationName: formData.organizationName,
          Position: formData.position,
          YearOfAchievement: formData.yearOfAchievement,
          Description: formData.description,
          IsDisplayed: formData.isDisplayed,
        };
        
        if (photoFile) {
          updateData.Photo = photoFile;
        }

        if (activeBoard === 'academic') {
          await honorBoardService.updateAcademicHonor(editingHonor.id, updateData);
        } else {
          await honorBoardService.updateCareerHonor(editingHonor.id, updateData);
        }
        
        toast.success('Cập nhật danh hiệu thành công!');
      } else {
        // Create
        const createData: CreateHonorData = {
          AchievementTitle: formData.achievementTitle,
          OrganizationName: formData.organizationName,
          Position: formData.position,
          YearOfAchievement: formData.yearOfAchievement,
          Description: formData.description,
          IsDisplayed: formData.isDisplayed,
          FamilyTreeId: selectedTree.id,
          GPMemberId: formData.gpMemberId,
        };
        
        if (photoFile) {
          createData.Photo = photoFile;
        }

        if (activeBoard === 'academic') {
          await honorBoardService.createAcademicHonor(createData);
        } else {
          await honorBoardService.createCareerHonor(createData);
        }
        
        toast.success('Thêm danh hiệu thành công!');
      }
      
      handleCloseModal();
      fetchHonors();
    } catch (error) {
      console.error('Error saving honor:', error);
      toast.error('Có lỗi xảy ra khi lưu danh hiệu');
    }
  };

  const handleDelete = async (honorId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh hiệu này?')) {
      return;
    }

    try {
      if (activeBoard === 'academic') {
        await honorBoardService.deleteAcademicHonor(honorId);
      } else {
        await honorBoardService.deleteCareerHonor(honorId);
      }
      
      toast.success('Xóa danh hiệu thành công!');
      fetchHonors();
    } catch (error) {
      console.error('Error deleting honor:', error);
      toast.error('Có lỗi xảy ra khi xóa danh hiệu');
    }
  };

  const currentHonors = activeBoard === 'academic' ? academicHonors : careerHonors;
  const sortedHonors = [...currentHonors].sort((a, b) => b.yearOfAchievement - a.yearOfAchievement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">Bảng Vinh Danh Gia Phả</h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm danh hiệu
        </button>
      </div>

      {/* Board Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => setActiveBoard('academic')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
            activeBoard === 'academic'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Bảng Vinh Danh Học Tập
        </button>
        <button
          onClick={() => setActiveBoard('career')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
            activeBoard === 'career'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Bảng Vinh Danh Sự Nghiệp
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng danh hiệu</p>
              <p className="text-3xl font-bold text-gray-900">{currentHonors.length}</p>
            </div>
            <Award className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hiển thị công khai</p>
              <p className="text-3xl font-bold text-gray-900">
                {currentHonors.filter(h => h.isDisplayed).length}
              </p>
            </div>
            <Trophy className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Năm gần nhất</p>
              <p className="text-3xl font-bold text-gray-900">
                {sortedHonors.length > 0 ? sortedHonors[0].yearOfAchievement : '-'}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Honor List - Leaderboard Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Bảng Xếp Hạng
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        ) : sortedHonors.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có danh hiệu nào</p>
            <p className="text-sm text-gray-400 mt-1">Hãy thêm danh hiệu đầu tiên!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedHonors.map((honor, index) => {
              const rankColors = [
                'from-yellow-400 to-yellow-600', // 1st - Gold
                'from-gray-300 to-gray-500', // 2nd - Silver
                'from-orange-400 to-orange-600', // 3rd - Bronze
              ];
              const isTopThree = index < 3;
              
              return (
                <div
                  key={honor.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !honor.isDisplayed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {isTopThree ? (
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankColors[index]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                        >
                          {index + 1}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Member Photo */}
                    <img
                      src={honor.memberPhotoUrl || defaultPicture}
                      alt={honor.memberFullName}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultPicture;
                      }}
                    />

                    {/* Honor Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {honor.memberFullName}
                          </h4>
                          <p className="text-blue-600 font-semibold text-lg mt-1">
                            {honor.achievementTitle}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>{honor.organizationName}</span>
                            </div>
                            {honor.position && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{honor.position}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Năm {honor.yearOfAchievement}</span>
                            </div>
                          </div>
                          {honor.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {honor.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(honor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(honor.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Certificate Photo */}
                      {honor.photoUrl && (
                        <div className="mt-4">
                          <img
                            src={honor.photoUrl}
                            alt="Giấy chứng nhận"
                            className="max-w-md rounded-lg border-2 border-gray-200 shadow-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingHonor ? 'Chỉnh sửa danh hiệu' : 'Thêm danh hiệu mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thành viên <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.gpMemberId || undefined}
                  onChange={(value) => setFormData({ ...formData, gpMemberId: value })}
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Tìm kiếm và chọn thành viên..."
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={members.map(member => ({
                    label: member.fullname,
                    value: member.id,
                  }))}
                  disabled={members.length === 0}
                  notFoundContent={members.length === 0 ? "Đang tải danh sách thành viên..." : "Không tìm thấy thành viên"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {members.length > 0 
                    ? `Tìm kiếm trong ${members.length} thành viên` 
                    : 'Đang tải danh sách thành viên...'}
                </p>
              </div>

              {/* Achievement Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên danh hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.achievementTitle}
                  onChange={(e) => setFormData({ ...formData, achievementTitle: e.target.value })}
                  placeholder="VD: Thủ khoa đại học, Giám đốc điều hành..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tổ chức/Trường học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="VD: Đại học Bách Khoa, Công ty ABC..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Position (for Career) */}
              {activeBoard === 'career' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="VD: Giám đốc, Trưởng phòng..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Năm đạt được <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.yearOfAchievement}
                  onChange={(e) => setFormData({ ...formData, yearOfAchievement: parseInt(e.target.value) })}
                  min="1900"
                  max={new Date().getFullYear() + 10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về thành tích..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-w-full max-h-64 rounded-lg mb-2"
                      />
                    ) : (
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {photoPreview ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Is Displayed */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDisplayed"
                  checked={formData.isDisplayed}
                  onChange={(e) => setFormData({ ...formData, isDisplayed: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDisplayed" className="text-sm font-medium text-gray-700">
                  Hiển thị công khai
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingHonor ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HonorBoard;
