// ---------------------------------------------------------------------------
// Shared domain types for the Afra & Atiha Wedding 2026 app.
// Field names match the column headers created in the Google Sheet (Setup.gs).
// ---------------------------------------------------------------------------

export type EventKey = "engagement" | "akd" | "ceremony" | "all";

export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  event: EventKey;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  dueDate?: string; // ISO yyyy-mm-dd
  createdAt?: string;
}

export type RsvpStatus = "pending" | "yes" | "no" | "maybe";

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  side: "bride" | "groom" | "both";
  event: EventKey;
  rsvp: RsvpStatus;
  partySize: number;
  tableNo?: string;
  notes?: string;
  invitationSent: boolean;
}

export type BudgetType = "estimate" | "actual";

export interface BudgetItem {
  id: string;
  category: string;
  item: string;
  event: EventKey;
  estimated: number;
  actual: number;
  paid: number;
  vendor?: string;
  notes?: string;
}

export type VendorStatus =
  | "researching"
  | "contacted"
  | "booked"
  | "paid"
  | "cancelled";

export interface Vendor {
  id: string;
  name: string;
  category: string;
  event: EventKey;
  contactName?: string;
  phone?: string;
  email?: string;
  status: VendorStatus;
  cost: number;
  deposit: number;
  notes?: string;
}

export type ShoppingStatus = "to_buy" | "ordered" | "received";

export interface ShoppingItem {
  id: string;
  item: string;
  category: string;
  event: EventKey;
  forWhom?: string;
  status: ShoppingStatus;
  price: number;
  store?: string;
  link?: string;
  notes?: string;
}

export interface WeddingDocument {
  id: string;
  name: string;
  category: string;
  event: EventKey;
  fileUrl: string; // Google Drive view link
  fileId?: string; // Drive file id
  mimeType?: string;
  uploadedAt?: string;
  notes?: string;
}

export type Collection =
  | "tasks"
  | "guests"
  | "budget"
  | "vendors"
  | "shopping"
  | "documents";

// Generic API envelope returned by the Apps Script web app.
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
