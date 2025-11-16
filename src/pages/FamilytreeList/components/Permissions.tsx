import { useEffect, useState } from "react";
import { Search, Trash2, Edit2, Save, X as XIcon, Plus, Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import { useAppSelector } from "@/hooks/redux";
import type { FTAuth, FTAuthList } from "@/types/familytree";
import ftauthorizationService from "@/services/familyTreeAuth";
import ConfirmModal from "@/components/ui/ConfirmModal";
import AddMemberModal from "./AddMemberModal";
import { toast } from "react-toastify";
import { getUserIdFromToken } from "@/utils/jwtUtils";

const ManagePermissions: React.FC = () => {
  const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  const auth = useAppSelector(state => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [paginationData, setPaginationData] = useState<PaginationProps>({
    pageIndex: 1,
    pageSize: 10,
    propertyFilters: [
      {
        name: "FtId",
        operation: "EQUAL",
        value: selectedFamilyTree ? selectedFamilyTree.id : ''
      },
      {
        name: "AuthorizedMember.UserId",
        operation: "NOTEQUAL",
        value: null
      },
      {
        name: "AuthorizedMember.UserId",
        operation: "NOTEQUAL",
        value: getUserIdFromToken(auth.token || '') || ''
      }
    ],
    totalItems: 0,
    totalPages: 0,
  });
  const [authList, setAuthList] = useState<FTAuthList | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAuthList, setEditedAuthList] = useState<FTAuthList | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });

  const methodsConfig = [
    { label: "Truy cập Đọc", value: "VIEW" },
    { label: "Quyền Ghi / Sửa", value: "UPDATE" },
    { label: "Quyền Tạo", value: "ADD" },
    { label: "Quyền Xóa", value: "DELETE" }
  ];

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await ftauthorizationService.getFTAuths(selectedFamilyTree?.id, paginationData);
      setPaginationData(pre => ({
        ...pre,
        ...res.data
      }));
      setAuthList(res.data.data[0] || null);
      setEditedAuthList(res.data.data[0] || null);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFamilyTree?.id) {
      loadPermissions();
    }
  }, [paginationData.pageIndex, selectedFamilyTree?.id]);

  const executeTogglePermission = async (memberIndex: number, featureIndex: number, methodValue: string) => {
    if (!authList) return;

    const updatedAuthList = deepCopyAuthList(authList);
    const member = updatedAuthList.datalist[memberIndex];
    if (!member) return;

    const feature = member.value[featureIndex];
    if (!feature) return;

    const methodIndex = feature.methodsList.indexOf(methodValue);
    if (methodIndex > -1) {
      feature.methodsList = feature.methodsList.filter(m => m !== methodValue);
    } else {
      feature.methodsList.push(methodValue);
    }

    setAuthList(updatedAuthList);

    try {
      const updatePayload: FTAuth = {
        ftId: authList.ftId,
        ftMemberId: member.key.id,
        authorizationList: member.value
      };
      console.log("Calling updateFTAuth with payload:", updatePayload);
      const response = await ftauthorizationService.updateFTAuth(updatePayload);
      console.log("API call successful, response:", response.data);

      // Update the state with the response data
      if (response.data) {
        const updatedMemberData = response.data;
        setAuthList(prevAuthList => {
          if (!prevAuthList) return prevAuthList;
          return {
            ...prevAuthList,
            datalist: prevAuthList.datalist.map(m =>
              m.key.id === updatedMemberData.ftMemberId
                ? { ...m, value: updatedMemberData.authorizationList }
                : m
            )
          };
        });
      }
    } catch (error) {
      console.error("Failed to update permission:", error);
      // Revert on error
      loadPermissions();
    }
  };

  // Deep copy helper function
  const deepCopyAuthList = (authList: FTAuthList): FTAuthList => {
    return {
      ...authList,
      datalist: authList.datalist.map(member => ({
        ...member,
        value: member.value.map(feature => ({
          ...feature,
          methodsList: [...feature.methodsList]
        }))
      }))
    };
  };

  // Edit mode handlers
  const handleEditTogglePermission = (memberIndex: number, featureIndex: number, methodValue: string) => {
    if (!editedAuthList) return;

    const updatedAuthList = deepCopyAuthList(editedAuthList);
    const member = updatedAuthList.datalist[memberIndex];
    if (!member) return;

    const feature = member.value[featureIndex];
    if (!feature) return;

    const methodIndex = feature.methodsList.indexOf(methodValue);
    if (methodIndex > -1) {
      feature.methodsList = feature.methodsList.filter(m => m !== methodValue);
    } else {
      feature.methodsList.push(methodValue);
    }

    setEditedAuthList(updatedAuthList);
  };

  const handleSavePermissions = async () => {
    if (!editedAuthList || !authList) return;

    setIsSaving(true);
    try {
      // Collect all changes
      const updates: FTAuth[] = [];

      editedAuthList.datalist.forEach((editedMember, memberIndex) => {
        const originalMember = authList.datalist[memberIndex];
        if (originalMember) {
          // Compare each feature individually to see which ones changed
          let hasChanges = false;
          editedMember.value.forEach((editedFeature, featureIndex) => {
            const originalFeature = originalMember.value[featureIndex];
            if (!originalFeature) {
              hasChanges = true; // New feature
              return;
            }

            const originalMethodsStr = JSON.stringify(originalFeature.methodsList.sort());
            const editedMethodsStr = JSON.stringify(editedFeature.methodsList.sort());
            const featureChanged = originalMethodsStr !== editedMethodsStr;

            if (featureChanged) {
              console.log(`Feature ${editedFeature.featureCode} changed for ${editedMember.key.fullname}`);
              console.log(`  Original methods: ${originalMethodsStr}`);
              console.log(`  Edited methods: ${editedMethodsStr}`);
              hasChanges = true;
            }
          });

          // Also check for deleted features (in original but not in edited)
          const allChangedFeatures = editedMember.value;
          const originalFeatureCount = originalMember.value.length;
          if (editedMember.value.length < originalFeatureCount) {
            console.log(`Features were deleted for ${editedMember.key.fullname}`);
            hasChanges = true;
          }

          if (hasChanges) {
            // Send the COMPLETE authorizationList for this member (not just changed features)
            // This ensures all permissions are preserved, including unchanged ones
            const update: FTAuth = {
              ftId: editedAuthList.ftId,
              ftMemberId: editedMember.key.id,
              authorizationList: allChangedFeatures
            };
            console.log("✓ Detected change for member:", editedMember.key.fullname, "Update:", update);
            updates.push(update);
          }
        }
      });

      // Execute all updates
      if (updates.length > 0) {
        console.log("Saving", updates.length, "permission updates");
        const responses = await Promise.all(updates.map(update => {
          console.log("Calling updateFTAuth with:", update);
          return ftauthorizationService.updateFTAuth(update);
        }));
        console.log("All updates completed successfully, responses:", responses);

        // Update state with all response data
        setAuthList(prevAuthList => {
          if (!prevAuthList) return prevAuthList;

          let updatedAuthList = { ...prevAuthList };
          responses.forEach(response => {
            if (response.data) {
              const updatedMemberData = response.data;
              updatedAuthList = {
                ...updatedAuthList,
                datalist: updatedAuthList.datalist.map(m =>
                  m.key.id === updatedMemberData.ftMemberId
                    ? { ...m, value: updatedMemberData.authorizationList }
                    : m
                )
              };
            }
          });

          return updatedAuthList;
        });
      } else {
        console.log("No changes detected");
      }

      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setConfirmModal({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi lưu thay đổi. Vui lòng thử lại.',
        type: 'danger',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedAuthList(authList);
    setIsEditMode(false);
  };

  const handleTogglePermission = async (memberIndex: number, featureIndex: number, methodValue: string) => {
    if (!authList) return;

    const member = authList.datalist[memberIndex];
    if (!member) return;

    const feature = member.value[featureIndex];
    if (!feature) return;

    const isRemoving = feature.methodsList.includes(methodValue);

    // Show confirmation for removing permissions
    if (isRemoving) {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận thay đổi quyền',
        message: `Bạn có chắc chắn muốn thu hồi quyền "${methodsConfig.find(m => m.value === methodValue)?.label}" của ${member.key.fullname} cho tính năng ${feature.featureCode}?`,
        type: 'warning',
        onConfirm: () => {
          executeTogglePermission(memberIndex, featureIndex, methodValue);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      // Directly add permission without confirmation
      executeTogglePermission(memberIndex, featureIndex, methodValue);
    }
  };

  const handleDeleteAuth = async (memberIndex: number) => {
    if (!authList) return;

    const member = authList.datalist[memberIndex];
    if (!member) return;

    setConfirmModal({
      isOpen: true,
      title: 'Xóa quyền truy cập',
      message: `Bạn có chắc chắn muốn xóa tất cả quyền của ${member.key.fullname}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await ftauthorizationService.deleteFTAuth(authList.ftId, member.key.id);
          console.log(response);

          toast.success('Xóa quyền truy cập thành công');
          // Update state - remove the member if all permissions are deleted
          setAuthList(prevAuthList => {
            if (!prevAuthList) return prevAuthList;
            return {
              ...prevAuthList,
              datalist: prevAuthList.datalist.filter(m => m.key.id !== member.key.id)
            };
          });

          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Failed to delete permission:", error);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleAddMember = async (memberId: string, memberFullname: string, featureCode: string, methodsList: string[]) => {
    if (!selectedFamilyTree?.id) return;

    try {
      // Create permissions with the selected feature code and methods
      const newAuth: FTAuth = {
        ftId: selectedFamilyTree.id,
        ftMemberId: memberId,
        authorizationList: [
          {
            featureCode: featureCode,
            methodsList: methodsList
          }
        ]
      };

      console.log("Adding new member with auth:", newAuth);
      const response = await ftauthorizationService.addFTAuth(newAuth);
      console.log("Member added successfully, response:", response.data);

      // Update state with the new member data
      if (response.data) {
        const newMemberAuth = response.data;
        setAuthList(prevAuthList => {
          if (!prevAuthList) {
            return {
              ftId: selectedFamilyTree.id,
              datalist: [
                {
                  key: {
                    id: newMemberAuth.ftMemberId,
                    fullname: memberFullname || 'Thành viên mới',
                    avatar: null
                  },
                  value: newMemberAuth.authorizationList
                }
              ]
            };
          }

          // Check if member already exists and update, or add new
          const memberExists = prevAuthList.datalist.some(m => m.key.id === newMemberAuth.ftMemberId);

          if (memberExists) {
            // Update existing member's permissions
            return {
              ...prevAuthList,
              datalist: prevAuthList.datalist.map(m =>
                m.key.id === newMemberAuth.ftMemberId
                  ? { ...m, value: newMemberAuth.authorizationList }
                  : m
              )
            };
          } else {
            // Add new member locally using provided fullname and API authorization list
            return {
              ...prevAuthList,
              datalist: [
                ...prevAuthList.datalist,
                {
                  key: {
                    id: newMemberAuth.ftMemberId,
                    fullname: memberFullname || 'Thành viên mới'
                  },
                  value: newMemberAuth.authorizationList
                }
              ]
            };
          }
        });
      }

      setShowAddMemberModal(false);
    } catch (error) {
      console.error("Failed to add member:", error);
      throw error;
    }
  };

  const filteredDatalist = authList?.datalist?.filter(item =>
    searchTerm === "" || item.key.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayDatalist = isEditMode
    ? editedAuthList?.datalist || []
    : filteredDatalist;

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-50">
      {/* Header with Search and Actions */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={isEditMode}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            {!isEditMode ? (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setEditedAuthList(authList);
                  }}
                  disabled={!authList || authList?.datalist?.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                  <span>Hủy</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Permission Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-gray-200">
                  Tên
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-gray-200">
                  Mô hình
                </th>
                {methodsConfig.map(method => (
                  <th key={method.value} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-r border-gray-200">
                    {method.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {displayDatalist.map((member, memberIndex) => {
                const featureCount = member.value.length;
                return member.value.map((feature, featureIndex) => (
                  <tr key={`${memberIndex}-${featureIndex}`} className={`transition-colors ${isEditMode ? 'bg-blue-50' : 'hover:bg-blue-100'}`}>
                    {featureIndex === 0 && (
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-r border-gray-200" rowSpan={featureCount}>
                        <div className="flex items-center gap-2">
                          {member.key.avatar ? (
                            <img
                              src={member.key.avatar}
                              alt={member.key.fullname}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                              {member.key.fullname?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span>{member.key.fullname}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-r border-gray-200">
                      {feature.featureCode}
                    </td>
                    {methodsConfig.map((method) => {
                      const isChecked = feature.methodsList.includes(method.value);
                      return (
                        <td key={method.value} className="px-4 py-3 text-center border-b border-r border-gray-200">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => isEditMode
                              ? handleEditTogglePermission(memberIndex, featureIndex, method.value)
                              : handleTogglePermission(memberIndex, featureIndex, method.value)
                            }
                            disabled={isEditMode === false}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      );
                    })}
                    {featureIndex === 0 && (
                      <td className="px-4 py-3 text-center border-b border-gray-200" rowSpan={featureCount}>
                        {!isEditMode && (
                          <button
                            onClick={() => handleDeleteAuth(memberIndex)}
                            className="cursor-pointer text-gray-600 hover:text-red-700 active:text-red-900 transition-colors font-medium"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 bg-white border-t border-gray-200">
        <Pagination
          pageIndex={paginationData.pageIndex}
          pageSize={paginationData.pageSize}
          totalItems={paginationData.totalItems}
          totalPages={paginationData.totalPages}
          onPageChange={page => setPaginationData(prev => ({ ...prev, pageIndex: page }))}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type || 'warning'}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModal.type === 'danger' ? 'Xóa' : 'Xác nhận'}
        cancelText="Hủy"
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        ftId={selectedFamilyTree?.id}
        onClose={() => setShowAddMemberModal(false)}
        onConfirm={handleAddMember}
        existingFeaturesByMemberId={
          authList?.datalist.reduce<Record<string, string[]>>((acc, m) => {
            acc[m.key.id] = m.value.map(v => v.featureCode);
            return acc;
          }, {}) || {}
        }
      />
    </div>
  );
};

export default ManagePermissions;