// @ts-nocheck
import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { Button, Dropdown, Image, Space } from "antd";
import moment from "moment";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  RetweetOutlined,
  UserOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  DownOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import EventTitle from "./EventTitle";

const GPEventInfoModal = ({
  isOpenModal,
  setIsOpenModal,
  defaultValues = {},
  setConfirmDeleteModal,
  setConfirmDeleteAllModal,
  setIsOpenGPEventDetailsModal,
  setEventSelected,
}) => {
  const {
    name,
    start,
    end,
    recurrence,
    memberNames,
    gpNames,
    description,
    imageUrl,
    isOwner,
    type,
    address,
    isLunar
  } = defaultValues;

  const startTimeText = start
    ? moment(start).format("dddd, DD/MM/YYYY - HH:mm")
    : "";
  const endTimeText = end
    ? moment(end).format("dddd, DD/MM/YYYY - HH:mm")
    : "";
  // const endTimeText = end ? moment(end).format("HH:mm") : "";
  const memberNamesJoin = Array.isArray(memberNames) ? memberNames.join(", ") : "";
  const gpNamesJoin = Array.isArray(gpNames) ? gpNames.join(", ") : "";

  useEffect(() => {
    // Nếu cần load thêm dữ liệu khác, có thể gọi ở đây
  }, []);

  const handleMenuClick = (e) => {
    if (e.key === "1") {
      setConfirmDeleteModal(true);
    }
    if (e.key === "2") {
      setConfirmDeleteAllModal(true);
    }
  };

  const handelOnUpdate = () => {
    setIsOpenModal(false);
    setIsOpenGPEventDetailsModal(true);
  };

  const handleOnCancel = () => {
    setEventSelected(null);
    setIsOpenModal(false);
  };

  const items = [
    {
      label: 'Xóa lần này',
      key: '1'
    },
    {
      label: 'Xóa chuỗi sự kiện',
      key: '2',
    },
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <Modal
      show={isOpenModal}
      size="lg"
      onHide={() => setIsOpenModal(false)}
    >
      <Modal.Header closeButton>
        <EventTitle
          type={type}
          title={name}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="gp-event-info">
          {imageUrl && (
            <div style={{ position: "relative", width: "100%" }}>
              <Image
                src={`${PREFIX_URL}/${imageUrl}`}
                preview={false}
                className="responsive-img"
                alt="Event"
              />
            </div>
          )}

          <p className="d-flex align-items-center mb-3 mt-4">
            <CalendarOutlined width={24} height={24} style={{ marginRight: 8 }} />
            <span className="text-uppercase">{startTimeText} - {endTimeText}</span>
            {
              isLunar && (
                <>
                  <span className="text-uppercase" style={{ marginLeft: 8 }}>
                    </span>
                  <span className="text-uppercase">
                  {`Âm lịch - 
                  ${moment(start).lunar().date()}/${moment(start).lunar().month() + 1}/${moment(start).lunar().year()} ${moment(start).format("HH:mm")}
                  - 
                  ${moment(end).lunar().date()}/${moment(end).lunar().month() + 1}/${moment(end).lunar().year()} ${moment(end).format("HH:mm")}`}
                </span>
                
                </>
              )
            }
          </p>

          {address && (
            <p className="d-flex align-items-center mb-4">
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              {address ? `${address}` : ""}
            </p>
          )}

          {recurrence && (
            <p className="d-flex align-items-center mb-4">
              <RetweetOutlined style={{ marginRight: 8 }} />
              {recurrence === "ONCE"
                ? "Không lặp lại"
                : recurrence === "DAILY"
                  ? "Mỗi ngày"
                  : recurrence === "WEEKLY"
                    ? "Mỗi tuần"
                    : recurrence === "MONTHLY"
                      ? "Mỗi tháng"
                      : recurrence === "YEARLY"
                        ? "Mỗi năm"
                        : "Khác"}
            </p>
          )}

          {memberNamesJoin && (
            <p className="d-flex align-items-center mb-4">
              <UserOutlined style={{ marginRight: 8 }} />
              {memberNamesJoin}
            </p>
          )}

          {gpNamesJoin && (
            <p className="d-flex align-items-center mb-4">
              <ApartmentOutlined style={{ marginRight: 8 }} />
              {gpNamesJoin}
            </p>
          )}

          {description && (
            <div className="d-flex align-items-start">
              <FileTextOutlined style={{ marginRight: 8, marginTop: 4 }} />
              <div
                style={{ whiteSpace: "normal" }}
                dangerouslySetInnerHTML={{ __html: decode(description) }}
              />
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        {
          isOwner && (
            <>
              <Button onClick={() => handleOnCancel()}>Hủy</Button>
              {
                recurrence === "ONCE" && (
                  <Button icon={<DeleteOutlined />} onClick={() => {setConfirmDeleteModal(true);}}>
                    <Space>
                      Xóa
                    </Space>
                  </Button>)
              }
              {
                recurrence !== "ONCE" && (
                  <Dropdown menu={menuProps} danger>
                    <Button icon={<DeleteOutlined />}>
                      <Space>
                        Xóa
                        <DownOutlined />
                      </Space>
                    </Button>
                  </Dropdown>)
              }
              <Button type="primary" onClick={() => handelOnUpdate()}>
                Chỉnh sửa
              </Button>
            </>
          )
        }
        {
          !isOwner && (<Button onClick={() => setIsOpenModal(false)}>Đóng</Button>)
        }

      </Modal.Footer>
    </Modal>
  );
};

export default GPEventInfoModal;
