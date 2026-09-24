export type PresetCell = true | false | "always";

export const ROLE_PRESETS: Record<string, Record<string, PresetCell>> = {
  manager: {
    // Rooms
    room_view: "always",
    room_add: true,
    room_edit: true,
    room_delete: false,

    // Tenants
    tenant_view: "always",
    tenant_add: true,
    tenant_edit_basic: true,
    tenant_edit_rental: true,
    tenant_change_room: true,
    tenant_opening_balance: true,
    tenant_delete: false,
    tenant_delete_old: false,

    // Accounting & Rent
    account_view_dues: "always",
    account_view_own_dues: "always",
    account_record_payment: true,
    account_add_dues: true,
    account_edit_dues: true,
    account_delete_dues: false,
    account_send_reminders: true,
    account_otp_cash: true,

    // Expenses
    expense_view: "always",
    expense_add: true,
    expense_edit: true,
    expense_delete: false,

    // Complaints
    complaint_view_all: "always",
    complaint_view_own: "always",
    complaint_edit_assign: true,
    complaint_raise: "always",
    complaint_edit_own: true,

    // Food
    food_view: "always",
    food_edit: true,
    food_view_edit: "always",

    // Attendance
    attend_view: "always",
    attend_mark: true,
    attend_leave: true,

    // Night Out & Outing
    nightout_view: "always",
    nightout_approve: true,
    nightout_mark_returned: "always",
    nightout_extend: true,
    outing_approve: true,
    nightout_report: true,

    // Guests
    guest_view: "always",
    guest_log: true,
    guest_approve: true,

    // KYC
    kyc_view: "always",
    kyc_approve: true,

    // Property Settings
    property_view: "always",
    property_edit: true,

    // Refunds
    refund_view: true,
    refund_add: true,
    refund_delete: false,

    // Eviction
    eviction_view: true,
    eviction_approve: true,
    eviction_cancel: true,

    // Reports
    dashboard_access: "always",
    report_people: "always",
    report_money: true,
    report_daily: "always",
    report_export: true,

    // Team
    team_view_members: "always",
    team_add_member: true,
    team_edit_profile: false,
    team_property_access: true,

    // Chat
    chat_view: "always",
    chat_member_view: "always",
    chat_send: true,
    chat_reply: true,
    chat_media_upload: true,
    chat_delete_own: true,
    chat_delete_any: true,
    chat_pin: true,
    chat_group_settings: true,

    // App Portals
    app_mobile_view: "always",
    app_guard_view: false,
    app_member_view: true,
  },

  caretaker: {
    // Rooms
    room_view: "always",
    room_add: false,
    room_edit: true,
    room_delete: false,

    // Tenants (Can view and update phone/emergency, but cannot change financial terms)
    tenant_view: true,
    tenant_add: true,
    tenant_edit_basic: true,
    tenant_edit_rental: false,
    tenant_change_room: true,
    tenant_opening_balance: false,
    tenant_delete: false,
    tenant_delete_old: false,

    // Accounting & Rent: By default HIDDEN from caretaker (owner chooses whether to show)
    account_view_dues: false,
    account_view_own_dues: true,
    account_record_payment: false,
    account_add_dues: false,
    account_edit_dues: false,
    account_delete_dues: false,
    account_send_reminders: false,
    account_otp_cash: false,

    // Expenses
    expense_view: false,
    expense_add: true,
    expense_edit: false,
    expense_delete: false,

    // Complaints
    complaint_view_all: true,
    complaint_view_own: "always",
    complaint_edit_assign: true,
    complaint_raise: "always",
    complaint_edit_own: true,

    // Food
    food_view: "always",
    food_edit: true,
    food_view_edit: "always",

    // Attendance
    attend_view: true,
    attend_mark: "always",
    attend_leave: false,

    // Night Out
    nightout_view: true,
    nightout_approve: true,
    nightout_mark_returned: "always",
    nightout_extend: false,
    outing_approve: true,
    nightout_report: false,

    // Guests
    guest_view: true,
    guest_log: "always",
    guest_approve: true,

    // KYC
    kyc_view: false,
    kyc_approve: false,

    // Property Settings
    property_view: true,
    property_edit: false,

    // Refunds & Eviction
    refund_view: false,
    refund_add: false,
    refund_delete: false,
    eviction_view: false,
    eviction_approve: false,
    eviction_cancel: false,

    // Reports (Operational daily checklist only; Financials hidden)
    dashboard_access: false,
    report_people: true,
    report_money: false,
    report_daily: true,
    report_export: false,

    // Team
    team_view_members: false,
    team_add_member: false,
    team_edit_profile: false,
    team_property_access: false,

    // Chat
    chat_view: "always",
    chat_member_view: true,
    chat_send: true,
    chat_reply: true,
    chat_media_upload: true,
    chat_delete_own: true,
    chat_delete_any: false,
    chat_pin: false,
    chat_group_settings: false,

    // App Portals
    app_mobile_view: "always",
    app_guard_view: true,
    app_member_view: false,
  },

  cleaner: {
    // Rooms: Can view rooms to know which beds/rooms need cleaning
    room_view: true,
    room_add: false,
    room_edit: false,
    room_delete: false,

    // Tenants: Can view tenants (to identify room occupants), but CANNOT edit any tenant details
    tenant_view: true,
    tenant_add: false,
    tenant_edit_basic: false,
    tenant_edit_rental: false,
    tenant_change_room: false,
    tenant_opening_balance: false,
    tenant_delete: false,
    tenant_delete_old: false,

    // Accounting & Rent: COMPLETELY HIDDEN
    account_view_dues: false,
    account_view_own_dues: false,
    account_record_payment: false,
    account_add_dues: false,
    account_edit_dues: false,
    account_delete_dues: false,
    account_send_reminders: false,
    account_otp_cash: false,

    // Expenses: HIDDEN
    expense_view: false,
    expense_add: false,
    expense_edit: false,
    expense_delete: false,

    // Complaints: Can log issues found during cleaning & track own reports
    complaint_view_all: false,
    complaint_view_own: "always",
    complaint_edit_assign: false,
    complaint_raise: "always",
    complaint_edit_own: true,

    // Food: Can view food schedule for dining room prep
    food_view: true,
    food_edit: false,
    food_view_edit: false,

    // Attendance, Guests, Nightout: HIDDEN
    attend_view: false,
    attend_mark: false,
    attend_leave: false,
    nightout_view: false,
    nightout_approve: false,
    nightout_mark_returned: false,
    nightout_extend: false,
    outing_approve: false,
    nightout_report: false,
    guest_view: false,
    guest_log: false,
    guest_approve: false,

    // KYC, Property, Refunds, Reports: HIDDEN
    kyc_view: false,
    kyc_approve: false,
    property_view: false,
    property_edit: false,
    refund_view: false,
    refund_add: false,
    refund_delete: false,
    eviction_view: false,
    eviction_approve: false,
    eviction_cancel: false,
    dashboard_access: false,
    report_people: false,
    report_money: false,
    report_daily: false,
    report_export: false,
    team_view_members: false,
    team_add_member: false,
    team_edit_profile: false,
    team_property_access: false,

    // Chat
    chat_view: false,
    chat_member_view: false,
    chat_send: false,
    chat_reply: false,
    chat_media_upload: false,
    chat_delete_own: false,
    chat_delete_any: false,
    chat_pin: false,
    chat_group_settings: false,

    // App Portals
    app_mobile_view: "always",
    app_guard_view: false,
    app_member_view: false,
  },

  warden: {
    // Rooms: View only
    room_view: "always",
    room_add: false,
    room_edit: false,
    room_delete: false,

    // Tenants: View only for security identification
    tenant_view: true,
    tenant_add: false,
    tenant_edit_basic: false,
    tenant_edit_rental: false,
    tenant_change_room: false,
    tenant_opening_balance: false,
    tenant_delete: false,
    tenant_delete_old: false,

    // Accounting & Rent: HIDDEN
    account_view_dues: false,
    account_view_own_dues: false,
    account_record_payment: false,
    account_add_dues: false,
    account_edit_dues: false,
    account_delete_dues: false,
    account_send_reminders: false,
    account_otp_cash: false,

    // Expenses: HIDDEN
    expense_view: false,
    expense_add: false,
    expense_edit: false,
    expense_delete: false,

    // Complaints
    complaint_view_all: true,
    complaint_view_own: "always",
    complaint_edit_assign: false,
    complaint_raise: "always",
    complaint_edit_own: true,

    // Food
    food_view: true,
    food_edit: false,
    food_view_edit: false,

    // Attendance & Security Control
    attend_view: "always",
    attend_mark: "always",
    attend_leave: true,

    // Night Out & Curfew
    nightout_view: "always",
    nightout_approve: true,
    nightout_mark_returned: "always",
    nightout_extend: true,
    outing_approve: true,
    nightout_report: true,

    // Guests
    guest_view: "always",
    guest_log: "always",
    guest_approve: true,

    // KYC
    kyc_view: true,
    kyc_approve: false,

    // Property Rules
    property_view: "always",
    property_edit: false,

    // Eviction
    eviction_view: true,
    eviction_approve: true,
    eviction_cancel: false,

    // Reports
    dashboard_access: false,
    report_people: true,
    report_money: false,
    report_daily: true,
    report_export: false,

    // Team
    team_view_members: false,
    team_add_member: false,
    team_edit_profile: false,
    team_property_access: false,

    // Chat
    chat_view: "always",
    chat_member_view: true,
    chat_send: true,
    chat_reply: true,
    chat_media_upload: true,
    chat_delete_own: true,
    chat_delete_any: true,
    chat_pin: false,
    chat_group_settings: false,

    // App Portals
    app_mobile_view: "always",
    app_guard_view: "always",
    app_member_view: true,
  },
};

export const ROLE_LABELS: Record<string, { title: string; desc: string; badge: string }> = {
  manager: {
    title: "Manager",
    desc: "Complete operational control — finance, tenant onboarding, rooms, complaints & reports",
    badge: "Full Admin",
  },
  caretaker: {
    title: "Caretaker",
    desc: "Ground operations — room check-in, attendance, complaints. Rent & financials hidden by default",
    badge: "Operations",
  },
  cleaner: {
    title: "Cleaner",
    desc: "Housekeeping & facility — view rooms & occupants, raise maintenance tickets. Zero financial or edit access",
    badge: "Housekeeping",
  },
  warden: {
    title: "Warden",
    desc: "Discipline & security — gate pass, visitor logs, night out curfew & attendance. No finance access",
    badge: "Security",
  },
  custom: {
    title: "Custom Role",
    desc: "Tailored granular access customized specifically for your property requirements",
    badge: "Custom",
  },
};
