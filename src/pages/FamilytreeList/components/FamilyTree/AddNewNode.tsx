import familyTreeService from "@/services/familyTreeService";
import { CategoryCode, type AddingNodeProps, type FamilyNode } from "@/types/familytree";
import { X, Users, User, Baby } from "lucide-react";
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

interface AddNewNodeProps {
  ftId: string;
  parentMember?: FamilyMember | null;
  existingRelationships?: string[];
  isFirstNode?: boolean;
  onClose?: () => void;
  onSelectType?: (formData?: any) => Promise<void>;
}

// Define all possible relationships with icons and details
const allRelationships = [
  {
    id: "father",
    code: CategoryCode.Parent,
    label: "THÊM CHA",
    icon: Users,
    row: 0,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "mother",
    code: CategoryCode.Parent,
    label: "THÊM MẸ",
    icon: Users,
    row: 0,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "spouse",
    code: CategoryCode.Spouse,
    label: "THÊM VỢ/CHỒNG",
    icon: Users,
    row: 1,
    color: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
  },
  {
    id: "sibling-brother",
    code: CategoryCode.Sibling,
    label: "THÊM ANH/EM TRAI",
    icon: User,
    row: 1,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "sibling-sister",
    code: CategoryCode.Sibling,
    label: "THÊM CHỊ/EM GÁI",
    icon: User,
    row: 1,
    color: "bg-pink-100",
    textColor: "text-pink-600",
    borderColor: "border-pink-300",
  },
  {
    id: "child-son",
    code: CategoryCode.Child,
    label: "THÊM CON TRAI",
    icon: Baby,
    row: 2,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "child-daughter",
    code: CategoryCode.Child,
    label: "THÊM CON GÁI",
    icon: Baby,
    row: 2,
    color: "bg-pink-100",
    textColor: "text-pink-600",
    borderColor: "border-pink-300",
  },
];

// Sample options for select fields (you can expand these as needed)
const selectOptions = {
  WardId: ["Ward 1", "Ward 2", "Ward 3"],
  ProvinceId: ["Province A", "Province B", "Province C"],
  EthnicId: ["Kinh", "Tày", "Thái"],
  ReligionId: ["Buddhism", "Christianity", "None"],
  IdentificationType: ["CMND", "CCCD", "Passport"],
};

