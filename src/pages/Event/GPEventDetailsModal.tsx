import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker as AntDatePicker, Select as AntSelect, Button, Modal, Row, Col, Space, Typography, Upload, Image, Switch, Dropdown, message } from "antd";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import moment from "moment";
// import type { Moment } from "moment";
import { FormProvider, useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import eventService from "../../services/eventService";
import { Calendar, X, ChevronDown, Edit2, Image as ImageIcon } from "lucide-react";
import { EVENT_TYPE, EVENT_TYPE_CONFIG } from "./EventTypeLabel";

// Types
interface EventFormData {
  name: string;
  eventType: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string | null;
  location: string | null;
  recurrence: string;
  members: string[];
  gpIds: string[];
  description: string | null;
  imageUrl: string | null;
  recurrenceEndTime: string | null;
  address: string | null;
}

const { Dragger } = Upload;

const eventSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập tên sự kiện"),
  eventType: yup.string().required("Vui lòng chọn loại sự kiện"),
  startTime: yup.date().nullable().required("Vui lòng chọn thời gian bắt đầu"),
  endTime: yup
    .date()
    .nullable()
    .required("Vui lòng chọn thời gian kết thúc")
    .test(
      "endTime-after-startTime",
      "Thời gian kết thúc phải muộn hơn thời gian bắt đầu ít nhất 1 giờ",
      function (value) {
        const { startTime } = this.parent;
        if (!startTime || !value) return true;
        return moment(value).isAfter(moment(startTime).add(0, "hour"));
      }
    ),
});

interface GPEventDetailsModalProps {
  isOpenModal: boolean;
  setIsOpenModal: (value: boolean) => void;
  defaultValues?: EventFormData;
  handleCreatedEvent?: (event?: any) => void;
  eventSelected?: any;
}

interface CityOption {
  label: string;
  value: string;
}

interface MemberOption {
  label: string;
  value: string;
}

