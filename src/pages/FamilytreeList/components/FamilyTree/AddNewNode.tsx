import dataService from "@/services/dataService";
import familyTreeService from "@/services/familyTreeService";
import { CategoryCode, type AddingNodeProps, type FamilyMember, type FamilyNode } from "@/types/familytree";
import type { Province, Ward } from "@/types/user";
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

interface Relationship {
  id: string;
  code: CategoryCode;
  label: string;
  icon: typeof Users;
  row: number;
  color: string;
  textColor: string;
  borderColor: string;
  gender: 0 | 1;
}

// Define all possible relationships with icons and details
const allRelationships: Relationship[] = [
  {
    id: "father",
    code: CategoryCode.Parent,
    label: "THÊM CHA",
    icon: Users,
    row: 0,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
    gender: 0,
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
    gender: 1,
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
    gender: 0,
  },
  {
    id: "sibling",
    code: CategoryCode.Sibling,
    label: "THÊM ANH/CHỊ/EM",
    icon: User,
    row: 1,
    color: "bg-pink-100",
    textColor: "text-pink-600",
    borderColor: "border-pink-300",
    gender: 0,
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
    gender: 0
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
    gender: 1
  },
];

// Sample options for select fields
const selectOptions = {
  EthnicId: ["Kinh", "Tày", "Thái"],
  ReligionId: ["Phật giáo", "Thiên chúa giáo", "Không"],
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
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedBurialProvinceId, setSelectedBurialProvinceId] = useState<string>('');
  const [wards, setWards] = useState<Ward[]>([]);
  const [burialWards, setBurialWards] = useState<Ward[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<AddingNodeProps>>({
    ftId: ftId,
    rootId: parentMember?.id || "",
    isDeath: false,
    fromFTMemberId: parentMember?.id,
    categoryCode: isFirstNode ? CategoryCode.FirstNode : undefined,
  });

  // Filter out existing relationships
  const availableRelationships = allRelationships.filter(
    (rel) =>  !existingRelationships.includes(rel.id)
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
    totalInRow: number,
    isParent: boolean = false,
    hasParentInRow: boolean = false
  ) => {

    const horizontalSpacing = 250;
    const verticalSpacing = 180;
    const parentWidth = 160; // Width of parent node

    const y = row * verticalSpacing;

    // Center the parent node at x: 0
    if (isParent) {
      return { x: 0, y };
    }

    // For nodes in the same row as parent, position them on the sides
    if (hasParentInRow) {
      // Split nodes: left side and right side of parent
      const nodesPerSide = Math.ceil((totalInRow - 1) / 2);

      if (indexInRow < nodesPerSide) {
        // Left side nodes
        const leftIndex = nodesPerSide - 1 - indexInRow;
        const x = -(parentWidth / 2 + horizontalSpacing + leftIndex * horizontalSpacing);
        return { x, y };
      } else {
        // Right side nodes
        const rightIndex = indexInRow - nodesPerSide;
        const x = parentWidth / 2 + horizontalSpacing + rightIndex * horizontalSpacing;
        return { x, y };
      }
    }

    // For other rows, calculate positions around the center
    const totalWidth = (totalInRow - 1) * horizontalSpacing;
    const x = indexInRow * horizontalSpacing - totalWidth / 2;

    return { x, y };
  };

  const initialNodes: Node[] = useMemo(() => {
    if (isFirstNode || !parentMember) {
      return [];
    }

    // Group relationship nodes by row (excluding parent)
    const relationshipsByRow: { [key: number]: typeof availableRelationships } = {};
    availableRelationships.forEach((rel) => {
      if (!relationshipsByRow[rel.row]) {
        relationshipsByRow[rel.row] = [];
      }
      relationshipsByRow[rel.row]?.push(rel);
    });

    const parentRow = 1;

    return [
      {
        id: parentMember.id,
        data: {
          label: (
            <div className="text-center">
              <div className="text-base font-bold text-white mb-1">
                {parentMember.name}
              </div>
              <div className="text-xs text-white font-medium opacity-90">{parentMember.birthday}</div>
            </div>
          ),
        },
        position: createNodePosition(parentRow, 0, 1, true, false), // Center position for parent
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "3px solid #5a67d8",
          borderRadius: "12px",
          padding: "20px 24px",
          minWidth: "160px",
          fontSize: "13px",
          zIndex: 100,
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(102, 126, 234, 0.2)",
        },
      },
      ...availableRelationships.map((rel) => {
        const sameRowCount = relationshipsByRow[rel.row]!.length;
        const sameRowIndex = relationshipsByRow[rel.row]!.findIndex((r) => r.id === rel.id);
        const hasParentInThisRow = rel.row === parentRow;
        const pos = createNodePosition(rel.row, sameRowIndex, sameRowCount, false, hasParentInThisRow);
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
  };

  const loadDefaultData = async () => {
    setIsLoadingLocation(true);
    try {
      const provincesResponse = await dataService.getProvinces();
      setProvinces(provincesResponse.data);
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    loadDefaultData();
    fetchPartnerMembers();
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    const loadWardData = async () => {
      try {
        const response = await dataService.getWards(selectedProvinceId);
        setWards(response.data);
      } catch (error) {
        console.error('Error loading wards data:', error);
      }
    };
    loadWardData();
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedBurialProvinceId) return;
    const loadWardData = async () => {
      try {
        const response = await dataService.getWards(selectedBurialProvinceId);
        setBurialWards(response.data);
      } catch (error) {
        console.error('Error loading wards data:', error);
      }
    };
    loadWardData();
  }, [selectedBurialProvinceId]);

  const handleRelationshipSelect = useCallback((type: string) => {
    setSelectedType(type);
    const selectedElement = allRelationships.find((item) => item.id === type);
    setFormData((prev) => ({
      ...prev,
      categoryCode: selectedElement?.code,
      gender: selectedElement?.gender || 0,
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
    setFormData((prev) => ({
      ...prev,
      fromFTMemberPartnerId: partnerId,
    }));
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "isDeath") {
      setFormData((prev) => ({
        ...prev,
        isDeath: !(e.target as HTMLInputElement).checked,
      }));
    } else if (name === "gender") {
      setFormData((prev) => ({
        ...prev,
        gender: value === "1" ? 1 : 0,
      }));
    } else if (name === "identificationNumber") {
      setFormData((prev) => ({
        ...prev,
        identificationNumber: value ? parseInt(value) : undefined,
      }));
    } else if (name === "ethnicId" || name === "religionId") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value || undefined,
      }));
    }
  };

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

    // Revoke previous blob URL if any
    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    // Create new blob URL for preview
    const newUrl = URL.createObjectURL(file);

    // Update formData with new avatar and picture
    setFormData((prev) => ({
      ...prev,
      picture: newUrl,
      avatar: file,
    }));

    // Set preview image
    setPreviewImage(newUrl);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedProvinceId(provinceId);
    setFormData((prev) => ({
      ...prev,
      provinceId: provinceId || undefined,
      wardId: undefined, // Reset ward when province changes
    }));
  };

  const handleBurialProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedBurialProvinceId(provinceId);
    setFormData((prev) => ({
      ...prev,
      burialProvinceId: provinceId || undefined,
      burialWardId: undefined, // Reset ward when province changes
    }));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      wardId: wardId || undefined,
    }));
  };

  const handleBurialWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      burialWardId: wardId || undefined,
    }));
  };

  const openFileSelector = () => fileInputRef.current?.click();

  const handleSave = async () => {
    if (!onSelectType) return;

    setIsSaving(true);
    // Build payload with only changed fields
    const payload: Partial<AddingNodeProps> = {
      ftId,
      ...formData,
      fromFTMemberPartnerId: selectedPartnerId || undefined,
    };

    // Remove fields that are undefined or empty strings to ensure only changed fields are sent
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined || payload[key as keyof typeof payload] === "") {
        delete payload[key as keyof typeof payload];
      }
    });

    console.log("Payload:", JSON.stringify(payload, (_, value) => {
      if (value && typeof value === "object" && "name" in value && "type" in value && "size" in value) {
        return "[File object]";
      }
      return value;
    }, 2));

    // Call onSelectType with the payload
    await onSelectType(payload);

    // Clean up blobs
    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    setIsSaving(false);
    handleCancel();
  };

  const handleCancel = () => {
    // Revoke blob URLs
    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedType(null);
    setShowPartnerSelection(false);
    setSelectedPartnerId(null);
    setShowExtendedForm(false);
    setPreviewImage(null);
    setSelectedProvinceId("");
    setSelectedBurialProvinceId("");
    setWards([]);
    setBurialWards([]);
    setFormData({
      ftId,
      rootId: parentMember?.id || "",
      fromFTMemberId: parentMember?.id,
      categoryCode: isFirstNode ? CategoryCode.FirstNode : undefined,
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
            <h2 className="text-lg pluripotent-bold text-white uppercase">
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
                  onClick={() => handlePartnerSelect(partner.id || '')}
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
                value={formData.fullname || ""}
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
                  value={formData.gender ?? ""}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">Chọn giới tính</option>
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
                  value={formData.birthday || ""}
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
                value={formData.birthplace || ""}
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
                  onChange={handleFormChange}
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
                {/* {showExtendedForm ? "Thu gọn" : "Chỉnh sửa khác ( liễu sử, sự kiện...)"} */}
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
                        value={formData.deathDescription || ""}
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
                        value={formData.deathDate || ""}
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
                        value={formData.burialAddress || ""}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                    </div>
                    {/* Province */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tỉnh/Thành phố chôn cất
                      </label>
                      <select
                        name="burialProvinceId"
                        value={selectedBurialProvinceId || ""}
                        onChange={handleBurialProvinceChange}
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
                    </div>
                    {/* Ward */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quận/Huyện chôn cất
                      </label>
                      <select
                        name="burialWardId"
                        value={formData.burialWardId || ""}
                        onChange={handleBurialWardChange}
                        disabled={isLoadingLocation || !selectedBurialProvinceId}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">
                          {!selectedBurialProvinceId
                            ? 'Chọn tỉnh/thành phố trước'
                            : 'Chọn quận/huyện'}
                        </option>
                        {burialWards.map(ward => (
                          <option key={ward.code} value={ward.id}>
                            {ward.name}
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
                      value={formData.identificationType || ""}
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
                      onChange={handleFormChange}
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
                      onChange={handleFormChange}
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
                      onChange={handleFormChange}
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
                    value={formData.address || ""}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Province */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tỉnh/Thành phố
                    </label>
                    <select
                      name="provinceId"
                      value={selectedProvinceId || ""}
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
                  </div>
                  {/* Ward */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quận/Huyện
                    </label>
                    <select
                      name="wardId"
                      value={formData.wardId || ""}
                      onChange={handleWardChange}
                      disabled={isLoadingLocation || !selectedProvinceId}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">
                        {!selectedProvinceId
                          ? 'Chọn tỉnh/thành phố trước'
                          : 'Chọn quận/huyện'}
                      </option>
                      {wards.map(ward => (
                        <option key={ward.code} value={ward.id}>
                          {ward.name}
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
                    value={formData.email || ""}
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
                    value={formData.phoneNumber || ""}
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
                    value={formData.content || ""}
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
                    value={formData.storyDescription || ""}
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
              disabled={isSaving}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold ${!isSaving
                ? 'hover:bg-blue-700 transition-colors'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
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