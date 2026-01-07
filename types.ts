export type UserRole = 'Employee' | 'ESS' | 'Admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: UserRole;
  username: string; // usually email
  passwordHash: string;
  isDefaultPassword: boolean;
}

export enum RequestStatus {
  PENDING = 'Pending',         // Yellow
  NEEDS_INFO = 'Needs Info',   // Orange
  ORDERED = 'Ordered',         // Green
  RECEIVED = 'Received',       // Teal/Dark Green
  REJECTED = 'Rejected',       // Red
  DRAFT = 'Draft',
  CANCELLED = 'Cancelled'
}

export enum Priority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface LineItem {
  id: string;
  name: string;
  description: string;
  vendor: string;
  mfgPartNumber: string;
  url: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
}

export interface Message {
  id: string;
  sender: UserRole;
  senderName: string;
  text: string;
  timestamp: string;
  attachments: string[];
}

export interface ApprovalEvent {
  id: string;
  role: UserRole;
  actorName: string;
  action: 'Submitted' | 'Resubmitted' | 'Ordered' | 'Received' | 'Rejected' | 'Info Requested' | 'Edited';
  timestamp: string;
  note?: string;
}

export interface PurchaseRequest {
  id: string;
  projectCode: string;
  requesterName: string;
  createdAt: string;
  updatedAt: string;
  neededByDate: string;
  priority: Priority;
  status: RequestStatus;
  items: LineItem[];
  messages: Message[];
  approvalTimeline: ApprovalEvent[];
  totalAmount: number;
  notes: string;
}

export type ViewState = 'dashboard' | 'new_request' | 'edit_request' | 'detail' | 'analytics' | 'admin_panel';

export interface AppState {
  currentView: ViewState;
  selectedRequestId: string | null;
  currentUser: User | null;
}