const GPEventDetailsModal: React.FC<GPEventDetailsModalProps> = ({
  isOpenModal,
  setIsOpenModal,
  defaultValues,
  handleCreatedEvent,
  eventSelected,
}) => {
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [, setListCity] = useState<CityOption[]>([]);
  const [gpIdSelected, setGPIdSelected] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [, setFileList] = useState<UploadFile[]>([]);
  const [eventTypes, setEventType] = useState<Array<{ label: React.ReactNode; value: string }>>([]);
  const [gpMembersSrc, setGPMembersSrc] = useState<MemberOption[]>([]);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [isLunar, setIsLunar] = useState<boolean>(false);
  const [event, setEvent] = useState<any>({});

  const methods = useForm<EventFormData>({
    defaultValues: defaultValues || {
      name: '',
      eventType: '',
      isAllDay: false,
      startTime: new Date().toISOString(),
      endTime: null,
      location: null,
      recurrence: "ONCE",
      members: [],
      gpIds: [],
      description: null,
      imageUrl: null,
      recurrenceEndTime: null,
      address: null,
    },
    resolver: yupResolver(eventSchema),
  });

  const { handleSubmit, control, formState: { errors }, watch } = methods;
  const startTimeValue = watch("startTime");
  const recurrenceValue = watch("recurrence");

  // Nếu eventSelected có giá trị thì nạp dữ liệu vào form (cho trường hợp update)
  useEffect(() => {
    if (eventSelected) {
      const PREFIX_URL = import.meta.env.VITE_API_URL || '';
      methods.reset({
        name: eventSelected.name || '',
        eventType: eventSelected.eventType || '',
        isAllDay: eventSelected.isAllDay || false,
        startTime: eventSelected.startTime ? moment(eventSelected.startTime).toISOString() : new Date().toISOString(),
        endTime: eventSelected.endTime ? moment(eventSelected.endTime).toISOString() : null,
        location: eventSelected.location || null,
        recurrence: eventSelected.recurrence || "ONCE",
        members: eventSelected.members || [],
        gpIds: eventSelected.gpIds || [],
        description: eventSelected.description || null,
        imageUrl: eventSelected.imageUrl ? `${PREFIX_URL}/${eventSelected.imageUrl}` : null,
        recurrenceEndTime: eventSelected.recurrenceEndTime || null,
        address: eventSelected.address || null,
      });
      setGPIdSelected(eventSelected.gpIds || []);
      setIsAllDay(eventSelected.isAllDay);
      setPreviewImage(eventSelected.imageUrl ? `${PREFIX_URL}/${eventSelected.imageUrl}` : '');
      setIsLunar(eventSelected.isLunar || false);
      setEvent(eventSelected);
    }
  }, [eventSelected, methods]);

  useEffect(() => {
    getCity();
    setEventType(
  Object.values(EVENT_TYPE).map((type) => ({
    label: (
      <label key={type} className={`flex items-center gap-1 ${type}`}>
        <img
          className="w-4 h-4"
          src={EVENT_TYPE_CONFIG[type].icon}
          alt={EVENT_TYPE_CONFIG[type].label}
        />
        <span className={`event-type-text ${type}`}>
          {EVENT_TYPE_CONFIG[type].label}
        </span>
      </label>
    ),
    value: type,
  }))
);

  }, []);

  useEffect(() => {
    if (gpIdSelected.length > 0) {
      getMembersSrc();
    } else {
      setGPMembersSrc([]);
    }
  }, [gpIdSelected]);

  const handleSave = async (data: EventFormData) => {
    const payload = {
      ...event,
      ...data,
      startTime: moment(data.startTime).format("MM/DD/YYYY HH:mm"),
      endTime: moment(data.endTime).format("MM/DD/YYYY HH:mm"),
      recurrenceEndTime: data.recurrenceEndTime ? moment(data.recurrenceEndTime).format("MM/DD/YYYY HH:mm") : null,
      imageUrl: previewImage,
      isLunar: isLunar
    };

    try {
      setIsSubmit(true);
      if (eventSelected) {
        await eventService.updateEvent({ ...payload, id: eventSelected.id });
        message.success("Cập nhật sự kiện thành công");
      } else {
        // Nếu tạo mới
        await eventService.createEvent(payload);
        message.success("Tạo sự kiện thành công");
      }
      if (handleCreatedEvent) {
        handleCreatedEvent();
      }
      setIsOpenModal(false);
      setIsSubmit(false);
    } catch (error) {
      message.error(eventSelected ? "Cập nhật sự kiện không thành công" : "Tạo sự kiện không thành công");
      setIsSubmit(false);
    }
  };


  const getCity = async () => {
    // TODO: Implement ProfileService
    // await ProfileService.getCity().then((response) => {
    //   // Use response here if needed
    // });
  };

  const getMembersSrc = async () => {
    // TODO: Implement GPMemberService
    // await GPMemberService.getMemberByGpIds(gpIdSelected).then((response) => {
    //   setGPMembersSrc(response.value);
    // });
    setGPMembersSrc([]);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file?.url && !file?.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || file.preview || '');
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleChange = async (info: UploadChangeParam) => {
    const newFileList = info.fileList;
    setFileList(newFileList);
    if (newFileList[0]) {
      await handlePreview(newFileList[0]);
    }
  };

  const onRemoveImage = () => {
    setFileList([]);
    setPreviewImage("");
  };

  const handleMenuClick = (e: { key: string }) => {
    const updateAll = e.key === "2";
    handleSubmit((data) => {
      const updatedData = {
        ...eventSelected,
        ...data,
        isUpdateAll: updateAll
      };
      handleSave(updatedData);
    })();
  };

  const items = [
    {
      label: 'Cập nhật sự kiện này',
      key: '1'
    },
    {
      label: 'Cập nhật chuỗi sự kiện',
      key: '2',
    },
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const uploadButton = (
    <div className="text-center">
      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto" />
      <div className="mt-2 text-sm text-gray-500">Bấm chọn hoặc kéo thả hình ảnh</div>
    </div>
  );

  return (
    <Modal
      open={isOpenModal}
      title={eventSelected ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
      onCancel={() => setIsOpenModal(false)}
      width={900}
      footer={[
        <Button key="cancel" onClick={() => setIsOpenModal(false)}>
          Hủy
        </Button>,
        ...(!eventSelected || eventSelected.recurrence === "ONCE"
          ? [
            <Button
              key="save"
              type="primary"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={handleSubmit(handleSave)}
              disabled={isSubmit}
            >
              Lưu
            </Button>,
          ]
          : []),
        ...(eventSelected &&
          eventSelected.id &&
          eventSelected.recurrence !== "ONCE"
          ? [
            <Dropdown
              key="dropdown"
              menu={{
                items: [
                  { label: "Cập nhật sự kiện này", key: "1" },
                  { label: "Cập nhật chuỗi sự kiện", key: "2" },
                ],
                onClick: (e) => {
                  const updateAll = e.key === "2";
                  handleSubmit((data) => {
                    data = { ...eventSelected, ...data, isUpdateAll: updateAll };
                    handleSave(data);
                  })();
                },
              }}
            >
              <Button type="primary" icon={<Edit2 className="w-4 h-4" />} disabled={isSubmit}>
                <Space>
                  Lưu
                  <ChevronDown className="w-4 h-4" />
                </Space>
              </Button>
            </Dropdown>,
          ]
          : []),
      ]}
      className="gp-event-details-modal"
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto", paddingBottom: 16 },
      }}
    >
      <FormProvider {...methods}>
        <form className="py-2">
          {/* ============ THÔNG TIN CƠ BẢN ============ */}

          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form layout="vertical">
                <Form.Item
                  label={
                    <>
                      Tên sự kiện <span className="text-red-500">*</span>
                    </>
                  }
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="Nhập tên sự kiện" />
                </Form.Item>
              </Form>
            )}
          />

          {/* ============ THỜI GIAN + LẶP LẠI ============ */}
          <Row gutter={16}>
            {/* Loại sự kiện */}
            <Col xs={24} md={12}>
              <Controller
                name="eventType"
                control={control}
                render={({ field, fieldState }) => (
                  <Form layout="vertical">
                    <Form.Item
                      label={
                        <>
                          Loại sự kiện <span className="text-red-500">*</span>
                        </>
                      }
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <AntSelect
                        {...field}
                        placeholder="Chọn loại sự kiện"
                        options={eventTypes}
                        className="w-full"
                      />
                    </Form.Item>
                  </Form>
                )}
              />
            </Col>

            {/* Lặp lại */}
            <Col xs={24} md={12}>
              <Controller
                name="recurrence"
                control={control}
                defaultValue="ONCE"
                render={({ field, fieldState }) => (
                  <Form layout="vertical">
                    <Form.Item
                      label="Lặp lại"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <AntSelect
                        {...field}
                        placeholder="Không lặp lại"
                        options={[
                          { label: "Không lặp lại", value: "ONCE" },
                          { label: "Mỗi ngày", value: "DAILY" },
                          { label: "Mỗi tuần", value: "WEEKLY" },
                          { label: "Mỗi tháng", value: "MONTHLY" },
                          { label: "Mỗi năm", value: "YEARLY" },
                        ]}
                        className="w-full"
                      />
                    </Form.Item>
                  </Form>
                )}
              />
            </Col>
          </Row>

          {/* ============ THỜI GIAN KẾT THÚC LẶP LẠI (hiện khi có lặp lại) ============ */}
          {(recurrenceValue === "DAILY" ||
            recurrenceValue === "WEEKLY" ||
            recurrenceValue === "MONTHLY" ||
            recurrenceValue === "YEARLY") && (
              <Row gutter={24}>
                <Col xs={24}>
                  <Controller
                    name="recurrenceEndTime"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form layout="vertical">
                        <Form.Item
                          label="Thời gian kết thúc lặp lại"
                          validateStatus={fieldState.error ? "error" : ""}
                          help={fieldState.error?.message}
                        >
                          <AntDatePicker
                            {...field}
                            placeholder="Chọn ngày kết thúc lặp lại"
                            showTime={false}
                            format="DD/MM/YYYY"
                            value={field.value ? moment(field.value) : null}
                            onChange={(date) =>
                              field.onChange(date ? date.toISOString() : null)
                            }
                            disabledDate={(current) => {
                              const yearsFromNow = moment().add(
                                recurrenceValue === "YEARLY"
                                  ? 100
                                  : recurrenceValue === "DAILY"
                                    ? 1
                                    : 5,
                                "years"
                              );
                              return (
                                (current && startTimeValue
                                  ? current < moment(startTimeValue)
                                  : false) || current > yearsFromNow.endOf("day")
                              );
                            }}
                            prefix={<Calendar className="w-4 h-4" />}
                            className="w-full"
                          />
                        </Form.Item>
                      </Form>
                    )}
                  />
                </Col>
              </Row>
            )}

        {/* ============ THỜI GIAN BẮT ĐẦU / KẾT THÚC / CẢ NGÀY ============ */}
