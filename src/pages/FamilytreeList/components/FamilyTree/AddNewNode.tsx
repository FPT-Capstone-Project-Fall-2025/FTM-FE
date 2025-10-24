import { X, Users, User, Baby } from "lucide-react";
import React, { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface FamilyMember {
  id: string;
  name: string;
  birthYear: string;
}

interface AddNewNodeProps {
  parentMember?: FamilyMember | null;
  existingRelationships?: string[];
  isFirstNode?: boolean;
  onClose?: () => void;
  onSelectType?: (type: string, formData?: any) => void;
}

// Define all possible relationships with icons and details
const allRelationships = [
  {
    id: "father",
    label: "THÊM CHA",
    icon: Users,
    row: 0,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "mother",
    label: "THÊM MẸ",
    icon: Users,
    row: 0,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "spouse",
    label: "THÊM VỢ/CHỒNG",
    icon: Users,
    row: 1,
    color: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
  },
  {
    id: "sibling-brother",
    label: "THÊM ANH/EM TRAI",
    icon: User,
    row: 1,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "sibling-sister",
    label: "THÊM CHỊ/EM GÁI",
    icon: User,
    row: 1,
    color: "bg-pink-100",
    textColor: "text-pink-600",
    borderColor: "border-pink-300",
  },
  {
    id: "child-son",
    label: "THÊM CON TRAI",
    icon: Baby,
    row: 2,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "child-daughter",
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
  parentMember = null,
  existingRelationships = [],
  isFirstNode = false,
  onClose,
  onSelectType,
}: AddNewNodeProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showExtendedForm, setShowExtendedForm] = useState(false);
  const [formData, setFormData] = useState({
    Fullname: "",
    Gender: 0 as 0 | 1,
    Birthday: "",
    birthplace: "",
    IsDeath: false,
    DeathDescription: "",
    DeathDate: "",
    BurialAddress: "",
    BurialWardId: undefined,
    BurialProvinceId: undefined,
    IdentificationType: "",
    IdentificationNumber: undefined,
    EthnicId: undefined,
    ReligionId: undefined,
    CategoryCode: undefined,
    Address: "",
    WardId: undefined,
    ProvinceId: undefined,
    Email: "",
    PhoneNumber: "",
    Content: "",
    StoryDescription: "",
    FTId: "",
    RootId: "",
    FromFTMemberId: undefined,
    FromFTMemberPartnerId: undefined,
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
              <div className="text-xs text-gray-600">{parentMember.birthYear}</div>
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

  const handleRelationshipSelect = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSave = () => {
    if (onSelectType) {
      onSelectType(selectedType || 'me', formData);
    }
    onClose?.();
  };

  const handleCancel = () => {
    setSelectedType(null);
    setShowExtendedForm(false);
    setFormData({
      Fullname: "",
      Gender: 0,
      Birthday: "",
      birthplace: "",
      IsDeath: false,
      DeathDescription: "",
      DeathDate: "",
      BurialAddress: "",
      BurialWardId: undefined,
      BurialProvinceId: undefined,
      IdentificationType: "",
      IdentificationNumber: undefined,
      EthnicId: undefined,
      ReligionId: undefined,
      CategoryCode: undefined,
      Address: "",
      WardId: undefined,
      ProvinceId: undefined,
      Email: "",
      PhoneNumber: "",
      Content: "",
      StoryDescription: "",
      FTId: "",
      RootId: "",
      FromFTMemberId: undefined,
      FromFTMemberPartnerId: undefined,
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
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Họ tên
              </label>
              <input
                type="text"
                name="Fullname"
                value={formData.Fullname}
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
                  name="Gender"
                  value={formData.Gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Gender: e.target.value === "1" ? 1 : 0,
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
                  name="Birthday"
                  value={formData.Birthday}
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
                  name="IsDeath"
                  checked={!formData.IsDeath}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      IsDeath: !e.target.checked,
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
                {formData.IsDeath && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Mô tả qua đời
                      </label>
                      <input
                        type="text"
                        name="DeathDescription"
                        value={formData.DeathDescription}
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
                        name="DeathDate"
                        value={formData.DeathDate}
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
                        name="BurialAddress"
                        value={formData.BurialAddress}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Phường chôn cất
                      </label>
                      <select
                        name="BurialWardId"
                        value={formData.BurialWardId || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            // BurialWardId: e.target.value ? parseInt(e.target.value) : undefined,
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
                        name="BurialProvinceId"
                        value={formData.BurialProvinceId || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            // BurialProvinceId: e.target.value ? parseInt(e.target.value) : undefined,
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
                      name="IdentificationType"
                      value={formData.IdentificationType}
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
                      name="IdentificationNumber"
                      value={formData.IdentificationNumber || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          // IdentificationNumber: e.target.value ? parseInt(e.target.value) : undefined,
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
                      name="EthnicId"
                      value={formData.EthnicId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          // EthnicId: e.target.value ? parseInt(e.target.value) : undefined,
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
                      name="ReligionId"
                      value={formData.ReligionId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          // ReligionId: e.target.value ? parseInt(e.target.value) : undefined,
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
                    name="Address"
                    value={formData.Address}
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
                      name="WardId"
                      value={formData.WardId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          // WardId: e.target.value ? parseInt(e.target.value) : undefined,
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
                      name="ProvinceId"
                      value={formData.ProvinceId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          // ProvinceId: e.target.value ? parseInt(e.target.value) : undefined,
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
                    name="Email"
                    value={formData.Email}
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
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
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
                    name="Content"
                    value={formData.Content}
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
                    name="StoryDescription"
                    value={formData.StoryDescription}
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