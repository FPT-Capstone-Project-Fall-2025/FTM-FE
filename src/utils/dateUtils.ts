export function formatNotificationTime(createdOn: string): string {
  const createdDate = new Date(createdOn);
  const now = new Date();

  const diffMs = now.getTime() - createdDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} tiếng trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  // Fallback: format as dd-MM-yyyy
  const day = String(createdDate.getDate()).padStart(2, "0");
  const month = String(createdDate.getMonth() + 1).padStart(2, "0");
  const year = createdDate.getFullYear();

  return `${day}-${month}-${year}`;
}