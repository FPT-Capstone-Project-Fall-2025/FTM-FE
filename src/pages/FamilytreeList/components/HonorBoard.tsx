import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import honorBoardService, { type HonorData, type CreateHonorData, type UpdateHonorData } from '@/services/honorBoardService';
import familyTreeService from '@/services/familyTreeService';
import { Trophy, GraduationCap, Briefcase, Plus, Edit, Trash2, X, Upload, Award, Medal } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [honorToDelete, setHonorToDelete] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHonor, setSelectedHonor] = useState<HonorData | null>(null);

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

  // Fetch all data when component mounts or tree changes
  useEffect(() => {
    if (selectedTree?.id) {
      fetchAllData();
    }
  }, [selectedTree?.id]);

  const fetchAllData = async () => {
    if (!selectedTree?.id) return;

    setLoading(true);
    try {
      // Fetch both academic and career honors in parallel
      const [academicResponse, careerResponse, membersResponse] = await Promise.all([
        honorBoardService.getAcademicHonors(selectedTree.id),
        honorBoardService.getCareerHonors(selectedTree.id),
        familyTreeService.getMemberTree(selectedTree.id)
      ]);

      // Set academic honors
      if (academicResponse.data?.data) {
        setAcademicHonors(academicResponse.data.data);
      }

      // Set career honors
      if (careerResponse.data?.data) {
        setCareerHonors(careerResponse.data.data);
      }

      // Set members
      const datalist = membersResponse?.data?.datalist || [];
      const memberOptions = datalist.map((item: any) => ({
        id: item.value.id,
        fullname: item.value.name,
        ftId: selectedTree.id,
      }));
      setMembers(memberOptions);

      console.log('✅ Loaded all honor board data:', {
        academic: academicResponse.data?.data?.length || 0,
        career: careerResponse.data?.data?.length || 0,
        members: memberOptions.length
      });
    } catch (error) {
      console.error('Error fetching honor board data:', error);
      toast.error('Không thể tải dữ liệu bảng vinh danh');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (honor?: HonorData) => {
    if (honor) {
      setEditingHonor(honor);
      // Map fields based on honor type (academic vs career)
      const organizationName = honor.organizationName || honor.institutionName || '';
      const position = honor.position || honor.degreeOrCertificate || '';
      
      setFormData({
        achievementTitle: honor.achievementTitle,
        organizationName: organizationName,
        position: position,
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
    if (isSubmitting) {
      return; // Prevent closing while submitting
    }
    setShowModal(false);
    setEditingHonor(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsSubmitting(false);
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

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    if (!selectedTree?.id) {
      toast.error('Không tìm thấy gia phả');
      return;
    }

    if (!formData.achievementTitle || !formData.organizationName || !formData.gpMemberId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate year is not in the future
    const currentYear = new Date().getFullYear();
    if (formData.yearOfAchievement > currentYear) {
      toast.error(`Năm đạt được không thể lớn hơn năm hiện tại (${currentYear})`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingHonor) {
        // Update - use OrganizationName and Position as unified interface
        // Service will map to correct field names for each type
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

        toast.success('Thêm lịch sử thành tích thành công!');
      }

      handleCloseModal();
      // Refresh all honors data to update statistics
      fetchAllData();
    } catch (error) {
      console.error('Error saving honor:', error);
      toast.error('Có lỗi xảy ra khi lưu danh hiệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (honorId: string) => {
    setHonorToDelete(honorId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!honorToDelete) return;

    try {
      if (activeBoard === 'academic') {
        await honorBoardService.deleteAcademicHonor(honorToDelete);
      } else {
        await honorBoardService.deleteCareerHonor(honorToDelete);
      }

      toast.success('Xóa danh hiệu thành công!');
      setShowDeleteConfirm(false);
      setHonorToDelete(null);
      // Refresh all honors data to update statistics
      fetchAllData();
    } catch (error) {
      console.error('Error deleting honor:', error);
      toast.error('Có lỗi xảy ra khi xóa danh hiệu');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setHonorToDelete(null);
  };

  const handleViewDetail = (honor: HonorData) => {
    setSelectedHonor(honor);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedHonor(null);
  };

  const currentHonors = activeBoard === 'academic' ? academicHonors : careerHonors;
  const sortedHonors = [...currentHonors].sort((a, b) => b.yearOfAchievement - a.yearOfAchievement);

  return (
    <div className="h-full flex flex-col">
      {/* Main Layout: Left Sidebar | Content | Right Sidebar */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Thành Tích Gia Tộc
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveBoard('academic')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all ${activeBoard === 'academic'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:bg-gray-100 hover:scale-[1.01]'
                    }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold">Học Tập</div>
                    <div className="text-xs opacity-80">
                      {academicHonors.length} danh hiệu
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveBoard('career')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all ${activeBoard === 'career'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:bg-gray-100 hover:scale-[1.01]'
                    }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold">Sự Nghiệp</div>
                    <div className="text-xs opacity-80">
                      {careerHonors.length} danh hiệu
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Content - Scrollable Honor List */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Cột mốc thành tích - {activeBoard === 'academic' ? 'Học Tập' : 'Sự Nghiệp'}
                </h3>
                
                {/* Add Button - Show only for active tab */}
                {activeBoard === 'academic' ? (
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm thành tích học tập
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm thành tích sự nghiệp
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Timeline Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Đang tải...</p>
                </div>
              ) : sortedHonors.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có danh hiệu nào</p>
                  <p className="text-sm text-gray-400 mt-1">Hãy thêm lịch sử thành tích đầu tiên!</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[10px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>
                  
                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {(() => {
                      // Group honors by year
                      const groupedByYear = sortedHonors.reduce((acc, honor) => {
                        const year = honor.yearOfAchievement;
                        if (!acc[year]) {
                          acc[year] = [];
                        }
                        acc[year].push(honor);
                        return acc;
                      }, {} as Record<number, typeof sortedHonors>);

                      // Get sorted years
                      const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

                      return years.map((year) => (
                        <div key={year} className="relative">
                          {/* Year Badge - Only once per year */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex flex-col items-center flex-shrink-0 z-10">
                              <div className="px-3 py-1 rounded-full text-sm font-bold text-white shadow-md bg-gradient-to-r from-blue-500 to-purple-500">
                                {year}
                              </div>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                          </div>

                          {/* Cards for this year */}
                          <div className="space-y-3 ml-8">
                            {(groupedByYear[year] || []).map((honor) => (
                              <div key={honor.id} className={`transition-all duration-300 ${!honor.isDisplayed ? 'opacity-60' : ''}`}>
                            <div 
                              onClick={() => handleViewDetail(honor)}
                              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 overflow-hidden group cursor-pointer"
                            >
                              <div className="p-3">
                                <div className="flex items-center gap-3">
                                  {/* Member Photo */}
                                  <img
                                    src={honor.memberPhotoUrl || defaultPicture}
                                    alt={honor.memberFullName}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = defaultPicture;
                                    }}
                                  />

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate mb-1">
                                          {honor.memberFullName}
                                        </h4>
                                        
                                        {/* Achievement Description */}
                                        <p className="text-xs text-gray-700 mb-1 leading-relaxed">
                                          Đã đạt được <span className="font-bold text-blue-600">{honor.achievementTitle}</span> tại{' '}
                                          <span className="font-bold text-gray-900">
                                            {honor.organizationName || honor.institutionName}
                                          </span>
                                          {(honor.position || honor.degreeOrCertificate) && (
                                            <>
                                              {' '}với <span className="font-bold text-green-600">
                                                {honor.position || honor.degreeOrCertificate}
                                              </span>
                                            </>
                                          )}
                                        </p>
                                      </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(honor);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(honor.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Certificate Photo with Description */}
                                {(honor.photoUrl || honor.description) && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex gap-3 items-start">
                                      {/* Certificate Photo */}
                                      {honor.photoUrl && (
                                        <img
                                          src={honor.photoUrl}
                                          alt="Giấy chứng nhận"
                                          className="w-24 h-16 object-cover rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            honor.photoUrl && window.open(honor.photoUrl, '_blank');
                                          }}
                                        />
                                      )}
                                      
                                      {/* Description */}
                                      {honor.description && (
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-gray-600 line-clamp-2" title={honor.description}>
                                            {honor.description}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Statistics */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white flex-shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Tích Luỹ Thành Tích
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Overall Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 border border-indigo-200">
                <p className="text-xs text-indigo-700 font-medium mb-2">Tổng thành tích gia tộc</p>
                <p className="text-4xl font-bold text-indigo-900">
                  {academicHonors.length + careerHonors.length}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>{academicHonors.length} học tập</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{careerHonors.length} sự nghiệp</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-lg p-3 border-2 transition-all ${
                  activeBoard === 'academic' 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <GraduationCap className="w-5 h-5 text-blue-600 mb-1" />
                  <p className="text-xs text-gray-600">Học tập</p>
                  <p className="text-2xl font-bold text-blue-900">{academicHonors.length}</p>
                </div>
                <div className={`rounded-lg p-3 border-2 transition-all ${
                  activeBoard === 'career' 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <Briefcase className="w-5 h-5 text-green-600 mb-1" />
                  <p className="text-xs text-gray-600">Sự nghiệp</p>
                  <p className="text-2xl font-bold text-green-900">{careerHonors.length}</p>
                </div>
              </div>

              {/* Current Board Stats */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {activeBoard === 'academic' ? 'Học tập' : 'Sự nghiệp'}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tổng số:</span>
                    <span className="font-bold text-gray-900">{currentHonors.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Công khai:</span>
                    <span className="font-bold text-green-600">
                      {currentHonors.filter(h => h.isDisplayed).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Năm gần nhất:</span>
                    <span className="font-bold text-blue-600">
                      {sortedHonors.length > 0 && sortedHonors[0] ? sortedHonors[0].yearOfAchievement : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 3 Contributors */}
              {(() => {
                // Calculate total achievements per member
                const allHonors = [...academicHonors, ...careerHonors];
                const memberStats = allHonors.reduce((acc, honor) => {
                  const key = honor.gpMemberId;
                  if (!acc[key]) {
                    acc[key] = {
                      gpMemberId: honor.gpMemberId,
                      memberFullName: honor.memberFullName,
                      memberPhotoUrl: honor.memberPhotoUrl,
                      totalCount: 0,
                      academicCount: 0,
                      careerCount: 0,
                    };
                  }
                  acc[key].totalCount++;
                  if (honor.organizationName) {
                    acc[key].careerCount++;
                  } else {
                    acc[key].academicCount++;
                  }
                  return acc;
                }, {} as Record<string, {
                  gpMemberId: string;
                  memberFullName: string;
                  memberPhotoUrl: string;
                  totalCount: number;
                  academicCount: number;
                  careerCount: number;
                }>);

                const topContributors = Object.values(memberStats)
                  .sort((a, b) => b.totalCount - a.totalCount)
                  .slice(0, 3);

                return topContributors.length > 0 ? (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                    <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-600" />
                      Đóng góp nhiều nhất
                    </h4>
                    <div className="space-y-2">
                      {topContributors.map((contributor, idx) => (
                        <div key={contributor.gpMemberId} className="flex items-center gap-2 p-1.5 bg-white rounded">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            idx === 0 ? 'bg-yellow-400 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            'bg-orange-400 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <img
                            src={contributor.memberPhotoUrl || defaultPicture}
                            alt={contributor.memberFullName}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultPicture;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                              {contributor.memberFullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate leading-tight">
                              {contributor.totalCount} thành tích ({contributor.academicCount} Học tập, {contributor.careerCount} Sự nghiệp)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingHonor ? 'Chỉnh sửa danh hiệu' : 'Thêm lịch sử thành tích mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thành viên gia tộc<span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.gpMemberId || null}
                  onChange={(value: string) => setFormData({ ...formData, gpMemberId: value })}
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
                  disabled={members.length === 0 || editingHonor !== null}
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

              {/* Organization/Institution */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {activeBoard === 'academic' ? 'Trường học / Học viện' : 'Tổ chức / Công ty'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder={activeBoard === 'academic' ? 'VD: Đại học Bách Khoa, Học viện Công nghệ...' : 'VD: Công ty ABC, Tập đoàn XYZ...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Position/Degree Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {activeBoard === 'academic' ? 'Bằng cấp / Chứng chỉ' : 'Vị trí'}
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder={activeBoard === 'academic' ? 'VD: Thạc sĩ, Tiến sĩ, Cử nhân...' : 'VD: Giám đốc, Trưởng phòng...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Không thể chọn năm lớn hơn năm hiện tại ({new Date().getFullYear()})
                </p>
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

              {/* Is Displayed - Switch Button */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="isDisplayed" className="text-sm font-semibold text-gray-700">
                    Hiển thị công khai
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Cho phép hiển thị thành tích này trên bảng vinh danh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isDisplayed: !formData.isDisplayed })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.isDisplayed ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isDisplayed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>{editingHonor ? 'Cập nhật' : 'Thêm mới'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn xóa danh hiệu này? Tất cả thông tin liên quan sẽ bị xóa vĩnh viễn.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedHonor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <h3 className="text-xl font-bold">Chi tiết thành tích</h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Member Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={selectedHonor.memberPhotoUrl || defaultPicture}
                  alt={selectedHonor.memberFullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultPicture;
                  }}
                />
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedHonor.memberFullName}</h4>
                  <p className="text-gray-600 mt-1">Thành viên gia phả</p>
                </div>
              </div>

              {/* Achievement Details */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wide">Thành tích</h5>
                  <p className="text-lg font-bold text-gray-900">{selectedHonor.achievementTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      {selectedHonor.organizationName ? 'Tổ chức' : 'Cơ sở giáo dục'}
                    </h5>
                    <p className="text-base font-bold text-gray-900">
                      {selectedHonor.organizationName || selectedHonor.institutionName}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      {selectedHonor.position ? 'Vị trí' : 'Bằng cấp/Chứng chỉ'}
                    </h5>
                    <p className="text-base font-bold text-gray-900">
                      {selectedHonor.position || selectedHonor.degreeOrCertificate}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Năm đạt được</h5>
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-yellow-500" />
                    <p className="text-lg font-bold text-gray-900">{selectedHonor.yearOfAchievement}</p>
                  </div>
                </div>

                {selectedHonor.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Mô tả</h5>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedHonor.description}</p>
                  </div>
                )}

                {selectedHonor.photoUrl && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Giấy chứng nhận</h5>
                    <img
                      src={selectedHonor.photoUrl}
                      alt="Giấy chứng nhận"
                      className="w-full rounded-lg border border-gray-200 shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => selectedHonor.photoUrl && window.open(selectedHonor.photoUrl, '_blank')}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Trạng thái hiển thị</h5>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedHonor.isDisplayed 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedHonor.isDisplayed ? 'Đang hiển thị' : 'Đã ẩn'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleCloseDetail();
                    handleOpenModal(selectedHonor);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HonorBoard;