const AddNewNode = ({
  ftId,
  parentMember = null,
  existingRelationships = [],
  isFirstNode = false,
  onClose,
  onSelectType,
}: AddNewNodeProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showExtendedForm, setShowExtendedForm] = useState(false);
  const [partnerMembers] = useState<FamilyNode[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<AddingNodeProps>({
    fullname: "",
    gender: 0 as 0 | 1,
    birthday: "",
    birthplace: "",
    isDeath: false,
    deathDescription: "",
    deathDate: "",
    burialAddress: "",
    burialWardId: undefined,
    burialProvinceId: undefined,
    identificationType: "",
    identificationNumber: undefined,
    ethnicId: undefined,
    religionId: undefined,
    categoryCode: isFirstNode ? CategoryCode.FirstNode : undefined,
    address: "",
    wardId: undefined,
    provinceId: undefined,
    email: "",
    phoneNumber: "",
    content: "",
    storyDescription: "",
    ftId: "",
    rootId: parentMember?.id || "",
    fromFTMemberId: parentMember?.id,
    fromFTMemberPartnerId: undefined,
    ftMemberFiles: [],
  });

  // Filter out existing relationships
  const availableRelationships = allRelationships.filter(
    (rel) => !existingRelationships.includes(rel.id)
  );

  // Group by row
  const rowGroups = useMemo(() => {
    const groups: { [key: number]: typeof availableRelationships } = {};
    availableRelationships.forEach((rel) => {
      if (!groups[rel.row]) {
        groups[rel.row] = [];
      }
      groups[rel.row]?.push(rel);
    });
    return groups;
  }, [availableRelationships]);

  const createNodePosition = (
    row: number,
    indexInRow: number,
    totalInRow: number
  ) => {
    const horizontalSpacing = 180;
    const verticalSpacing = 150;

    const y = row * verticalSpacing;
    const totalWidth = (totalInRow - 1) * horizontalSpacing;
    const x = indexInRow * horizontalSpacing - totalWidth / 2;

    return { x, y };
  };

  const initialNodes: Node[] = useMemo(() => {
    if (isFirstNode || !parentMember) {
      return [];
    }

    return [
      {
        id: parentMember.id,
        data: {
          label: (
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {parentMember.name}
              </div>
              <div className="text-xs text-gray-600">{parentMember.birthday}</div>
            </div>
          ),
        },
        position: { x: 0, y: 150 },
        style: {
          background: "white",
          border: "2px solid #d1d5db",
          borderRadius: "8px",
          padding: "12px",
          minWidth: "140px",
          fontSize: "12px",
          zIndex: 100,
        },
      },
      ...availableRelationships.map((rel) => {
        const sameRowCount = rowGroups[rel.row]!.length;
        const sameRowIndex = rowGroups[rel.row]!.findIndex((r) => r.id === rel.id);
        const pos = createNodePosition(rel.row, sameRowIndex, sameRowCount);
        const IconComponent = rel.icon;

        return {
          id: rel.id,
          data: {
            label: (
              <div className="flex flex-col items-center gap-1">
                <IconComponent className="w-5 h-5" />
                <span>{rel.label}</span>
              </div>
            ),
          },
          position: pos,
          style: {
            background: rel.color,
            border: `2px solid`,
            borderColor: rel.borderColor.replace("border-", ""),
            borderRadius: "8px",
            padding: "8px",
            minWidth: "140px",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: "bold",
            color: rel.textColor.replace("text-", ""),
            textAlign: "center" as const,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        };
      }),
    ];
  }, [parentMember, availableRelationships, rowGroups, isFirstNode]);

  const initialEdges: Edge[] = useMemo(() => {
    if (isFirstNode || !parentMember) {
      return [];
    }

    return availableRelationships.map((rel) => ({
      id: `${parentMember.id}-${rel.id}`,
      source: parentMember.id,
      target: rel.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6b7280", strokeWidth: 2 },
    }));
  }, [parentMember, availableRelationships, isFirstNode]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const fetchPartnerMembers = async () => {
    if (parentMember?.partners && parentMember.partners.length > 0) {
      for (const partnerId of parentMember.partners) {
        try {
          const response = await familyTreeService.getFamilyTreeMemberById(ftId, partnerId);
          const data = response.data;
          if (partnerMembers.findIndex(item => item.id === data.id) === -1) {
            partnerMembers.push(response.data);
          }
        } catch (error) {
          console.error(`Error fetching partner ${partnerId}:`, error);
        }
      }
    }
  }

  useEffect(() => {
    fetchPartnerMembers();
  }, []);

  const handleRelationshipSelect = useCallback((type: string) => {
    setSelectedType(type);
    const selectedElement = allRelationships.find((item) => item.id === type);
    setFormData((prev) => ({
      ...prev,
      categoryCode: selectedElement?.code,
    }));

    // Trigger partner selection for child types if parent has partners
    if (selectedElement?.code === CategoryCode.Child && parentMember?.partners) {
      if (parentMember.partners.length > 1) {
        setShowPartnerSelection(true);
      } else if (parentMember.partners.length === 1) {
        setSelectedPartnerId(parentMember.partners[0] || null);
        setShowPartnerSelection(false);
      } else {
        setSelectedPartnerId(null);
        setShowPartnerSelection(false);
      }
    }
  }, [parentMember]);

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setShowPartnerSelection(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file định dạng JPEG, JPG, PNG, GIF");
      return;
    }

    // Update formData with the file
    setFormData((prev) => ({
      ...prev,
      ftMemberFiles: [{ file, title: file.name, fileType: file.type }],
    }));

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openFileSelector = () => fileInputRef.current?.click();

  const handleSave = async () => {
    if (onSelectType) {
      const updatedFormData = {
        ...formData,
        fromFTMemberPartnerId: selectedPartnerId || undefined,
      };
      console.log(updatedFormData);
      await onSelectType(updatedFormData);
    }
    onClose?.();
  };

  const handleCancel = () => {
    setSelectedType(null);
    setShowPartnerSelection(false);
    setSelectedPartnerId(null);
    setShowExtendedForm(false);
    setPreviewImage(null);
    setFormData({
      fullname: "",
      gender: 0,
      birthday: "",
      birthplace: "",
      isDeath: false,
      deathDescription: "",
      deathDate: "",
      burialAddress: "",
      burialWardId: undefined,
      burialProvinceId: undefined,
      identificationType: "",
      identificationNumber: undefined,
      ethnicId: undefined,
      religionId: undefined,
      categoryCode: undefined,
      address: "",
      wardId: undefined,
      provinceId: undefined,
      email: "",
      phoneNumber: "",
      content: "",
      storyDescription: "",
      ftId: "",
      rootId: "",
      fromFTMemberId: undefined,
      fromFTMemberPartnerId: undefined,
      ftMemberFiles: [],
    });
  };

  const memoizedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onClick: () =>
            node.id !== parentMember?.id && handleRelationshipSelect(node.id),
        },
      })),
    [nodes, parentMember?.id, handleRelationshipSelect]
  );

  // If selected type and partner selection is needed
  if (selectedType && showPartnerSelection && parentMember?.partners) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-0 animate-in fade-in zoom-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white uppercase">
              CHỌN VỢ/CHỒNG
            </h2>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Partner Selection */}
          <div className="p-6 space-y-4">
            <p className="text-gray-800">Chọn vợ/chồng mà con cái thuộc về:</p>
            {partnerMembers.length > 0 ? (
              partnerMembers.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => handlePartnerSelect(partner.id)}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                  {partner.fullname}
                </button>
              ))
            ) : (
              <p className="text-gray-600">Không có đối tác nào để chọn.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => setShowPartnerSelection(false)}
              disabled={partnerMembers.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If first node or selected type, show the form
  if (isFirstNode || selectedType) {
    const selectedRel = selectedType ? allRelationships.find((r) => r.id === selectedType) : null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-0 animate-in fade-in zoom-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white uppercase">
              {isFirstNode ? "THÊM TÔI" : selectedRel?.label}
            </h2>
            <button
              onClick={isFirstNode ? onClose : handleCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Image Upload and Preview */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Ảnh đại diện
              </label>
              <div
                onClick={openFileSelector}
                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-24 w-24 mx-auto cursor-pointer hover:border-blue-400 transition-colors relative overflow-hidden"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Users className="w-12 h-12 text-gray-400" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Nhấp để chọn ảnh (JPEG, PNG, GIF, tối đa 2MB)
              </p>
            </div>
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Họ tên
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleFormChange}
                placeholder={parentMember?.name || "Nhập họ tên"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            {/* Giới tính & Ngày sinh */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: e.target.value === "1" ? 1 : 0,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="0">Nam</option>
                  <option value="1">Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Nơi sinh */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nơi sinh
              </label>
              <input
                type="text"
                name="birthplace"
                value={formData.birthplace}
                onChange={handleFormChange}
                placeholder="Bệnh Viện A, TP Đà Nẵng, VN"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            {/* IsAlive Checkbox */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDeath"
                  checked={!formData.isDeath}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isDeath: !e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Đang sống</span>
              </label>
            </div>

            {/* Toggle Extended Form */}
            <div className="text-xs text-blue-600 mt-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowExtendedForm(!showExtendedForm);
                }}
                className="underline"
              >
                {showExtendedForm ? "Thu gọn" : "Chỉnh sửa khác ( liễu sử, sự kiện...)"}
              </a>
            </div>

            {showExtendedForm && (
              <div className="space-y-4 mt-4 border-t pt-4">
                {/* Extended Fields */}
                {formData.isDeath && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Mô tả qua đời
                      </label>
                      <input
                        type="text"
                        name="deathDescription"
                        value={formData.deathDescription}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Ngày mất
                      </label>
                      <input
                        type="date"
                        name="deathDate"
                        value={formData.deathDate}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Địa chỉ chôn cất
                      </label>
                      <input
                        type="text"
                        name="burialAddress"
                        value={formData.burialAddress}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Phường chôn cất
                      </label>
                      <select
                        name="burialWardId"
                        value={formData.burialWardId || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            burialWardId: e.target.value ? parseInt(e.target.value) : undefined,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      >
                        <option value="">Chọn phường</option>
                        {selectOptions.WardId.map((option, index) => (
                          <option key={option} value={index + 1}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Tỉnh chôn cất
                      </label>
                      <select
                        name="burialProvinceId"
                        value={formData.burialProvinceId || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            burialProvinceId: e.target.value ? parseInt(e.target.value) : undefined,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      >
                        <option value="">Chọn tỉnh</option>
                        {selectOptions.ProvinceId.map((option, index) => (
                          <option key={option} value={index + 1}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Identification */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Loại giấy tờ
                    </label>
                    <select
                      name="identificationType"
                      value={formData.identificationType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Chọn loại</option>
                      {selectOptions.IdentificationType.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Số giấy tờ
                    </label>
                    <input
                      type="number"
                      name="identificationNumber"
                      value={formData.identificationNumber || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          identificationNumber: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Ethnic & Religion */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Dân tộc
                    </label>
                    <select
                      name="ethnicId"
                      value={formData.ethnicId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ethnicId: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Chọn dân tộc</option>
                      {selectOptions.EthnicId.map((option, index) => (
                        <option key={option} value={index + 1}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Tôn giáo
                    </label>
                    <select
                      name="religionId"
                      value={formData.religionId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          religionId: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Chọn tôn giáo</option>
                      {selectOptions.ReligionId.map((option, index) => (
                        <option key={option} value={index + 1}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phường
                    </label>
                    <select
                      name="wardId"
                      value={formData.wardId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wardId: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Chọn phường</option>
                      {selectOptions.WardId.map((option, index) => (
                        <option key={option} value={index + 1}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Tỉnh
                    </label>
                    <select
                      name="provinceId"
                      value={formData.provinceId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          provinceId: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Chọn tỉnh</option>
                      {selectOptions.ProvinceId.map((option, index) => (
                        <option key={option} value={index + 1}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="SampleEmail123@Example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    placeholder="012345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>

                {/* Content & Story */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Nội dung
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Mô tả câu chuyện
                  </label>
                  <textarea
                    name="storyDescription"
                    value={formData.storyDescription}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={isFirstNode ? onClose : handleCancel}
              className="flex-1 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl p-8 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Thêm thành viên</h2>
            <p className="text-sm text-gray-400">
              Hãy chọn mối quan hệ bạn muốn thêm cho{" "}
              <span className="font-semibold text-white">{parentMember?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ReactFlow Tree (Read-only) */}
        <div
          className="bg-gray-800 rounded-lg border border-gray-700 mb-6"
          style={{ height: "450px" }}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={memoizedNodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              onNodeClick={(_, node) => {
                if (node.id !== parentMember?.id) {
                  handleRelationshipSelect(node.id);
                }
              }}
              proOptions={{ hideAttribution: true }}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
            >
              <Background color="#6b7280" gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewNode;
export interface FamilyMember {
  id: string;
  name: string;
  birthday?: string;
  gender: number;
  avatar?: string;
  bio?: string;
  images?: string[];
  gpMemberFiles?: string[];
  partners?: string[];
  children?: any[];
  isRoot: boolean;
  isCurrentMember: boolean;
  isPartner: boolean;
}