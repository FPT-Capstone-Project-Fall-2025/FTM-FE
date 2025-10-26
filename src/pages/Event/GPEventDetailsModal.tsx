import React, { useEffect, useState } from "react";
import { Modal, Input, Select, Upload, Checkbox, Switch } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { UploadChangeParam } from "antd/es/upload";
import { useParams, useNavigate } from "react-router-dom";
import { format, isBefore, endOfDay } from 'date-fns';
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import eventService from "../../services/eventService";
import provinceService from "../../services/provinceService";
import familyTreeService from "../../services/familyTreeService";
import familyTreeMemberService from "../../services/familyTreeMemberService";
import userService from "../../services/userService";
import { Calendar, X, Image as ImageIcon } from "lucide-react";
import { EVENT_TYPE, EVENT_TYPE_CONFIG } from "./EventTypeLabel";
import type { ApiCreateEventPayload } from "../../types/event";
import { toast } from 'react-toastify';

// Types
interface EventFormData {
  name: string;
  eventType: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  location?: string | null;
  locationName?: string | null;
  recurrence: string;
  members?: string[];
  gpIds?: string[];
  description?: string | null;
  imageUrl?: string | null;
  recurrenceEndTime?: string | null;
  address?: string | null;
  targetMemberId?: string | null;
  isPublic: boolean;
  isLunar: boolean;
}

interface FamilyTreeOption {
  id: string;
  name: string;
  description?: string;
}

interface MemberOption {
  id: string;
  fullname: string;
  ftId: string;
}


const eventSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập tên sự kiện"),
  eventType: yup.string().required("Vui lòng chọn loại sự kiện"),
  startTime: yup.string().required("Vui lòng chọn thời gian bắt đầu"),
  endTime: yup.string().required("Vui lòng chọn thời gian kết thúc"),
  location: yup.string().nullable(),
  locationName: yup.string().nullable(),
  recurrence: yup.string().required("Vui lòng chọn loại lặp lại"),
  members: yup.array().of(yup.string()).default([]),
  gpIds: yup.array().of(yup.string()).default([]),
  description: yup.string().nullable(),
  imageUrl: yup.string().nullable(),
  recurrenceEndTime: yup.string().nullable(),
  address: yup.string().nullable(),
  targetMemberId: yup.string().nullable(),
  isPublic: yup.boolean().default(true),
  isLunar: yup.boolean().default(false),
});

interface CityOption {
  label: string;
  value: string;
  name?: string;
  code?: string;
}


interface GPEventDetailsModalProps {
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
  eventSelected?: any;
  defaultValues?: any;
  handleCreatedEvent?: () => void;
}

// Helper function to convert event type string to number
const convertEventTypeToNumber = (eventType: string): number => {
  const typeMap: Record<string, number> = {
    'FUNERAL': 0,
    'WEDDING': 1,
    'BIRTHDAY': 2,
    'HOLIDAY': 3,
    'MEMORIAL': 4,
    'MEETING': 5,
    'GATHERING': 6,
    'OTHER': 7,
  };
  return typeMap[eventType] ?? 7;
};

// Helper function to convert recurrence string to number
const convertRecurrenceToNumber = (recurrence: string): number => {
  const recurrenceMap: Record<string, number> = {
    'ONCE': 0,
    'DAILY': 1,
    'WEEKLY': 2,
    'MONTHLY': 3,
    'YEARLY': 4,
  };
  return recurrenceMap[recurrence] ?? 0;
};