<Row gutter={16} align="bottom">
  {/* Thời gian bắt đầu */}
  <Col xs={24} md={9}>
    <Controller
      name="startTime"
      control={control}
      render={({ field, fieldState }) => (
        <Form layout="vertical" className="h-full">
          <Form.Item
            label={
              <>
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </>
            }
            validateStatus={fieldState.error ? "error" : ""}
            help={fieldState.error?.message}
            className="mb-0"
          >
            <AntDatePicker
              {...field}
              placeholder="Chọn ngày giờ bắt đầu"
              showTime={!isAllDay}
              format={isAllDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"}
              value={field.value ? moment(field.value) : moment()}
              onChange={(date) =>
                field.onChange(date ? date.toISOString() : null)
              }
              className="w-full"
            />
          </Form.Item>
        </Form>
      )}
    />
  </Col>

  {/* Thời gian kết thúc */}
  <Col xs={24} md={9}>
    <Controller
      name="endTime"
      control={control}
      render={({ field, fieldState }) => (
        <Form layout="vertical" className="h-full">
          <Form.Item
            label={
              <>
                Thời gian kết thúc <span className="text-red-500">*</span>
              </>
            }
            validateStatus={fieldState.error ? "error" : ""}
            help={fieldState.error?.message}
            className="mb-0"
          >
            <AntDatePicker
              {...field}
              placeholder="Chọn ngày giờ kết thúc"
              showTime={!isAllDay}
              format={isAllDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"}
              value={field.value ? moment(field.value) : null}
              onChange={(date) =>
                field.onChange(date ? date.toISOString() : null)
              }
              disabledDate={(current) =>
                current && startTimeValue
                  ? current < moment(startTimeValue)
                  : false
              }
              className="w-full"
            />
          </Form.Item>
        </Form>
      )}
    />
  </Col>

  {/* Cả ngày */}
  <Col xs={24} md={6}>
    <Form layout="vertical" className="h-full flex flex-col justify-end">
      <Form.Item label="Cả ngày" className="mb-0">
        <Controller
          name="isAllDay"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={(checked) => {
                field.onChange(checked);
                setIsAllDay(checked);
              }}
            />
          )}
        />
      </Form.Item>
    </Form>
  </Col>
