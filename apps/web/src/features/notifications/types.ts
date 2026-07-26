export type BxNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
