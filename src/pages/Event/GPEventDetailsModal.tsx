import React, { useEffect, useState } from "react";
import { Modal, Input, Select, Upload, Checkbox, Switch, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import type { UploadChangeParam } from "antd/es/upload";
import { useParams } from "react-router-dom";
import { format, isBefore } from 'date-fns';
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import eventService from "../../services/eventService";
import provinceService from "../../services/provinceService";
import familyTreeService from "../../services/familyTreeService";
import familyTreeMemberService from "../../services/familyTreeMemberService";
import userService from "../../services/userService";
import { X, Image as ImageIcon } from "lucide-react";
import { EVENT_TYPE, EVENT_TYPE_CONFIG } from "./EventTypeLabel";
import { toast } from 'react-toastify';
import { normalizeEventType } from "../../utils/eventUtils";
import { getLunarCanChi } from "./utils/convertSolar2Lunar";
import ExceptionPopup from '@/components/shared/ExceptionPopup';

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
  targetMemberId: yup.string().nullable(), // Can be "", "self", or member ID
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
// Helper function to convert event type (string or number) to number
// Maps to backend: Memorial=1, Wedding=2, Birthday=3, Other=4
const convertEventTypeToNumber = (eventType: string | number): number => {
  // If already a number, validate and return it
  if (typeof eventType === 'number') {
    // Validate it's in backend range (1-4)
    if (eventType >= 1 && eventType <= 4) {
      return eventType;
    }
    // Legacy support: map old numbers to new ones
    if (eventType === 0) return 1; // FUNERAL -> MEMORIAL
    return 4; // Default to OTHER
  }

  // If string, normalize to uppercase and convert
  const normalizedType = (eventType || '').toUpperCase().trim();

  // Map frontend EventType strings to backend numbers
  const typeMap: Record<string, number> = {
    'MEMORIAL': 1,   // "Ma chay, giỗ" - backend Memorial = 1
    'WEDDING': 2,    // "Cưới hỏi" - backend Wedding = 2
    'BIRTHDAY': 3,   // "Sinh nhật" - backend Birthday = 3
    'OTHER': 4,      // "Khác" - backend Other = 4
    // Legacy support
    'FUNERAL': 1,    // Legacy FUNERAL maps to MEMORIAL (1)
  };

  const result = typeMap[normalizedType] ?? 4;

  // Debug logging
  console.log('🔍 convertEventTypeToNumber:', {
    input: eventType,
    normalized: normalizedType,
    result: result,
    mappedTo: Object.keys(typeMap).find(key => typeMap[key] === result)
  });

  return result;
};

// Helper function to convert recurrence string to number
const convertRecurrenceToNumber = (recurrence: string): number => {
  const recurrenceMap: Record<string, number> = {
    'ONCE': 0,
    'DAILY': 1,
    'MONTHLY': 2,
    'YEARLY': 3,
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

  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [listCity, setListCity] = useState<CityOption[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [eventTypes, setEventType] = useState<Array<{ label: React.ReactNode; value: string }>>([]);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isLunar, setIsLunar] = useState<boolean>(false);
  const isPublic = true;
  const [targetMemberId, setTargetMemberId] = useState<string>("");
  const [familyTrees, setFamilyTrees] = useState<FamilyTreeOption[]>([]);
  const [selectedFamilyTreeId, setSelectedFamilyTreeId] = useState<string>("");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserGPMemberId, setCurrentUserGPMemberId] = useState<string>("");
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string; timestamp: Date }>({
    isOpen: false,
    message: '',
    timestamp: new Date()
  });
  const [recurrenceEndTimeError, setRecurrenceEndTimeError] = useState<string>('');
  const [recurrenceValidationError, setRecurrenceValidationError] = useState<string>('');

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

  // Watch startTime and endTime for validation and lunar display
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const disablePastHours = (current: Dayjs | null) => {
    if (!current) return {};
    const now = dayjs();
    if (current.isBefore(now, 'day')) {
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }
    if (current.isSame(now, 'day')) {
      const disabledHours = Array.from({ length: now.hour() }, (_, i) => i);
      const disabledMinutes =
        current.hour() === now.hour()
          ? Array.from({ length: now.minute() }, (_, i) => i)
          : [];
      return {
        disabledHours: () => disabledHours,
        disabledMinutes: () => disabledMinutes,
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
      disabledSeconds: () => [],
    };
  };

  const disableEndDate = (current: Dayjs) => {
    if (!startTime) return false;
    return current.isBefore(dayjs(startTime).startOf('day'));
  };

  const disableEndHours = (current: Dayjs | null) => {
    if (!current || !startTime) {
      return {
        disabledHours: () => [],
        disabledMinutes: () => [],
        disabledSeconds: () => [],
      };
    }
    const start = dayjs(startTime);

    // For DAILY recurrence, only disable times before or equal to startTime on the same day
    if (recurrenceValue === 'DAILY') {
      if (current.isSame(start, 'day')) {
        // Same day: disable hours before startTime, and minutes if same hour
        const disabledHours = Array.from({ length: start.hour() }, (_, i) => i);
        const disabledMinutes =
          current.hour() === start.hour()
            ? Array.from({ length: start.minute() + 1 }, (_, i) => i) // +1 to ensure startTime.minute() is also disabled
            : [];
        return {
          disabledHours: () => disabledHours,
          disabledMinutes: () => disabledMinutes
        };
      }
      // Different day should not happen for DAILY (disabledDate handles this)
      // But if it does, allow all times
      return {
        disabledHours: () => [],
        disabledMinutes: () => [],
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }

    // For other recurrence types, use original logic
    if (current.isBefore(start, 'day')) {
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }
    if (current.isSame(start, 'day')) {
      const disabledHours = Array.from({ length: start.hour() }, (_, i) => i);
      const disabledMinutes =
        current.hour() === start.hour()
          ? Array.from({ length: start.minute() }, (_, i) => i)
          : [];
      return {
        disabledHours: () => disabledHours,
        disabledMinutes: () => disabledMinutes,
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
      disabledSeconds: () => [],
    };
  };

  // Auto-update endTime when isAllDay is checked or startTime changes
  useEffect(() => {
    if (isAllDay && startTime) {
      // When "All Day" is checked, set endTime to 23:59:59 of the same day as startTime
      const startDate = new Date(startTime);
      const newEndTime = new Date(startDate);
      newEndTime.setHours(23, 59, 59, 999); // Set to end of day: 23:59:59.999
      setValue('endTime', newEndTime.toISOString(), { shouldValidate: false });
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
        console.log('📋 Fetching members for family tree:', selectedFamilyTreeId);

        // Use the new member tree API
        const res: any = await familyTreeService.getMemberTree(selectedFamilyTreeId);

        console.log('📋 Member tree API response:', res);

        // Extract member data from the datalist
        const datalist = res?.data?.datalist || [];

        // Map the datalist to member options
        const memberOptions: MemberOption[] = datalist.map((item: any) => ({
          id: item.value.id,
          fullname: item.value.name,
          ftId: selectedFamilyTreeId,
        }));

        console.log('📋 Mapped members:', memberOptions.length, 'members found');
        setMembers(memberOptions);
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembers([]);
      }
    };
    fetchMembers();
  }, [selectedFamilyTreeId]);

  // Initialize targetMemberId to '' (group event) when members are loaded (if not set)
  useEffect(() => {
    if (members.length > 0 && targetMemberId === undefined && currentUserGPMemberId) {
      // Default to group event for new events
      if (!eventSelected || !eventSelected.id) {
        setTargetMemberId('');
      }
    }
  }, [members, currentUserGPMemberId, eventSelected]);

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
    const options = Object.values(EVENT_TYPE).reduce((acc: typeof eventTypes, type) => {
      const config = EVENT_TYPE_CONFIG[type];
      if (!config) {
        console.warn('[GPEventDetailsModal] Missing EVENT_TYPE_CONFIG for type:', type);
        return acc;
      }

      acc.push({
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {config.icon ? (
              <img src={config.icon} alt={type} style={{ width: '20px', height: '20px' }} />
            ) : (
              <span
                style={{
                  width: 20,
                  height: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '50%',
                  fontSize: 10,
                  color: '#374151',
                }}
              >
                ?
              </span>
            )}
            <span>{config.label || type}</span>
          </div>
        ),
        value: type,
      });
      return acc;
    }, [] as typeof eventTypes);

    setEventType(options);
  }, []);

  // Populate form when editing an existing event
  useEffect(() => {
    if (isOpenModal && eventSelected && (eventSelected as any).id && (eventSelected as any).id !== '') {
      // This is edit mode - populate form with existing data
      const event = eventSelected as any;

      // Helper to format date for datetime-local input
      const formatDateTime = (dateValue: any) => {
        if (!dateValue) return '';
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return format(date, "yyyy-MM-dd'T'HH:mm");
      };

      // Normalize eventType from API (can be number or string)
      const normalizedEventType = normalizeEventType(event.eventType);
      console.log('🔍 Edit mode - eventType normalization:', {
        original: event.eventType,
        normalized: normalizedEventType,
        type: typeof event.eventType
      });

      // Set basic form fields
      reset({
        name: event.name || '',
        eventType: normalizedEventType, // Use normalized eventType
        startTime: formatDateTime(event.startTime),
        endTime: formatDateTime(event.endTime),
        location: event.location || null,
        locationName: event.locationName || null,
        recurrence: event.recurrenceType || 'ONCE',
        description: event.description || null,
        imageUrl: event.imageUrl || null,
        recurrenceEndTime: event.recurrenceEndTime || null,
        address: event.address || null,
        isAllDay: event.isAllDay || false,
        isPublic: true,
        isLunar: event.isLunar || false,
      });

      // Set state fields
      setIsAllDay(event.isAllDay || false);
      setIsLunar(event.isLunar || false);

      // Set family tree ID
      if (event.ftId) {
        setSelectedFamilyTreeId(event.ftId);
      }

      // Set target member ID
      // If targetMemberId matches current user's GPMemberId, show as 'self'
      if (event.targetMemberId) {
        if (event.targetMemberId === currentUserGPMemberId) {
          setTargetMemberId('self');
        } else {
          setTargetMemberId(event.targetMemberId);
        }
      } else {
        // Empty string means "group event"
        setTargetMemberId('');
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
    } else if (isOpenModal) {
      // This is create mode (new event or eventSelected.id is empty)
      const event = eventSelected as any;

      console.log('🆕 Create mode - eventSelected:', event);
      console.log('🆕 Create mode - startTime:', event?.startTime);
      console.log('🆕 Create mode - endTime:', event?.endTime);

      // Helper to format date for datetime-local input
      const formatDateTime = (dateValue: any) => {
        if (!dateValue) return '';
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
        console.log('📅 formatDateTime:', dateValue, '→', formatted);
        return formatted;
      };

      // Auto-fill start and end times if not provided
      const now = new Date();
      const defaultStartTime = new Date(now);
      defaultStartTime.setDate(now.getDate() + 1); // Tomorrow
      defaultStartTime.setHours(9, 0, 0, 0); // 9:00 AM

      const defaultEndTime = new Date(now);
      defaultEndTime.setDate(now.getDate() + 2); // Day after tomorrow
      defaultEndTime.setHours(17, 0, 0, 0); // 5:00 PM

      const startTimeValue = event?.startTime
        ? formatDateTime(event.startTime)
        : format(defaultStartTime, "yyyy-MM-dd'T'HH:mm");

      const endTimeValue = event?.endTime
        ? formatDateTime(event.endTime)
        : format(defaultEndTime, "yyyy-MM-dd'T'HH:mm");

      console.log('🕐 Auto-filled startTime:', startTimeValue);
      console.log('🕐 Auto-filled endTime:', endTimeValue);

      // Normalize eventType from eventSelected (can be number or string)
      const normalizedEventType = event?.eventType ? normalizeEventType(event.eventType) : 'OTHER';
      console.log('🔍 Create mode - eventType normalization:', {
        original: event?.eventType,
        normalized: normalizedEventType,
        type: typeof event?.eventType
      });

      reset({
        name: event?.name || '',
        eventType: normalizedEventType, // Use normalized eventType
        startTime: startTimeValue,
        endTime: endTimeValue,
        location: event?.location || null,
        locationName: event?.locationName || null,
        recurrence: event?.recurrenceType || event?.recurrence || 'ONCE',
        description: event?.description || null,
        imageUrl: event?.imageUrl || null,
        recurrenceEndTime: event?.recurrenceEndTime || null,
        address: event?.address || null,
        isAllDay: event?.isAllDay || false,
        isPublic: true,
        isLunar: event?.isLunar || false,
      });
      setIsAllDay(event?.isAllDay || false);
      setIsLunar(event?.isLunar || false);

      // Set target member ID - default to '' (group event) for new events
      if (event?.targetMemberId) {
        // If matches current user's GPMemberId, show as 'self'
        if (event.targetMemberId === currentUserGPMemberId) {
          setTargetMemberId('self');
        } else {
          setTargetMemberId(event.targetMemberId);
        }
      } else {
        setTargetMemberId(''); // Default to group event
      }

      setSelectedMembers([]);
      setPreviewImage(event?.imageUrl || null);
      if (!event?.imageUrl) {
        setFileList([]);
      }
    }
  }, [isOpenModal, eventSelected, reset]);

  // Handle form submission
  const onSubmit = async (data: EventFormData) => {
    setIsSubmit(true);
    try {
      console.log('📋 Form data:', data);
      console.log('📋 EventType from form:', data.eventType);
      console.log('📋 ImageUrl from form:', data.imageUrl ? `${data.imageUrl.substring(0, 50)}...` : 'null');

      // Validate start time is before end time (skip if isAllDay, as endTime is auto-set)
      if (!isAllDay && !isBefore(new Date(data.startTime), new Date(data.endTime))) {
        setErrorPopup({
          isOpen: true,
          message: "Thời gian bắt đầu phải trước thời gian kết thúc",
          timestamp: new Date()
        });
        setIsSubmit(false);
        return;
      }

      // For all-day events, ensure endTime is set to end of startTime's day
      if (isAllDay && data.startTime) {
        const startDate = new Date(data.startTime);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        data.endTime = endDate.toISOString();
      }

      // Validate recurrence end time is greater than or equal to startTime
      if (data.recurrenceEndTime && data.startTime) {
        const recurrenceEnd = dayjs(data.recurrenceEndTime);
        const eventStart = dayjs(data.startTime);

        if (recurrenceEnd.isBefore(eventStart, 'day')) {
          setErrorPopup({
            isOpen: true,
            message: "Ngày kết thúc lặp lại phải lớn hơn hoặc bằng ngày bắt đầu sự kiện",
            timestamp: new Date()
          });
          setRecurrenceEndTimeError('Ngày kết thúc lặp lại phải lớn hơn hoặc bằng ngày bắt đầu sự kiện');
          setIsSubmit(false);
          return;
        }
      }

      // Validate startTime and endTime based on recurrence type
      if (data.recurrence && data.startTime && data.endTime) {
        const start = dayjs(data.startTime);
        const end = dayjs(data.endTime);
        let errorMessage = '';

        switch (data.recurrence) {
          case 'DAILY':
            // Lặp lại hàng ngày: startTime và endTime phải trong cùng một ngày VÀ startTime < endTime
            const isSameDay = start.year() === end.year() &&
              start.month() === end.month() &&
              start.date() === end.date();
            if (!isSameDay) {
              errorMessage = "Lặp lại hàng ngày: Bắt đầu vào và Kết thúc vào phải trong cùng một ngày";
            } else if (!start.isBefore(end)) {
              errorMessage = "Lặp lại hàng ngày: Bắt đầu vào phải nhỏ hơn Kết thúc vào";
            }
            break;
          case 'MONTHLY':
            // Lặp lại hàng tháng: startTime và endTime phải trong cùng một tháng
            if (!start.isSame(end, 'month')) {
              errorMessage = "Lặp lại hàng tháng: Ngày bắt đầu và ngày kết thúc phải trong cùng một tháng";
            }
            break;
          case 'YEARLY':
            // Lặp lại hàng năm: startTime và endTime phải trong cùng một năm
            if (!start.isSame(end, 'year')) {
              errorMessage = "Lặp lại hàng năm: Ngày bắt đầu và ngày kết thúc phải trong cùng một năm";
            }
            break;
          default:
            // ONCE: không cần validation đặc biệt
            break;
        }

        if (errorMessage) {
          setErrorPopup({
            isOpen: true,
            message: errorMessage,
            timestamp: new Date()
          });
          setIsSubmit(false);
          return;
        }
      }

      // Convert eventType and log for debugging
      const eventTypeNumber = convertEventTypeToNumber(data.eventType);
      console.log('📋 EventType conversion:', {
        original: data.eventType,
        converted: eventTypeNumber,
        expected: {
          'FUNERAL': 0,
          'WEDDING': 1,
          'BIRTHDAY': 2,
          'HOLIDAY': 3,
          'OTHER': 4
        }[data.eventType?.toUpperCase() || '']
      });

      // Get the ftId (Family Tree ID)
      // Priority: selectedFamilyTreeId -> eventSelected.ftId -> URL params -> fallback
      const isEditMode = eventSelected && (eventSelected as any).id;
      const ftId = selectedFamilyTreeId ||
        (isEditMode ? (eventSelected as any).ftId : null) ||
        familyTreeId ||
        "822994d5-7acd-41f8-b12b-e0a634d74440";

      if (!ftId) {
        setErrorPopup({
          isOpen: true,
          message: "Không tìm thấy ID gia tộc",
          timestamp: new Date()
        });
        setIsSubmit(false);
        return;
      }

      // Convert targetMemberId based on selection
      // "self" → currentUserGPMemberId
      // "" → null (group event)
      // other → actual member ID
      const actualTargetMemberId = targetMemberId === "self"
        ? currentUserGPMemberId
        : targetMemberId === ""
          ? null
          : targetMemberId;

      // Get image file if selected
      const imageFile = fileList.length > 0 && fileList[0]?.originFileObj
        ? fileList[0].originFileObj
        : null;

      console.log('📸 Image file:', imageFile ? `${imageFile.name} (${(imageFile.size / 1024).toFixed(2)} KB)` : 'None');

      // Call the appropriate API
      let response;
      if (isEditMode) {
        // For edit mode, use the FormData API to support file upload
        if (imageFile) {
          setIsUploadingImage(true);
          toast.info("Đang cập nhật sự kiện với ảnh...", { autoClose: 2000 });
        }

        response = await eventService.updateEventWithFiles((eventSelected as any).id, {
          name: data.name,
          eventType: eventTypeNumber,
          startTime: data.startTime,
          endTime: data.endTime || data.startTime,
          location: data.location || null,
          locationName: data.locationName || null,
          recurrenceType: convertRecurrenceToNumber(data.recurrence),
          ftId: ftId,
          description: data.description || null,
          file: imageFile, // Pass file directly
          referenceEventId: null,
          address: data.address || null,
          isAllDay: isAllDay,
          recurrenceEndTime: data.recurrenceEndTime || null,
          isLunar: isLunar,
          targetMemberId: actualTargetMemberId || null,
          isPublic: isPublic,
          memberIds: selectedMembers.map(m => m.id),
        });

        setIsUploadingImage(false);
      } else {
        // For create mode, use FormData API to support file upload
        if (imageFile) {
          setIsUploadingImage(true);
          toast.info("Đang tạo sự kiện với ảnh...", { autoClose: 2000 });
        }

        response = await eventService.createEventWithFiles({
          name: data.name,
          eventType: eventTypeNumber,
          startTime: data.startTime,
          endTime: data.endTime || data.startTime,
          location: data.location || null,
          locationName: data.locationName || null,
          recurrenceType: convertRecurrenceToNumber(data.recurrence),
          ftId: ftId,
          description: data.description || null,
          file: imageFile, // Pass file directly
          referenceEventId: null,
          address: data.address || null,
          isAllDay: isAllDay,
          recurrenceEndTime: data.recurrenceEndTime || null,
          isLunar: isLunar,
          targetMemberId: actualTargetMemberId || null,
          isPublic: isPublic,
          memberIds: selectedMembers.map(m => m.id),
        });

        setIsUploadingImage(false);
      }

      console.log('API Response:', response);

      if (response.data && response.data.id) {
        const successMessage = isEditMode ? "Cập nhật sự kiện thành công!" : "Tạo sự kiện thành công!";
        toast.success(successMessage);

        setIsOpenModal(false);
        if (handleCreatedEvent) {
          handleCreatedEvent();
        }
        reset();
      } else {
        setErrorPopup({
          isOpen: true,
          message: response.message || `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} sự kiện`,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      console.error(`Error ${eventSelected && (eventSelected as any).id ? 'updating' : 'creating'} event:`, error);
      setErrorPopup({
        isOpen: true,
        message: error?.response?.data?.message || `Có lỗi xảy ra khi ${eventSelected && (eventSelected as any).id ? 'cập nhật' : 'tạo'} sự kiện`,
        timestamp: new Date()
      });
    } finally {
      setIsSubmit(false);
    }
  };

  const handleCancel = () => {
    reset();
    setRecurrenceEndTimeError('');
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
        setErrorPopup({
          isOpen: true,
          message: 'Lỗi khi đọc file ảnh',
          timestamp: new Date()
        });
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
      className="z-[99999]"
      open={isOpenModal}
      onCancel={handleCancel}
      footer={null}
      width={700}
      closeIcon={<X className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Family Tree Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gia tộc <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedFamilyTreeId}
            onChange={(value) => {
              setSelectedFamilyTreeId(value);
              setSelectedMembers([]); // Reset selected members when changing family tree
            }}
            size="large"
            style={{ width: '100%' }}
            placeholder="Chọn gia tộc"
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            showSearch
            disabled={!!(eventSelected && (eventSelected as any).id)} // Disable when editing
            filterOption={(input, option) =>
              (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
            }
            options={familyTrees.map(tree => ({
              label: tree.name,
              value: tree.id,
            }))}
          />
        </div>

        {/* Target Member - Sự kiện cho ai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thành viên tham gia <span className="text-red-500">*</span>
          </label>

          {/* Radio buttons */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="eventTargetType"
                checked={targetMemberId === 'self'}
                onChange={() => {
                  setTargetMemberId('self');
                  setSelectedMembers([]);
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Chỉ mình tôi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="eventTargetType"
                checked={targetMemberId === ''}
                onChange={() => {
                  setTargetMemberId('');
                  console.log('🎯 Selected: Sự kiện gia tộc');
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Thành viên gia tộc</span>
            </label>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            "Chỉ mình tôi" dành riêng cho bạn, "Thành viên gia tộc" để thêm thành viên tham gia sự kiện
          </div>
        </div>

        {/* Member Tagging - Tag thêm thành viên tham gia */}
        {targetMemberId !== 'self' && (
          <div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Tag thành viên tham gia (tùy chọn)
                </label>
                {members.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMembers(members);
                      console.log('✅ Selected all members:', members.length);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    ⚡ Chọn tất cả ({members.length})
                  </button>
                )}
              </div>
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
              <div className="mt-1 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Tag thêm thành viên khác tham gia/được thông báo về sự kiện này
                </div>
                {selectedMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMembers([]);
                      console.log('🗑️ Cleared all selected members');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
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
          </div>
        )}


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
                onChange={(value) => {
                  console.log('🔍 EventType selected:', value);
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>}
        </div>

        {/* All Day Checkbox */}
        <div>
          <Checkbox
            checked={isAllDay}
            onChange={(e) => {
              const newIsAllDay = e.target.checked;
              setIsAllDay(newIsAllDay);

              // When "All Day" is checked, adjust startTime to 00:00:00 and endTime to 23:59:59 of the same day
              if (newIsAllDay && startTime) {
                const startDate = new Date(startTime);
                // Set startTime to 00:00:00 of the same day
                startDate.setHours(0, 0, 0, 0);
                setValue('startTime', startDate.toISOString(), { shouldValidate: false });

                // Set endTime to 23:59:59 of the same day
                const endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                setValue('endTime', endDate.toISOString(), { shouldValidate: false });
              }
            }}
          >
            Sự kiện cả ngày
          </Checkbox>
        </div>

        {/* Lunar Calendar */}
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700 mr-2">
            Sử dụng lịch âm
          </label>
          <Switch
            checked={isLunar}
            onChange={(checked) => setIsLunar(checked)}
          />
        </div>
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
                  { label: 'Hàng tháng', value: 'MONTHLY' },
                  { label: 'Hàng năm', value: 'YEARLY' },
                ]}
                onChange={(value) => {
                  field.onChange(value);
                  // Clear recurrence validation error when recurrence type changes
                  if (recurrenceValidationError) {
                    setRecurrenceValidationError('');
                  }

                  // Auto-adjust endTime based on recurrence type if startTime exists
                  if (startTime && endTime) {
                    const start = dayjs(startTime);
                    const end = dayjs(endTime);
                    let newEndTime = end;

                    switch (value) {
                      case 'DAILY':
                        // Set endTime to same day as startTime, but ensure endTime > startTime
                        // If current endTime is before or equal to startTime, set it to 1 hour after startTime
                        if (end.isBefore(start) || end.isSame(start)) {
                          newEndTime = start.add(1, 'hour');
                        } else {
                          // Keep the time but ensure same day
                          newEndTime = start.hour(end.hour()).minute(end.minute()).second(end.second());
                          // If still same or before, add 1 hour
                          if (!newEndTime.isAfter(start)) {
                            newEndTime = start.add(1, 'hour');
                          }
                        }
                        break;
                      case 'MONTHLY':
                        // Ensure endTime is in the same month as startTime
                        if (!start.isSame(end, 'month')) {
                          newEndTime = start.month(end.month()).date(Math.min(end.date(), start.daysInMonth()));
                        }
                        break;
                      case 'YEARLY':
                        // Ensure endTime is in the same year as startTime
                        if (!start.isSame(end, 'year')) {
                          newEndTime = start.year(end.year());
                        }
                        break;
                    }

                    // Only update if endTime needs to change
                    if (!newEndTime.isSame(end)) {
                      setValue('endTime', newEndTime.toISOString(), { shouldValidate: false });
                    }
                  }
                }}
              />
            )}
          />
        </div>
        {/* Start Date Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bắt đầu vào <span className="text-red-500">*</span>
          </label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <DatePicker
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(value) => {
                    if (!value) {
                      field.onChange(null);
                      return;
                    }
                    const newStartTime = value.toISOString();
                    field.onChange(newStartTime);

                    // If isAllDay is checked, automatically update endTime to end of the same day
                    if (isAllDay) {
                      const startDate = new Date(newStartTime);
                      const endDate = new Date(startDate);
                      endDate.setHours(23, 59, 59, 999);
                      setValue('endTime', endDate.toISOString(), { shouldValidate: false });
                    }

                    // Clear recurrence validation error when startTime changes
                    if (recurrenceValidationError) {
                      setRecurrenceValidationError('');
                    }
                  }}
                  format="DD/MM/YYYY HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  minuteStep={5}
                  disabledDate={(current) => {
                    if (!current) return false;
                    // Only disable dates before today, allow today and future dates
                    return current.isBefore(dayjs(), 'day');
                  }}
                  disabledTime={disablePastHours}
                  className={`w-full ${errors.startTime ? 'border-red-500' : ''}`}
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                />
                {isLunar && field.value && (
                  <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-md border border-blue-200">
                    <div className="flex items-start gap-2">
                      <span><strong className="text-blue-700">Âm lịch:</strong> {(() => {
                        const d = new Date(field.value);
                        const { ngay, thang, nam } = getLunarCanChi(d.getDate(), d.getMonth() + 1, d.getFullYear());
                        return `Ngày ${ngay}, Tháng ${thang}, Năm ${nam}`;
                      })()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          />
          {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
        </div>



        {/* End Date Time - Hidden when All Day is selected */}
        {!isAllDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kết thúc vào <span className="text-red-500">*</span>
            </label>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(value) => {
                      if (!value) {
                        field.onChange(null);
                        setRecurrenceValidationError('');
                        return;
                      }
                      field.onChange(value.toISOString());

                      // Clear error when user selects a value - validation will be done in onOk
                      // This allows user to select date/time without being blocked
                      setRecurrenceValidationError('');
                    }}
                    onOk={(value) => {
                      // Validate when OK is clicked and clear error if valid
                      if (recurrenceValue && recurrenceValue !== 'ONCE' && startTime && value) {
                        const start = dayjs(startTime);
                        const end = dayjs(value);
                        let error = '';

                        switch (recurrenceValue) {
                          case 'DAILY':
                            // Check cùng ngày và startTime < endTime
                            const isSameDay = start.year() === end.year() &&
                              start.month() === end.month() &&
                              start.date() === end.date();
                            if (!isSameDay) {
                              error = "Lặp lại hàng ngày: Bắt đầu vào và Kết thúc vào phải trong cùng một ngày";
                            } else if (start.isSame(end) || !start.isBefore(end)) {
                              error = "Lặp lại hàng ngày: Bắt đầu vào phải nhỏ hơn Kết thúc vào";
                            }
                            break;
                          case 'MONTHLY':
                            if (!start.isSame(end, 'month')) {
                              error = "Lặp lại hàng tháng: Ngày bắt đầu và ngày kết thúc phải trong cùng một tháng";
                            }
                            break;
                          case 'YEARLY':
                            if (!start.isSame(end, 'year')) {
                              error = "Lặp lại hàng năm: Ngày bắt đầu và ngày kết thúc phải trong cùng một năm";
                            }
                            break;
                        }
                        setRecurrenceValidationError(error);
                      } else {
                        // Clear error if recurrence is ONCE or not set
                        setRecurrenceValidationError('');
                      }
                    }}
                    format="DD/MM/YYYY HH:mm"
                    showTime={{ format: 'HH:mm' }}
                    minuteStep={5}
                    disabledDate={(current) => {
                      if (!current) return false;
                      if (!startTime) {
                        return current.isBefore(dayjs().startOf('day'));
                      }

                      // Apply recurrence-based date restrictions
                      if (recurrenceValue && startTime) {
                        const start = dayjs(startTime);

                        switch (recurrenceValue) {
                          case 'DAILY':
                            // Only allow the same day as startTime - disable all other days
                            // Compare year, month, and day explicitly
                            const isSameDay = current.year() === start.year() &&
                              current.month() === start.month() &&
                              current.date() === start.date();
                            if (!isSameDay) {
                              return true; // Disable dates that are NOT the same day
                            }
                            // Allow the same day - no need to disable
                            return false;
                          case 'MONTHLY':
                            // Only allow dates in the same month as startTime
                            const isSameMonth = current.year() === start.year() &&
                              current.month() === start.month();
                            if (!isSameMonth) {
                              return true; // Disable dates outside the month
                            }
                            // Within the same month, still check default validation (can't be before startTime)
                            return disableEndDate(current);
                          case 'YEARLY':
                            // Only allow dates in the same year as startTime
                            const isSameYear = current.year() === start.year();
                            if (!isSameYear) {
                              return true; // Disable dates outside the year
                            }
                            // Within the same year, still check default validation (can't be before startTime)
                            return disableEndDate(current);
                          default:
                            // ONCE: use default validation
                            return disableEndDate(current);
                        }
                      }

                      return disableEndDate(current);
                    }}
                    disabledTime={disableEndHours}
                    className={`w-full ${errors.endTime || recurrenceValidationError ? 'border-red-500' : ''}`}
                    // Don't set status="error" to avoid disabling OK button in DatePicker
                    // Error will be shown via error message below
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    onOpenChange={(open) => {
                      // Clear error when DatePicker opens to allow user to select
                      if (open) {
                        setRecurrenceValidationError('');
                      }
                      // When DatePicker closes, re-validate if needed
                      if (!open && recurrenceValue && recurrenceValue !== 'ONCE' && startTime && field.value) {
                        const start = dayjs(startTime);
                        const end = dayjs(field.value);
                        let error = '';

                        switch (recurrenceValue) {
                          case 'DAILY':
                            // Check cùng ngày và startTime < endTime
                            const isSameDay = start.year() === end.year() &&
                              start.month() === end.month() &&
                              start.date() === end.date();
                            if (!isSameDay) {
                              error = "Lặp lại hàng ngày: Bắt đầu vào và Kết thúc vào phải trong cùng một ngày";
                            } else if (start.isSame(end) || !start.isBefore(end)) {
                              error = "Lặp lại hàng ngày: Bắt đầu vào phải nhỏ hơn Kết thúc vào";
                            }
                            // Nếu cùng ngày và startTime < endTime thì error = '' (không có lỗi)
                            break;
                          case 'MONTHLY':
                            if (!start.isSame(end, 'month')) {
                              error = "Lặp lại hàng tháng: Ngày bắt đầu và ngày kết thúc phải trong cùng một tháng";
                            }
                            break;
                          case 'YEARLY':
                            if (!start.isSame(end, 'year')) {
                              error = "Lặp lại hàng năm: Ngày bắt đầu và ngày kết thúc phải trong cùng một năm";
                            }
                            break;
                        }
                        setRecurrenceValidationError(error);
                      }
                    }}
                  />
                  {isLunar && field.value && (
                    <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-md border border-blue-200">
                      <div className="flex items-start gap-2">
                        <span><strong className="text-blue-700">Âm lịch:</strong> {(() => {
                          const d = new Date(field.value);
                          const { ngay, thang, nam } = getLunarCanChi(d.getDate(), d.getMonth() + 1, d.getFullYear());
                          return `Ngày ${ngay}, Tháng ${thang}, Năm ${nam}`;
                        })()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            />
            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
            {recurrenceValidationError && <p className="text-red-500 text-sm mt-1">{recurrenceValidationError}</p>}
          </div>
        )}

        {/* Helper text for All Day events */}
        {isAllDay && (
          <p className="text-xs text-gray-500 -mt-2">
            Sự kiện cả ngày sẽ tự động kết thúc vào cuối ngày đã chọn
          </p>
        )}


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
                <div>
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(value) => {
                      field.onChange(value ? value.toISOString() : null);
                      // Clear error when user changes the value
                      if (recurrenceEndTimeError) {
                        setRecurrenceEndTimeError('');
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur: recurrenceEndTime must be >= startTime
                      if (field.value && startTime) {
                        const recurrenceEnd = dayjs(field.value);
                        const eventStart = dayjs(startTime);

                        if (recurrenceEnd.isBefore(eventStart, 'day')) {
                          setRecurrenceEndTimeError('Ngày kết thúc lặp lại phải lớn hơn hoặc bằng ngày bắt đầu sự kiện');
                        } else {
                          setRecurrenceEndTimeError('');
                        }
                      }
                    }}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                    size="large"
                    status={recurrenceEndTimeError ? 'error' : ''}
                    disabledDate={(current) => {
                      if (!current) return false;
                      // Disable dates before startTime - ngày kết thúc lặp lại phải >= ngày bắt đầu
                      if (startTime && current.isBefore(dayjs(startTime), 'day')) {
                        return true;
                      }
                      return false;
                    }}
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    placeholder="Chọn ngày kết thúc lặp lại"
                  />
                  {recurrenceEndTimeError && (
                    <p className="text-red-500 text-sm mt-1">{recurrenceEndTimeError}</p>
                  )}
                </div>
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
            Địa chỉ
          </label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Nhập địa chỉ"
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmit || isUploadingImage}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmit || isUploadingImage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmit || isUploadingImage
              ? (fileList.length > 0 ? '📤 Đang tạo sự kiện với ảnh...' : '💾 Đang lưu...')
              : eventSelected
                ? 'Cập nhật'
                : 'Tạo sự kiện'}
          </button>
        </div>
      </form>

      {/* Exception Popup */}
      <ExceptionPopup
        isOpen={errorPopup.isOpen}
        message={errorPopup.message}
        timestamp={errorPopup.timestamp}
        onClose={() => setErrorPopup({ isOpen: false, message: '', timestamp: new Date() })}
      />
    </Modal>
  );
};

export default GPEventDetailsModal;
