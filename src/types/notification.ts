export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdOn: string;
  type?: string;
  link?: string;
  isActionable: boolean;
  relatedId: string;
}