</Row>


          {/* ============ ĐỊA CHỈ ============ */}
          <div>
            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Form layout="vertical">
                  <Form.Item
                    label="Địa điểm"
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input {...field} placeholder="Nhập địa chỉ" />
                  </Form.Item>
                </Form>
              )}
            />
          </div>

          {/* ============ GIA PHẢ & THÀNH VIÊN ============ */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Controller
                name="gpIds"
                control={control}
                render={({ field, fieldState }) => (
                  <Form layout="vertical">
                    <Form.Item
                      label="Gia phả"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <AntSelect
                        {...field}
                        mode="multiple"
                        placeholder="Chọn gia phả"
                        onChange={(value) => {
                          field.onChange(value);
                          setGPIdSelected(value);
                          methods.setValue("members", []);
                        }}
                        className="w-full"
                      />
                    </Form.Item>
                  </Form>
                )}
              />
            </Col>

            <Col xs={24} md={12}>
              <Controller
                name="members"
                control={control}
                render={({ field, fieldState }) => (
                  <Form layout="vertical">
                    <Form.Item
                      label="Thành viên"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <AntSelect
                        {...field}
                        mode="multiple"
                        placeholder="Chọn thành viên"
                        options={gpMembersSrc}
                        className="w-full"
                      />
                    </Form.Item>
                  </Form>
                )}
              />
            </Col>
          </Row>

          {/* ============ MÔ TẢ ============ */}
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Form layout="vertical">
                  <Form.Item
                    label="Mô tả thành viên"
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input.TextArea
                      {...field}
                      placeholder="Nhập mô tả"
                      rows={4}
                    />
                  </Form.Item>
                </Form>
              )}
            />
          </div>

          {/* ============ HÌNH ẢNH ============ */}
          <div>
            <Typography.Text strong>Kéo thả ảnh vào đây hoặc <span className="text-blue-500 cursor-pointer">tải lên</span></Typography.Text>
            {!previewImage ? (
              <Dragger
                showUploadList={false}
                beforeUpload={() => false}
                listType="picture-card"
                onChange={handleChange}
                multiple={false}
                accept="image/*"
              >
                {uploadButton}
              </Dragger>
            ) : (
              <div className="relative w-full h-[300px] text-center">
                <Image src={previewImage} preview={false} />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<X className="w-4 h-4" />}
                  onClick={onRemoveImage}
                  className="!absolute top-2.5 right-2.5"
                />
              </div>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>

  );
};

export default GPEventDetailsModal;