const GPEventDetailsModal: React.FC<GPEventDetailsModalProps> = ({
  isOpenModal,
  setIsOpenModal,
  eventSelected,
  defaultValues,
  handleCreatedEvent,
}) => {
  const { id: familyTreeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [listCity, setListCity] = useState<CityOption[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [eventTypes, setEventType] = useState<Array<{ label: React.ReactNode; value: string }>>([]);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [isLunar, setIsLunar] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [targetMemberId, setTargetMemberId] = useState<string>("");
  const [familyTrees, setFamilyTrees] = useState<FamilyTreeOption[]>([]);
  const [selectedFamilyTreeId, setSelectedFamilyTreeId] = useState<string>("");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserGPMemberId, setCurrentUserGPMemberId] = useState<string>("");

  const methods = useForm<EventFormData>({
    defaultValues: defaultValues || {
      name: '',
      eventType: '',
      isAllDay: false,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      location: null,
      locationName: null,
      recurrence: "ONCE",
      members: [],
      gpIds: [],
      description: null,
      imageUrl: null,
      recurrenceEndTime: null,
      address: null,
      targetMemberId: "",
      isPublic: true,
      isLunar: false,
    },
    resolver: yupResolver(eventSchema) as any,
  });

  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = methods;

  // Watch recurrence to show/hide recurrenceEndTime
  const recurrenceValue = watch('recurrence');
  const showRecurrenceEndTime = recurrenceValue && recurrenceValue !== 'ONCE';

  // Watch startTime for validation
  const startTime = watch('startTime');

  // Auto-update endTime when isAllDay is checked or startTime changes
  useEffect(() => {
    if (isAllDay && startTime) {
      // When "All Day" is checked, set endTime to end of the same day
      const startDate = new Date(startTime);
      const newEndTime = endOfDay(startDate).toISOString();
      setValue('endTime', newEndTime);
    }
  }, [isAllDay, startTime, setValue]);

  // Fetch provinces for locationName dropdown
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await provinceService.getAllProvinces();
        const provinces = res?.data?.data || res?.data || [];
        const cityOptions: CityOption[] = provinces.map((p: any) => ({
          label: p.nameWithType || p.name,
          value: p.code || p.slug || p.id,
          name: p.nameWithType || p.name,
          code: p.code || p.slug || p.id,
        }));
        setListCity(cityOptions);
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response: any = await userService.getProfileData();
        if (response?.data?.userId) {
          setCurrentUserId(response.data.userId);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch family trees
  useEffect(() => {
    const fetchFamilyTrees = async () => {
      try {
        const res: any = await familyTreeService.getAllFamilyTrees(1, 100);
        const trees = res?.data?.data?.data || res?.data?.data || [];
        const treeOptions: FamilyTreeOption[] = trees.map((tree: any) => ({
          id: tree.id,
          name: tree.name,
          description: tree.description,
        }));
        setFamilyTrees(treeOptions);
        
        // Auto-select the first family tree if available or use URL param
        if (familyTreeId) {
          setSelectedFamilyTreeId(familyTreeId);
        } else if (treeOptions && treeOptions.length > 0) {
          setSelectedFamilyTreeId(treeOptions[0]?.id || "");
        }
      } catch (error) {
        console.error("Error fetching family trees:", error);
      }
    };
    fetchFamilyTrees();
  }, [familyTreeId]);

  // Fetch members when family tree is selected
  useEffect(() => {
    if (!selectedFamilyTreeId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const res: any = await familyTreeService.getFamilyTreeMembers({
          pageIndex: 1,
          pageSize: 100,
          filters: `[{"name":"ftId","operation":"EQUAL","value":"${selectedFamilyTreeId}"}]`
        } as any);
        const memberData = res?.data?.data?.data || res?.data?.data || [];
        const memberOptions: MemberOption[] = memberData.map((member: any) => ({
          id: member.id,
          fullname: member.fullname,
          ftId: member.ftId,
        }));
        setMembers(memberOptions);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };
    fetchMembers();
  }, [selectedFamilyTreeId]);

  // Auto-select all members when "All members" is selected and members are loaded
  useEffect(() => {
    if (targetMemberId === '' && members.length > 0) {
      setSelectedMembers(members);
    }
  }, [members, targetMemberId]);

  // Fetch current user's GPMember ID when family tree and userId are ready
  useEffect(() => {
    if (!selectedFamilyTreeId || !currentUserId) {
      setCurrentUserGPMemberId("");
      return;
    }

    const fetchCurrentUserGPMember = async () => {
      try {
        const gpMember = await familyTreeMemberService.getGPMemberByUserId(
          selectedFamilyTreeId,
          currentUserId
        );
        if (gpMember && gpMember.id) {
          setCurrentUserGPMemberId(gpMember.id);
        }
      } catch (error) {
        console.error("Error fetching current user's GPMember:", error);
      }
    };
    fetchCurrentUserGPMember();
  }, [selectedFamilyTreeId, currentUserId]);

  // Setup event types
  useEffect(() => {
    const types = Object.values(EVENT_TYPE).map((type) => ({
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={EVENT_TYPE_CONFIG[type].icon} alt={type} style={{ width: '20px', height: '20px' }} />
          <span>{EVENT_TYPE_CONFIG[type].label}</span>
        </div>
      ),
      value: type,
    }));
    setEventType(types);
  }, []);

  // Populate form when editing an existing event
  useEffect(() => {
    if (isOpenModal && eventSelected && (eventSelected as any).id) {
      // This is edit mode - populate form with existing data
      const event = eventSelected as any;
      
      // Set basic form fields
      reset({
        name: event.name || '',
        eventType: event.eventType || 'OTHER',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || null,
        locationName: event.locationName || null,
        recurrence: event.recurrenceType || 'ONCE',
        description: event.description || null,
        imageUrl: event.imageUrl || null,
        recurrenceEndTime: event.recurrenceEndTime || null,
        address: event.address || null,
        isAllDay: event.isAllDay || false,
        isPublic: event.isPublic !== undefined ? event.isPublic : true,
        isLunar: event.isLunar || false,
      });

      // Set state fields
      setIsAllDay(event.isAllDay || false);
      setIsPublic(event.isPublic !== undefined ? event.isPublic : true);
      setIsLunar(event.isLunar || false);

      // Set family tree ID
      if (event.ftId) {
        setSelectedFamilyTreeId(event.ftId);
      }

      // Set target member ID
      if (event.targetMemberId) {
        setTargetMemberId(event.targetMemberId);
      } else {
        setTargetMemberId(''); // All members
      }

      // Set selected members from eventMembers
      if (event.eventMembers && Array.isArray(event.eventMembers)) {
        const eventMemberOptions: MemberOption[] = event.eventMembers.map((em: any) => ({
          id: em.ftMemberId,
          fullname: em.memberName,
          ftId: event.ftId,
        }));
        setSelectedMembers(eventMemberOptions);
      }

      // Set image if available
      if (event.imageUrl) {
        setPreviewImage(event.imageUrl);
      }
    } else if (isOpenModal && !eventSelected) {
      // This is create mode - reset form
      reset({
        name: '',
        eventType: 'OTHER',
        startTime: '',
        endTime: '',
        location: null,
        locationName: null,
        recurrence: 'ONCE',
        description: null,
        imageUrl: null,
        recurrenceEndTime: null,
        address: null,
        isAllDay: false,
        isPublic: true,
        isLunar: false,
      });
      setIsAllDay(false);
      setIsPublic(true);
      setIsLunar(false);
      setTargetMemberId('');
      setSelectedMembers([]);
      setPreviewImage(null);
      setFileList([]);
    }
  }, [isOpenModal, eventSelected, reset]);

  // Handle form submission
  const onSubmit = async (data: EventFormData) => {
    setIsSubmit(true);
    try {
      console.log('Form data:', data);
      console.log('ImageUrl from form:', data.imageUrl ? `${data.imageUrl.substring(0, 50)}...` : 'null');

      // Validate start time is before end time
      if (!isBefore(new Date(data.startTime), new Date(data.endTime))) {
        toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");
        setIsSubmit(false);
        return;
      }

      // Get the ftId (Family Tree ID)
      // Priority: selectedFamilyTreeId -> eventSelected.ftId -> URL params -> fallback
      const isEditMode = eventSelected && (eventSelected as any).id;
      const ftId = selectedFamilyTreeId || 
                   (isEditMode ? (eventSelected as any).ftId : null) ||
                   familyTreeId || 
                   "822994d5-7acd-41f8-b12b-e0a634d74440";
      
      if (!ftId) {
        toast.error("Không tìm thấy ID gia phả");
        setIsSubmit(false);
        return;
      }

      // Get current user's GPMember ID if "Only me" is selected
      const actualTargetMemberId = targetMemberId === "self" ? currentUserGPMemberId : targetMemberId;

      // Convert form data to API payload
      // NOTE: imageUrl is set to null because base64 is too long for varchar(500)
      // TODO: Implement proper image upload to cloud storage (S3, Azure Blob, etc.)
      // and then send the cloud URL instead of base64
      const payload: ApiCreateEventPayload = {
        name: data.name,
        eventType: convertEventTypeToNumber(data.eventType),
        startTime: data.startTime,
        endTime: data.endTime || data.startTime,
        location: data.location || null,
        locationName: data.locationName || null,
        recurrenceType: convertRecurrenceToNumber(data.recurrence),
        ftId: ftId,
        description: data.description || null,
        imageUrl: null, // TODO: Upload to cloud storage first
        referenceEventId: null,
        address: data.address || null,
        isAllDay: isAllDay,
        recurrenceEndTime: data.recurrenceEndTime || null,
        isLunar: isLunar,
        targetMemberId: actualTargetMemberId || null,
        isPublic: isPublic,
        memberIds: selectedMembers.map(m => m.id),
      };

      console.log('API Payload:', payload);
      
      // Call the appropriate API
      const response = isEditMode
        ? await eventService.updateEventById((eventSelected as any).id, payload)
        : await eventService.createEvent(payload);
      
      console.log('API Response:', response);

      if (response.data && response.data.id) {
        const successMessage = isEditMode ? "Cập nhật sự kiện thành công!" : "Tạo sự kiện thành công!";
        toast.success(successMessage);
        
        // Notify user if image was selected but not uploaded
        if (previewImage && !isEditMode) {
          toast.info("Lưu ý: Hình ảnh chưa được lưu. Tính năng upload ảnh đang được phát triển.", {
            autoClose: 5000,
          });
        }
        
        setIsOpenModal(false);
        if (handleCreatedEvent) {
          handleCreatedEvent();
        }
        reset();
        
        // Navigate to "My Events" tab after creating/editing an event
        setTimeout(() => {
          if (!isEditMode) {
            // For new events, navigate to my-events tab
            navigate(`/events?tab=my-events&refresh=${Date.now()}`);
          } else {
            // For edited events, check if we're already on my-events tab
            const currentTab = new URLSearchParams(window.location.search).get('tab');
            if (currentTab === 'my-events') {
              // Refresh the my-events list by adding a timestamp
              navigate(`/events?tab=my-events&refresh=${Date.now()}`);
            }
          }
        }, 500);
      } else {
        toast.error(response.message || `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} sự kiện`);
      }
    } catch (error: any) {
      console.error(`Error ${eventSelected && (eventSelected as any).id ? 'updating' : 'creating'} event:`, error);
      toast.error(error?.message || `Có lỗi xảy ra khi ${eventSelected && (eventSelected as any).id ? 'cập nhật' : 'tạo'} sự kiện`);
    } finally {
      setIsSubmit(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsOpenModal(false);
  };

  // Handle image upload
  const handleUploadChange = (info: UploadChangeParam<UploadFile>, onChange?: (value: string | null) => void) => {
    console.log('Upload onChange triggered, fileList length:', info.fileList.length);
    setFileList(info.fileList);
    
    // Get the latest file
    const file = info.fileList[info.fileList.length - 1];
    
    if (file && file.originFileObj) {
      console.log('Processing file:', file.name, 'type:', file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewImage(url);
        setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true });
        if (onChange) {
          onChange(url);
        }
        console.log('✅ Image uploaded successfully! URL length:', url?.length);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error('Lỗi khi đọc file ảnh');
      };
      reader.readAsDataURL(file.originFileObj);
    } else if (info.fileList.length === 0) {
      // Image removed
      console.log('No files, clearing image');
      setPreviewImage(null);
      setValue('imageUrl', null, { shouldValidate: true, shouldDirty: true });
      if (onChange) {
        onChange(null);
      }
    }
  };

  const uploadButton = (
    <div className="flex flex-col items-center gap-2 p-4">
      <ImageIcon className="w-8 h-8 text-gray-400" />
      <div className="text-sm text-gray-600">Tải ảnh lên</div>
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>{eventSelected ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancel}
      footer={null}
      width={700}
      closeIcon={<X className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sự kiện <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập tên sự kiện"
                size="large"
                status={errors.name ? 'error' : ''}
              />
            )}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại sự kiện <span className="text-red-500">*</span>
          </label>
          <Controller
            name="eventType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn loại sự kiện"
                size="large"
                style={{ width: '100%' }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
                options={eventTypes}
                status={errors.eventType ? 'error' : ''}
              />
            )}
          />
          {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>}
        </div>

        {/* All Day Checkbox */}
        <div>
          <Checkbox
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
          >
            Sự kiện cả ngày
          </Checkbox>
        </div>

        {/* Start Date Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={
                    field.value 
                      ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")
                      : ''
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const date = new Date(e.target.value);
                    field.onChange(date.toISOString());
                  }}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            )}
          />
          {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
        </div>

        {/* End Date Time - Hidden when All Day is selected */}
        {!isAllDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={
                      field.value 
                        ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")
                        : ''
                    }
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const date = new Date(e.target.value);
                      field.onChange(date.toISOString());
                    }}
                    min={startTime ? format(new Date(startTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      errors.endTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              )}
            />
            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
          </div>
        )}

        {/* Helper text for All Day events */}
        {isAllDay && (
          <p className="text-xs text-gray-500 -mt-2">
            Sự kiện cả ngày sẽ tự động kết thúc vào cuối ngày đã chọn
          </p>
        )}

       

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lặp lại
          </label>
          <Controller
            name="recurrence"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                size="large"
                style={{ width: '100%' }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
                options={[
                  { label: 'Một lần', value: 'ONCE' },
                  { label: 'Hàng ngày', value: 'DAILY' },
                  { label: 'Hàng tuần', value: 'WEEKLY' },
                  { label: 'Hàng tháng', value: 'MONTHLY' },
                  { label: 'Hàng năm', value: 'YEARLY' },
                ]}
              />
            )}
          />
        </div>

        {/* Recurrence End Time (only show if recurrence is not ONCE) */}
        {showRecurrenceEndTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày kết thúc lặp lại
            </label>
            <Controller
              name="recurrenceEndTime"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    field.onChange(date ? date.toISOString() : null);
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            />
          </div>
        )}

        {/* Location Name (Province) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố
          </label>
          <Controller
            name="locationName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                placeholder="Chọn tỉnh/thành phố"
                size="large"
                style={{ width: '100%' }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
                options={listCity}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            )}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ cụ thể
          </label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Nhập địa chỉ cụ thể"
                size="large"
              />
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value || ''}
                placeholder="Nhập mô tả sự kiện"
                rows={4}
              />
            )}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hình ảnh
            <span className="ml-2 text-xs text-orange-500 font-normal">(Tính năng đang phát triển)</span>
          </label>
          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <>
                <input type="hidden" {...field} value={field.value || ''} />
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={(info) => handleUploadChange(info, field.onChange)}
                  beforeUpload={(file) => {
                    console.log('Before upload:', file.name, 'size:', file.size, 'bytes');
                    return false; // Prevent auto upload
                  }}
                  onRemove={() => {
                    setFileList([]);
                    setPreviewImage(null);
                    field.onChange(null);
                    console.log('Image removed from form');
                    return true;
                  }}
                  accept="image/*"
                  maxCount={1}
                >
                  {fileList.length === 0 && uploadButton}
                </Upload>
                {previewImage && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">Xem trước:</p>
                    <img src={previewImage} alt="Preview" className="w-32 h-32 object-cover rounded border" />
                    <p className="text-xs text-orange-500 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Ảnh chỉ hiển thị xem trước, chưa được lưu lên server</span>
                    </p>
                  </div>
                )}
              </>
            )}
          />
        </div>

        {/* Family Tree Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Gia phả <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedFamilyTreeId}
            onChange={(value) => {
              setSelectedFamilyTreeId(value);
              setSelectedMembers([]); // Reset selected members when changing family tree
            }}
            size="large"
            style={{ width: '100%' }}
            placeholder="Chọn gia phả"
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
            }
            options={familyTrees.map(tree => ({
              label: tree.name,
              value: tree.id,
            }))}
          />
        </div>

        {/* Target Member (Event visibility) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đối tượng xem sự kiện
          </label>
          <Select
            value={targetMemberId}
            onChange={(value) => {
              setTargetMemberId(value);
              // When selecting "All members", auto-select all members
              if (value === '') {
                setSelectedMembers(members);
              }
              // When selecting "Only me", clear selected members and auto-fill current user's GPMember
              if (value === 'self') {
                setSelectedMembers([]);
                // Auto-fill current user's GPMember if available
                if (currentUserGPMemberId) {
                  const currentUserMember = members.find(m => m.id === currentUserGPMemberId);
                  if (currentUserMember) {
                    setSelectedMembers([currentUserMember]);
                  }
                }
              }
            }}
            size="large"
            style={{ width: '100%' }}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            options={[
              { label: 'Tất cả thành viên', value: '' },
              { label: 'Chỉ mình tôi', value: 'self' },
            ]}
          />
        </div>

        {/* Member Tagging - Hidden when "Only me" is selected */}
        {targetMemberId !== 'self' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag thành viên
            </label>
            <Select
              mode="multiple"
              value={selectedMembers.map(m => m.id)}
              onChange={(values) => {
                const selected = members.filter(m => values.includes(m.id));
                setSelectedMembers(selected);
              }}
              size="large"
              style={{ width: '100%' }}
              placeholder="@Nhập tên thành viên để tag..."
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              showSearch
              filterOption={(input, option) =>
                (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
              options={members.map(member => ({
                label: member.fullname,
                value: member.id,
              }))}
              disabled={!selectedFamilyTreeId}
              maxTagCount="responsive"
            />
            {selectedMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedMembers.map(member => (
                  <span
                    key={member.id}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    @{member.fullname}
                    <button
                      type="button"
                      onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Public/Private */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Công khai sự kiện
          </label>
          <Switch
            checked={isPublic}
            onChange={(checked) => setIsPublic(checked)}
          />
        </div>

        {/* Lunar Calendar */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Sử dụng lịch âm
          </label>
          <Switch
            checked={isLunar}
            onChange={(checked) => setIsLunar(checked)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmit ? 'Đang lưu...' : eventSelected ? 'Cập nhật' : 'Tạo sự kiện'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GPEventDetailsModal;
