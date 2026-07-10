export type ImageStatus = "pending" | "completed" | "error";

export type PendingImage = {
  id: number;
  drive_file_id: string;
  file_name: string;
  status: ImageStatus;
  created_at: string;
  content_url: string;
};
