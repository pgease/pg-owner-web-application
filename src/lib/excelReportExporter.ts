import * as XLSX from "xlsx";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantBedNo,
  tenantDisplayName,
  tenantPhone,
  tenantRentAmount,
  tenantRoomNo,
} from "@/lib/tenantDisplay";

export interface TenantExportRow {
  tenant: PropertyTenant;
  roomDetails?: {
    sharingCount?: number;
    occupiedBeds?: number;
    roomType?: string;
  };
  financials?: {
    fixedRent?: number;
    securityDeposit?: number;
    carriedForwardDues?: number;
    carriedForwardCollection?: number;
    monthRentDues?: number;
    monthRentCollection?: number;
    electricityDues?: number;
    electricityCollection?: number;
    otherDues?: number;
    otherCollection?: number;
    totalDues?: number;
    totalCollection?: number;
    onlinePayments?: number;
    cashPayments?: number;
    lastPaymentDate?: string;
  };
}

export interface ReportExportOptions {
  pgName: string;
  managedBy?: string;
  contactNo?: string;
  reportType:
    | "ALL_TENANTS"
    | "UNPAID_TENANTS"
    | "PAID_TENANTS"
    | "KYC_DONE"
    | "KYC_PENDING"
    | "NEW_LEADS";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthName(date = new Date()): string {
  return MONTH_NAMES[date.getMonth()];
}

export function build95Headers(monthName = getMonthName()): string[] {
  return [
    "Tenant Name",
    "Room/Unit Name",
    "Bed",
    "Room/Unit's Sharing Count",
    "Occupied Beds",
    "Date of Joining",
    "Date of Eviction",
    "Move Out Date",
    "Lock-in Period (Months)",
    "Notice Period (Days)",
    "Agreement Renewal Date",
    "Phone No.",
    "Roll Number",
    "Fixed Rent",
    "Available Security Deposit",
    "Total Security Deposit",
    "Active Discounts by Owner",
    "Carried Forward Dues",
    "Carried Forward Collection",
    `${monthName}'s Rent & Deposit Dues`,
    `${monthName}'s Rent & Deposit Collection`,
    `${monthName}'s Electricity Bill Dues`,
    `${monthName}'s Electricity Bill Collection`,
    `${monthName}'s Other Bill Dues`,
    `${monthName}'s Other Bill Collection`,
    "Total Pending Dues",
    "Total Collection",
    "Payments by PG Ease Collect",
    "Payment Received by Owner/Staff",
    "KYC Status",
    "Parent's Contact",
    "Tenant Remarks",
    "Last Payment Date",
    "Email",
    "KYC Verified?",
    "Govt ID Number",
    "Blood Group",
    "Date of Birth",
    "Gender",
    "Nationality",
    "Alternate Phone",
    "Working Type",
    "Graduation Year",
    "Current Address",
    "Permanent Address",
    "Mother Tongue",
    "Institute Id",
    "University",
    "Course Name",
    "Biometric Id",
    "Vehicle Number",
    "Father Name",
    "Father Phone",
    "Mother Name",
    "Mother Phone",
    "Father Occupation",
    "Local Guardian Name",
    "Local Guardian Phone",
    "Local Guardian Address",
    "Added On",
    "Other Remarks",
    "Last electricity bill reading",
    "Last electricity bill date",
    "Rent Addition Date",
    "Pan",
    "VoterId",
    "Driving Licence",
    "Passport",
    "Stay Type",
    "Food preferences",
    "Tenant type",
    "GST Number",
    "Company Name",
    "Company Address",
    "Company Owner Name",
    "Agreement Period",
    "Agreement Ending Date",
    "Rental Frequency",
    "Check-in Time",
    "Check-out Time",
    "Referred by / Lead Source",
    "Cashless Deposit",
    "Bond expiry",
    "Bond ID",
    "Bond Link",
    "Booked By",
    "Rental Agreement",
    "Police Verification",
    "Aadhar Front",
    "Aadhar Back",
    "Bank Account Number",
    "Bank IFSC Code",
    "UPI ID",
    "Other Document Front",
    "Other Document Back",
  ];
}

export function mapTenantTo95Columns(
  item: TenantExportRow,
  monthName = getMonthName()
): (string | number)[] {
  const t = item.tenant as any;
  const kyc = t.kycInfo || {};
  const fin = item.financials || {};
  const room = item.roomDetails || {};
  const pay = t.paymentDetails || {};

  const name = tenantDisplayName(t);
  const roomName = tenantRoomNo(t) || t.roomNumber || "-";
  const bed = tenantBedNo(t) || t.bedNumber || "1";
  const sharingCount = room.sharingCount || 2;
  const occupiedBeds = room.occupiedBeds || 1;

  const joinDate = t.startDate ? new Date(t.startDate).toLocaleDateString("en-GB") : "-";
  const vacateOn = t.vacateOn ? new Date(t.vacateOn).toLocaleDateString("en-GB") : "-";
  const moveOutDate = t.endDate ? new Date(t.endDate).toLocaleDateString("en-GB") : "-";

  const lockin = t.lockinPeriodMonths ?? 0;
  const notice = t.noticePeriodDays ?? 30;
  const agreementMonths = t.agreementPeriodMonths ?? 11;

  // Calculate agreement ending date
  let agreementEnding = "-";
  if (t.startDate && agreementMonths > 0) {
    const d = new Date(t.startDate);
    d.setMonth(d.getMonth() + Number(agreementMonths));
    agreementEnding = d.toLocaleDateString("en-GB");
  }

  const phone = tenantPhone(t);
  const rollNumber = t.rollNumber || kyc.rollNumber || "-";
  const fixedRent = Number(t.rentAmount || tenantRentAmount(t) || fin.fixedRent || 0);
  const securityDeposit = Number(t.securityDeposit || fin.securityDeposit || 0);
  const activeDiscounts = Number(pay.activeDiscounts || 0);

  const cfDues = fin.carriedForwardDues ?? 0;
  const cfColl = fin.carriedForwardCollection ?? 0;
  const monthRentDues = fin.monthRentDues ?? (t.rentStatus === "unpaid" ? fixedRent : 0);
  const monthRentColl = fin.monthRentCollection ?? (t.rentStatus === "paid" ? fixedRent : 0);
  const elecDues = fin.electricityDues ?? 0;
  const elecColl = fin.electricityCollection ?? 0;
  const otherDues = fin.otherDues ?? 0;
  const otherColl = fin.otherCollection ?? 0;

  const totalPendingDues = fin.totalDues ?? (monthRentDues + elecDues + otherDues + cfDues);
  const totalColl = fin.totalCollection ?? (monthRentColl + elecColl + otherColl + cfColl);

  const onlineCollect = fin.onlinePayments ?? (t.collectOnlinePayments ? totalColl : 0);
  const cashColl = fin.cashPayments ?? (!t.collectOnlinePayments ? totalColl : 0);

  const isKyc = Boolean(t.isKycVerified);
  const kycStatus = isKyc ? "Verified" : (kyc.status || "Pending");
  const parentContact = t.fatherPhone || t.motherPhone || t.guardianPhone || "-";
  const remarks = t.remarks || "-";
  const lastPay = fin.lastPaymentDate || (totalColl > 0 ? "Recently" : "-");

  const email = t.email || "-";
  const govtId = t.govtIdNumber || kyc.aadhaarNumber || "-";
  const bloodGroup = t.bloodGroup || "-";
  const dob = t.dob ? new Date(t.dob).toLocaleDateString("en-GB") : "-";
  const gender = t.gender || "-";
  const nationality = t.nationality || "Indian";
  const alternatePhone = t.alternatePhone || "-";
  const workingType = t.tenantType || "Student";
  const gradYear = t.graduationYear || t.courseYear || "-";

  const currAddr = t.currentAddress || "-";
  const permAddr = t.address || "-";
  const motherTongue = t.motherTongue || "-";
  const instId = t.officeOrInstituteId || t.instituteId || "-";
  const university = t.university || t.officeOrCollegeName || "-";
  const courseName = t.courseName || "-";
  const biometricId = t.biometricId || "-";
  const vehicleNumber = t.vehicleNumber || "-";

  const fatherName = t.fatherName || "-";
  const fatherPhone = t.fatherPhone || "-";
  const motherName = t.motherName || "-";
  const motherPhone = t.motherPhone || "-";
  const fatherOcc = t.fatherOccupation || "-";

  const guardianName = t.guardianName || "-";
  const guardianPhone = t.guardianPhone || "-";
  const guardianAddress = t.localGuardianAddress || "-";

  const addedOn = t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB") : "-";
  const lastMeterReading = t.lastMeterReading || "-";
  const lastMeterDate = t.lastReadingDate ? new Date(t.lastReadingDate).toLocaleDateString("en-GB") : "-";
  const rentAddDate = t.rentDueDate ? `${t.rentDueDate}th of every month` : "1st of every month";

  const pan = t.panNumber || kyc.panNumber || "-";
  const voterId = t.voterId || kyc.voterId || "-";
  const dl = t.drivingLicense || kyc.drivingLicense || "-";
  const passport = t.passport || kyc.passport || "-";

  const stayType = t.stayType || "Long Stay";
  const foodPref = t.foodPreferences || "-";
  const tenantType = t.tenantType || "Individual";

  const gstNo = t.gstNumber || "-";
  const companyName = t.companyName || "-";
  const companyAddr = t.companyAddress || "-";
  const companyOwner = t.businessOwnerName || "-";

  const agreementPeriod = `${agreementMonths} Months`;
  const rentalFreq = t.rentalFrequency || "Monthly";
  const checkinTime = t.checkinTime || "12:00 PM";
  const checkoutTime = t.checkoutTime || "11:00 AM";
  const referredBy = t.referredBy || "-";

  const cashlessDeposit = t.cashlessDeposit ? "Yes" : "No";
  const bondExpiry = t.bondExpiry || "-";
  const bondId = t.bondId || "-";
  const bondLink = t.bondLink || "-";
  const bookedBy = t.bookedBy || "Owner";

  const rentalAgreement = t.agreementUrl ? "Available" : "Not Created";
  const policeVerif = kyc.policeVerificationStatus || (isKyc ? "Completed" : "Pending");
  const aadharFront = kyc.aadhaarFrontUrl ? "Uploaded" : "-";
  const aadharBack = kyc.aadhaarBackUrl ? "Uploaded" : "-";

  const bankAcc = t.bankAccountNumber || "-";
  const bankIfsc = t.bankIfscCode || "-";
  const bankUpi = t.bankUpiId || "-";
  const otherDocFront = kyc.otherDocFrontUrl ? "Uploaded" : "-";
  const otherDocBack = kyc.otherDocBackUrl ? "Uploaded" : "-";

  return [
    name,
    roomName,
    bed,
    sharingCount,
    occupiedBeds,
    joinDate,
    vacateOn,
    moveOutDate,
    lockin,
    notice,
    agreementEnding,
    phone,
    rollNumber,
    fixedRent,
    securityDeposit,
    securityDeposit,
    activeDiscounts,
    cfDues,
    cfColl,
    monthRentDues,
    monthRentColl,
    elecDues,
    elecColl,
    otherDues,
    otherColl,
    totalPendingDues,
    totalColl,
    onlineCollect,
    cashColl,
    kycStatus,
    parentContact,
    remarks,
    lastPay,
    email,
    isKyc ? "Yes" : "No",
    govtId,
    bloodGroup,
    dob,
    gender,
    nationality,
    alternatePhone,
    workingType,
    gradYear,
    currAddr,
    permAddr,
    motherTongue,
    instId,
    university,
    courseName,
    biometricId,
    vehicleNumber,
    fatherName,
    fatherPhone,
    motherName,
    motherPhone,
    fatherOcc,
    guardianName,
    guardianPhone,
    guardianAddress,
    addedOn,
    remarks,
    lastMeterReading,
    lastMeterDate,
    rentAddDate,
    pan,
    voterId,
    dl,
    passport,
    stayType,
    foodPref,
    tenantType,
    gstNo,
    companyName,
    companyAddr,
    companyOwner,
    agreementPeriod,
    agreementEnding,
    rentalFreq,
    checkinTime,
    checkoutTime,
    referredBy,
    cashlessDeposit,
    bondExpiry,
    bondId,
    bondLink,
    bookedBy,
    rentalAgreement,
    policeVerif,
    aadharFront,
    aadharBack,
    bankAcc,
    bankIfsc,
    bankUpi,
    otherDocFront,
    otherDocBack,
  ];
}

/**
 * Generates and downloads the authentic multi-sheet .xlsx workbook matching DetailedTenantReport
 */
export function exportReportToExcel(
  items: TenantExportRow[],
  options: ReportExportOptions
): void {
  const wb = XLSX.utils.book_new();
  const monthName = getMonthName();
  const headers = build95Headers(monthName);

  // 1. Calculate Aggregates for Summary Sheet
  const totalTenants = items.length;
  let totalPendingDues = 0;
  let totalCollection = 0;
  let rentDues = 0;
  let rentColl = 0;
  let elecDues = 0;
  let otherDues = 0;

  items.forEach((item) => {
    const fin = item.financials || {};
    const t = item.tenant as any;
    const rent = Number(t.rentAmount || 0);
    const mRentDues = fin.monthRentDues ?? (t.rentStatus === "unpaid" ? rent : 0);
    const mRentColl = fin.monthRentCollection ?? (t.rentStatus === "paid" ? rent : 0);
    const eD = fin.electricityDues ?? 0;
    const oD = fin.otherDues ?? 0;
    rentDues += mRentDues;
    rentColl += mRentColl;
    elecDues += eD;
    otherDues += oD;
    totalPendingDues += fin.totalDues ?? (mRentDues + eD + oD);
    totalCollection += fin.totalCollection ?? mRentColl;
  });

  // 2. Build Sheet 1: "Summary Sheet"
  const summaryHeaders = [
    "Property Name",
    "Managed by",
    "PG Ease ID",
    "Total Tenant",
    "Contact No",
    "Total Pending Dues",
    "Total Collection",
    `${monthName}'s Rent & Deposit Dues`,
    `${monthName}'s Rent & Deposit Collection`,
    `${monthName}'s Electricity Bill Dues`,
    `${monthName}'s Other Bill Dues`,
  ];

  const summaryData = [
    summaryHeaders,
    [
      options.pgName || "PG Ease Property",
      options.managedBy || "Owner",
      "PGE-" + (options.pgName.slice(0, 3).toUpperCase() || "PG1"),
      totalTenants,
      options.contactNo || "7701953356",
      totalPendingDues,
      totalCollection,
      rentDues,
      rentColl,
      elecDues,
      otherDues,
    ],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary Sheet");

  // 3. Build Sheet 2: Property-specific sheet (e.g. "Saksham Pg")
  const propertySheetName = (options.pgName || "Detailed Report").slice(0, 31);
  const rows = items.map((item) => mapTenantTo95Columns(item, monthName));
  const detailData = [headers, ...rows];

  const detailWs = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailWs, propertySheetName);

  // 4. Trigger Download
  const timestamp = Date.now();
  const filename = `${options.reportType.toLowerCase()}_${options.pgName.replace(/\s+/g, "_")}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and downloads a clean CSV export
 */
export function exportReportToCsv(
  items: TenantExportRow[],
  options: ReportExportOptions
): void {
  const monthName = getMonthName();
  const headers = build95Headers(monthName);
  const rows = items.map((item) => mapTenantTo95Columns(item, monthName));

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((val) => {
          const s = String(val ?? "").replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const timestamp = Date.now();
  link.setAttribute(
    "download",
    `${options.reportType.toLowerCase()}_${options.pgName.replace(/\s+/g, "_")}_${timestamp}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
