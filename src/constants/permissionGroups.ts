export type Tier = "free" | "premium" | "pro";

export interface PermissionDef {
  key: string;
  name: string;
  desc: string;
  tier: Tier;
}

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: PermissionDef[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "app_access",
    label: "App Access",
    permissions: [
      { key: "app_mobile_view", name: "Mobile app access", desc: "Staff can log in and use the PGease app", tier: "free" },
      { key: "app_guard_view", name: "Guard / gate view", desc: "Simplified entry-exit screen for gate staff", tier: "free" },
      { key: "app_member_view", name: "Tenant-side view", desc: "See food menu, notices, room info like a tenant", tier: "free" },
    ],
  },
  {
    id: "rooms",
    label: "Rooms & Inventory",
    permissions: [
      { key: "room_view", name: "View rooms & share listing", desc: "See all rooms, beds, occupancy. Share room link.", tier: "free" },
      { key: "room_add", name: "Add room", desc: "Create new rooms and bed slots in floor plan", tier: "free" },
      { key: "room_edit", name: "Edit room", desc: "Edit room type, capacity, rent, amenities", tier: "free" },
      { key: "room_delete", name: "Delete room", desc: "Remove a room from the property", tier: "pro" },
    ],
  },
  {
    id: "complaints",
    label: "Complaints & Food",
    permissions: [
      { key: "complaint_view_all", name: "View all complaints", desc: "See every complaint from all tenants", tier: "free" },
      { key: "complaint_edit_assign", name: "Edit & assign complaints", desc: "Assign complaints to staff, change status", tier: "premium" },
      { key: "complaint_raise", name: "Raise new complaint", desc: "Log a complaint on behalf of a tenant", tier: "free" },
      { key: "complaint_view_own", name: "View own complaints", desc: "See only complaints raised by this staff", tier: "free" },
      { key: "complaint_edit_own", name: "Edit own complaints", desc: "Edit or close complaints raised by self", tier: "free" },
      { key: "food_view_edit", name: "View & edit food menu", desc: "See and update daily/weekly food plan", tier: "free" },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    permissions: [
      { key: "account_view_dues", name: "View dues & collections", desc: "See all pending dues and received payments", tier: "free" },
      { key: "account_send_reminders", name: "Send reminders", desc: "Send WhatsApp/SMS payment reminders to tenants", tier: "premium" },
      { key: "account_view_own_dues", name: "View own added dues", desc: "See only dues this staff member created", tier: "free" },
      { key: "account_record_payment", name: "Record payments", desc: "Mark a payment as received (UPI, cash, bank)", tier: "free" },
      { key: "account_otp_cash", name: "Cash collection OTP", desc: "Authenticate cash handover via OTP", tier: "premium" },
      { key: "account_edit_dues", name: "Edit dues", desc: "Modify existing due amount or description", tier: "premium" },
      { key: "account_delete_dues", name: "Delete dues", desc: "Remove a due entry permanently", tier: "pro" },
      { key: "account_add_dues", name: "Add dues", desc: "Create a new due for a tenant", tier: "free" },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    permissions: [
      { key: "expense_view", name: "View expenses", desc: "See all property expense entries", tier: "free" },
      { key: "expense_add", name: "Add expense", desc: "Log a new expense (repair, utility, supply)", tier: "free" },
      { key: "expense_edit", name: "Edit expense", desc: "Modify an existing expense record", tier: "premium" },
      { key: "expense_delete", name: "Delete expense", desc: "Remove an expense entry", tier: "pro" },
    ],
  },
  {
    id: "tenants",
    label: "Tenant / Booking",
    permissions: [
      { key: "tenant_view", name: "View tenants & bookings", desc: "See tenant profiles, room assignments, joining dates", tier: "free" },
      { key: "tenant_add", name: "Add tenant / booking", desc: "Create a new tenant profile or booking", tier: "free" },
      { key: "tenant_edit_basic", name: "Edit tenant (basic)", desc: "Update name, phone, photo, emergency contact", tier: "free" },
      { key: "tenant_edit_rental", name: "Edit rental details", desc: "Change rent amount, due date, plan type", tier: "premium" },
      { key: "tenant_change_room", name: "Change room / property", desc: "Shift tenant to a different room or property", tier: "premium" },
      { key: "tenant_delete", name: "Delete tenant", desc: "Remove an active tenant from the system", tier: "pro" },
      { key: "tenant_delete_old", name: "Delete old tenant", desc: "Remove exited/archived tenant records", tier: "pro" },
      { key: "tenant_opening_balance", name: "Opening balance", desc: "Set initial balance when onboarding mid-cycle", tier: "premium" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    permissions: [
      { key: "report_people", name: "People reports", desc: "Tenant list, occupancy, joining/exit reports", tier: "free" },
      { key: "report_money", name: "Money reports", desc: "P&L, collection, dues, expense reports (PDF/Excel)", tier: "premium" },
      { key: "report_daily", name: "Daily reports", desc: "Daily check: who paid, who's due, today's activity", tier: "free" },
    ],
  },
  {
    id: "refunds",
    label: "Refunds",
    permissions: [
      { key: "refund_add", name: "Add refund", desc: "Process a refund or deposit return for a tenant", tier: "premium" },
      { key: "refund_delete", name: "Delete refund", desc: "Remove a refund entry", tier: "pro" },
    ],
  },
  {
    id: "dashboard",
    label: "Analytics Dashboard",
    permissions: [
      { key: "dashboard_access", name: "Dashboard access", desc: "View analytics dashboard — occupancy, revenue, trends", tier: "free" },
    ],
  },
  {
    id: "eviction",
    label: "Eviction",
    permissions: [
      { key: "eviction_approve", name: "Approve / edit eviction", desc: "Initiate or confirm an eviction request", tier: "pro" },
      { key: "eviction_cancel", name: "Cancel eviction", desc: "Cancel a pending eviction process", tier: "pro" },
    ],
  },
  {
    id: "nightout",
    label: "Night Out & Outing",
    permissions: [
      { key: "nightout_view", name: "View night out requests", desc: "See all pending, approved, active, returned entries", tier: "free" },
      { key: "nightout_approve", name: "Approve / deny night out", desc: "Grant or deny a tenant's night out request", tier: "free" },
      { key: "nightout_mark_returned", name: "Mark tenant returned", desc: "Confirm tenant is back after night out", tier: "free" },
      { key: "nightout_extend", name: "Approve extension", desc: "Approve a request to extend night out duration", tier: "free" },
      { key: "outing_approve", name: "Approve short outing", desc: "Approve/deny short outing requests (girls PG, after curfew)", tier: "free" },
      { key: "nightout_report", name: "Night out report", desc: "View/export night out log and overstay reports", tier: "premium" },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    permissions: [
      { key: "attend_mark", name: "Mark attendance", desc: "Record daily tenant presence/absence", tier: "free" },
      { key: "attend_view", name: "View attendance history", desc: "See past attendance records per tenant", tier: "free" },
      { key: "attend_leave", name: "Approve leave requests", desc: "Approve/deny tenant leave notifications", tier: "free" },
    ],
  },
  {
    id: "guests",
    label: "Guest Tracking",
    permissions: [
      { key: "guest_log", name: "Log guest entry/exit", desc: "Manually record a guest coming in or out", tier: "free" },
      { key: "guest_approve", name: "Approve guest request", desc: "Approve/deny guest entry requests from tenant app", tier: "free" },
    ],
  },
  {
    id: "kyc",
    label: "KYC & Onboarding",
    permissions: [
      { key: "kyc_view", name: "View KYC documents", desc: "See uploaded ID proofs, photos, Aadhaar status", tier: "free" },
      { key: "kyc_approve", name: "Approve / reject KYC", desc: "Accept or reject tenant-uploaded documents", tier: "free" },
    ],
  },
  {
    id: "team",
    label: "Account & Team",
    permissions: [
      { key: "team_view_members", name: "View team members", desc: "See all staff added to the property", tier: "free" },
      { key: "team_edit_profile", name: "Edit member profiles", desc: "Update staff name, phone, role details", tier: "pro" },
      { key: "team_property_access", name: "View property access", desc: "See which properties each staff can access", tier: "pro" },
    ],
  },
];
