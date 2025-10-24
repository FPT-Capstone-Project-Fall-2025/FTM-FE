// @ts-nocheck
import { useEffect, useState } from "react";
import { Form, Input, DatePicker, Select, Button, Modal, Row, Col, Space, Typography, Upload, Image, Switch, Dropdown } from "antd";
import moment from "moment";
import { FormProvider, useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import eventService from "../../services/eventService";
import { CalendarOutlined, CloseCircleOutlined, DownOutlined, EditOutlined, FileImageOutlined } from "@ant-design/icons";
import { EVENT_TYPE, EVENT_TYPE_CONFIG } from "./EventTypeLabel";

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
  defaultValues?: any;
  handleCreatedEvent?: (event: any) => void;
  eventSelected?: any;
}

const GPEventDetailsModal = ({
  isOpenModal,
  setIsOpenModal,
  defaultValues,
  handleCreatedEvent,
  eventSelected,
}: GPEventDetailsModalProps) => {
  const [isAllDay, setIsAllDay] = useState(false);
  const [listCity, setListCity] = useState([]);
  const [gpIdSelected, setGPIdSelected] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [eventTypes, setEventType] = useState([]);
  const [gpMembersSrc, setGPMembersSrc] = useState([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const [isLunar, setIsLunar] = useState(false);
  const [event, setEvent] = useState({});

  const methods = useForm({
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
      setPreviewImage(eventSelected.imageUrl ? `${PREFIX_URL}/${eventSelected.imageUrl}` : null);
      setIsLunar(eventSelected.isLunar || false);
      setEvent(eventSelected);
    }
  }, [eventSelected, methods]);

  useEffect(() => {
    getCity();
    setEventType(Object.values(EVENT_TYPE).map((type) => (
      {
        label: (<label key={type} className={`${type}`}>
          <span>
            <img className="px-1" src={EVENT_TYPE_CONFIG[type].icon} alt={EVENT_TYPE_CONFIG[type].icon} />
            <span className={`event-type-text  ${type}`}>
              {EVENT_TYPE_CONFIG[type].label}
            </span>
          </span>
        </label>),
        value: type
      }
    )));
  }, []);

  useEffect(() => {
    if (gpIdSelected.length > 0) {
      getMembersSrc();
    } else {
      setGPMembersSrc([]);
    }
  }, [gpIdSelected]);

  const handleSave = async (data) => {
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
      handleCreatedEvent();
      setIsOpenModal(false);
      setIsSubmit(false);
    } catch (error) {
      Ui.showErrors(eventSelected ? "Cập nhật sự kiện không thành công" : "Tạo sự kiện không thành công");
      setIsSubmit(false);
    }
  };


  const getCity = async () => {
    // TODO: Implement ProfileService
    // await ProfileService.getCity().then((response) => {
    //   setListCity(response);
    // });
    setListCity([]);
  };

  const getMembersSrc = async () => {
    // TODO: Implement GPMemberService
    // await GPMemberService.getMemberByGpIds(gpIdSelected).then((response) => {
    //   setGPMembersSrc(response.value);
    // });
    setGPMembersSrc([]);
  };

  const handlePreview = async (file) => {
    if (!file?.url && !file?.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleChange = async ({ fileList: newFileList }) => {
    setFileList(newFileList);
    handlePreview(newFileList[0]);
  };

  const onRemoveImage = () => {
    setFileList([]);
    setPreviewImage("");
  };

  const handleMenuClick = (e) => {
    const updateAll = e.key === "2";
    handleSubmit((data) => {
      data = {
        ...eventSelected,
        ...data,
        isUpdateAll: updateAll
      };
      handleSave(data);
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
    <div>
      <FileImageOutlined className="icon-image" />
      <div style={{ marginTop: 8 }}>Bấm chọn hoặc kéo thả hình ảnh</div>
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
              icon={<EditOutlined />}
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
              <Button type="primary" icon={<EditOutlined />} disabled={isSubmit}>
                <Space>
                  Lưu
                  <DownOutlined />
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
        <form style={{ padding: "8px 0" }}>
          {/* ============ THÔNG TIN CƠ BẢN ============ */}
          <div style={{ marginBottom: 16 }}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form layout="vertical">
                  <Form.Item
                    label={
                      <>
                        Tên sự kiện <span style={{ color: "red" }}>*</span>
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
          </div>

          {/* ============ THỜI GIAN ============ */}
          <Row gutter={16} style={{ marginBottom: 16 }}>

            <Col xs={24} md={9}>
              <Controller
                name="eventType"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    field={field}
                    fieldState={fieldState}
                    label="Loại sự kiện"
                    placeholder="Chọn loại sự kiện"
                    sort={false}
                    options={eventTypes}
                    required
                  />
                )}
              />
            </Col>
            <Col xs={24} md={9}>

              <Controller
                name="startTime"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    field={field}
                    fieldState={fieldState}
                    label="Thời gian bắt đầu"
                    placeholder="Chọn ngày giờ bắt đầu"
                    showTime={!isAllDay}
                    format={isAllDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"}
                    value={field.value ? moment(field.value) : moment()}
                    onChange={(date) =>
                      field.onChange(date ? date.toISOString() : null)
                    }
                    required
                    onSelectedLunar={setIsLunar}
                    isLunar={isLunar}
                  />
                )}
              />
            </Col>

            <Col xs={24} md={9}>
              <Controller
                name="endTime"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    field={field}
                    fieldState={fieldState}
                    label="Thời gian kết thúc"
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
                    required
                    prefix={<CalendarOutlined />}
                    onSelectedLunar={setIsLunar}
                    isLunar={isLunar}
                  />
                )}
              />
            </Col>

            <Col xs={24} md={6} className="center-content">
              <Form layout="vertical">
                <Form.Item label="Cả ngày">
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

          {/* ============ LẶP LẠI ============ */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Controller
                name="recurrence"
                control={control}
                defaultValue="ONCE"
                render={({ field, fieldState }) => (
                  <Select
                    label="Lặp lại"
                    field={field}
                    fieldState={fieldState}
                    sort={false}
                    options={[
                      { label: "Không lặp lại", value: "ONCE" },
                      { label: "Mỗi ngày", value: "DAILY" },
                      { label: "Mỗi tuần", value: "WEEKLY" },
                      { label: "Mỗi tháng", value: "MONTHLY" },
                      { label: "Mỗi năm", value: "YEARLY" },
                    ]}
                    placeholder="Không lặp lại"
                    required
                  />
                )}
              />
            </Col>

            <Col xs={24} md={12}>
              {(recurrenceValue === "DAILY" ||
                recurrenceValue === "WEEKLY" ||
                recurrenceValue === "MONTHLY" ||
                recurrenceValue === "YEARLY") && (
                  <Controller
                    name="recurrenceEndTime"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        field={field}
                        fieldState={fieldState}
                        label="Thời gian kết thúc lặp lại"
                        placeholder="Chọn ngày kết thúc lặp lại"
                        showTime={false}
                        format={"DD/MM/YYYY"}
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
                        prefix={<CalendarOutlined />}
                        onSelectedLunar={setIsLunar}
                        isLunar={isLunar}
                      />
                    )}
                  />
                )}
            </Col>
          </Row>

          {/* ============ ĐỊA CHỈ ============ */}
          <div style={{ marginBottom: 16 }}>
            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Form layout="vertical">
                  <Form.Item
                    label="Nơi diễn ra"
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
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Controller
                name="gpIds"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    multiple
                    label="Gia phả"
                    field={field}
                    fieldState={fieldState}
                    sourceUrl="/api/lookup/gps-by-user"
                    placeholder="Chọn gia phả"
                    mapOptions={(data) =>
                      data.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))
                    }
                    onChange={(value) => {
                      field.onChange(value);
                      setGPIdSelected(value);
                      methods.setValue("members", []);
                    }}
                  />
                )}
              />
            </Col>

            <Col xs={24} md={12}>
              <Controller
                name="members"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    multiple
                    label="Thành viên"
                    field={field}
                    fieldState={fieldState}
                    options={gpMembersSrc}
                    placeholder="Chọn thành viên"
                    mapOptions={(data) =>
                      data.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))
                    }
                    onChange={(value) => field.onChange(value)}
                  />
                )}
              />
            </Col>
          </Row>

          {/* ============ MÔ TẢ ============ */}
          <div style={{ marginBottom: 16 }}>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Form layout="vertical">
                  <Form.Item
                    label="Mô tả"
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
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Hình ảnh</Typography.Text>
            {!previewImage ? (
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                listType="picture-card"
                onChange={handleChange}
                multiple={false}
                accept="image/*"
              >
                {uploadButton}
              </Upload>
            ) : (
              <div
                className="image-container text-center"
                style={{ position: "relative", width: "100%", height: 300 }}
              >
                <Image src={previewImage} preview={false} />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CloseCircleOutlined />}
                  onClick={onRemoveImage}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                  }}
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
