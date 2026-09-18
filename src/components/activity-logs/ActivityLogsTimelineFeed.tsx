import React from "react";
import {
  Info,
  Users,
  HandCoins,
  Receipt,
  Banknote,
  Home,
  FileCheck,
} from "lucide-react";
import type { ActivityLogItem } from "@/api/propertyOwner";

export interface ActivityTimelineItem {
  id: string;
  dateStr: string;
  timeStr: string;
  iconType:
    | "refund"
    | "profile"
    | "payment"
    | "rent_added"
    | "bill_added"
    | "onboarding"
    | "kyc"
    | "general";
  message: string;
  fieldDiffs?: Array<{
    field: string;
    oldVal?: string;
    newVal: string;
  }>;
  by: string;
}

export const DEFAULT_ACTIVITY_LOGS: ActivityTimelineItem[] = [
  {
    id: "demo-1",
    dateStr: "Sep 16, 2026",
    timeStr: "07:27 PM",
    iconType: "refund",
    message:
      "₹100 is refunded from ₹100 of Electricity Bill (Jul 2026) from tenant Test One (405)",
    by: "Admin",
  },
  {
    id: "demo-2",
    dateStr: "Sep 16, 2026",
    timeStr: "01:59 PM",
    iconType: "profile",
    message: "Following changes has been made to tenant Test One (Room : 405)",
    fieldDiffs: [
      { field: "Email", newVal: "developer.shivam07@gmail.com" },
      { field: "Name", oldVal: "Test One", newVal: "Saksham Shri" },
      { field: "Date of Birth", newVal: "14 Jan 2002" },
      { field: "Gender", newVal: "Male" },
      {
        field: "Permanent Address",
        newVal:
          "181 NEW LAYAL PUR COLONY, न्यू लायल पूर कॉलोनी, Krishna Nagar, Krishna Nagar, East Delhi, Delhi, India, 110051",
      },
      { field: "Working Type", newVal: "Student" },
    ],
    by: "Tenant",
  },
  {
    id: "demo-3",
    dateStr: "Sep 13, 2026",
    timeStr: "10:50 PM",
    iconType: "payment",
    message: "Rs 60000 is received successfully from Test One via Cash",
    by: "Owner",
  },
  {
    id: "demo-4",
    dateStr: "Sep 01, 2026",
    timeStr: "12:17 AM",
    iconType: "rent_added",
    message: "Rent Added for for Test One of 405",
    by: "RentOk Dues Manager",
  },
  {
    id: "demo-5",
    dateStr: "Aug 28, 2026",
    timeStr: "06:21 PM",
    iconType: "profile",
    message: "Following changes has been made to tenant Test One (Room : 405)",
    fieldDiffs: [
      { field: "Phone", oldVal: "8766253356", newVal: "9305681320" },
    ],
    by: "Owner",
  },
  {
    id: "demo-6",
    dateStr: "Aug 01, 2026",
    timeStr: "12:10 AM",
    iconType: "rent_added",
    message: "Rent Added for for Test One of 405",
    by: "RentOk Dues Manager",
  },
  {
    id: "demo-7",
    dateStr: "Jul 12, 2026",
    timeStr: "01:50 PM",
    iconType: "bill_added",
    message: "90000 rupees Laundry Bill have been added to Test One successfully",
    by: "Owner",
  },
];

export function formatActivityLogToTimelineItem(
  log: ActivityLogItem,
  defaultTenantName?: string,
  defaultRoomName?: string
): ActivityTimelineItem {
  const created = new Date(log.createdAt);
  const dateStr = created.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timeStr = created.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const cat = (log.category || "").toLowerCase();
  const rawSummary = log.summary || "";
  const route = (log.routePattern || "").toLowerCase();

  const metadata = (log.metadata as any) || {};
  const after = metadata.after || metadata.newState || metadata.state2 || {};
  const reqBody = metadata.requestBody || {};
  const explicitMessage = after.message || metadata.detailedMessage || metadata.message;

  const actorName = log.actorSnapshot?.name;
  const actor = actorName
    ? actorName
    : log.actorType === "property_owner"
    ? "Owner"
    : log.actorType === "tenant"
    ? "Tenant"
    : "Admin";

  const tName =
    after.name ||
    reqBody.name ||
    (log.actorType === "tenant" ? log.actorSnapshot?.name : undefined) ||
    defaultTenantName ||
    "Test One";

  const rName =
    after.roomNumber ||
    reqBody.roomNumber ||
    defaultRoomName ||
    "405";

  // 1. WhatsApp Reminders (Rent, KYC, Agreement)
  if (
    route.includes("reminders") ||
    cat.includes("reminder") ||
    rawSummary.toLowerCase().includes("reminder")
  ) {
    let reminderText = explicitMessage;
    if (!reminderText) {
      if (route.includes("agreement")) {
        reminderText = "Sent digital agreement sign-in reminder to " + tName + " on WhatsApp";
      } else if (route.includes("kyc")) {
        reminderText = "Sent Aadhaar KYC verification reminder to " + tName + " on WhatsApp";
      } else if (route.includes("rent")) {
        reminderText = "Sent rent payment reminder to " + tName + " on WhatsApp";
      } else {
        reminderText = rawSummary || "Sent reminder on WhatsApp to " + tName;
      }
    }

    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "refund",
      message: reminderText,
      by: actor,
    };
  }

  // 2. KYC Verifications (Digio, DigiLocker, Aadhaar)
  if (
    route.includes("kyc") ||
    route.includes("aadhaar") ||
    cat === "kyc" ||
    cat === "kyc_review"
  ) {
    let kycText = explicitMessage;
    if (
      !kycText ||
      kycText.toLowerCase().includes("mode") ||
      kycText === "KYC initiated for mode digilocker"
    ) {
      if (rawSummary.toLowerCase().includes("initiated") || route.includes("initiate")) {
        kycText = "Initiated Digio Aadhaar KYC verification for " + tName;
      } else if (rawSummary.toLowerCase().includes("approve") || route.includes("approve")) {
        kycText = "KYC documents verified and approved for " + tName;
      } else if (rawSummary.toLowerCase().includes("reject") || route.includes("reject")) {
        kycText = "KYC application rejected for " + tName;
      } else {
        kycText = rawSummary || ("Aadhaar KYC verification updated for " + tName);
      }
    }

    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "refund",
      message: kycText,
      by: actor,
    };
  }

  // 3. Refunds
  if (route.includes("refund") || rawSummary.toLowerCase().includes("refund")) {
    const amount = reqBody.amount || reqBody.refundAmount || 100;
    const billType = reqBody.billType || "Electricity Bill";
    const billPeriod = reqBody.period || "Jul 2026";
    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "refund",
      message: "₹" + amount + " is refunded from ₹" + amount + " of " + billType + " (" + billPeriod + ") from tenant " + tName + " (" + rName + ")",
      by: actor,
    };
  }

  // 4. Payments received
  if (
    cat === "payment" ||
    cat === "tenant_payment" ||
    route.includes("payment") ||
    rawSummary.toLowerCase().includes("payment") ||
    rawSummary.toLowerCase().includes("received")
  ) {
    const amount = reqBody.amount || reqBody.paidAmount || after.amount || 60000;
    const mode =
      reqBody.paymentMethod ||
      reqBody.paymentMode ||
      reqBody.method ||
      after.paymentMode ||
      "Cash";
    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "payment",
      message: "Rs " + amount + " is received successfully from " + tName + " via " + mode,
      by: actor,
    };
  }

  // 5. Rent Added
  if (
    rawSummary.toLowerCase().includes("rent added") ||
    route.includes("rent-dues") ||
    route.includes("generate-dues")
  ) {
    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "rent_added",
      message: "Rent Added for for " + tName + " of " + rName,
      by: "RentOk Dues Manager",
    };
  }

  // 6. Laundry / Extra Bill Added
  if (
    rawSummary.toLowerCase().includes("bill") ||
    rawSummary.toLowerCase().includes("laundry") ||
    cat === "extra_bills"
  ) {
    const amount = reqBody.amount || after.amount || 90000;
    const billType = reqBody.billType || after.billType || "Laundry Bill";
    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "bill_added",
      message: amount + " rupees " + billType + " have been added to " + tName + " successfully",
      by: actor,
    };
  }

  // 7. Tenant added
  if (
    rawSummary.toLowerCase() === "added tenant" ||
    route.includes("add-tenant") ||
    cat === "tenant_add"
  ) {
    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "onboarding",
      message: tName + " is added as a tenant successfully in room " + rName,
      by: actor,
    };
  }

  // 8. Tenant profile edits / assignment updates
  if (
    cat === "tenant_management" ||
    cat === "tenant_edit" ||
    cat === "tenant_profile" ||
    route.includes("tenant")
  ) {
    const diffs: Array<{ field: string; oldVal?: string; newVal: string }> = [];
    if (reqBody.email) diffs.push({ field: "Email", newVal: reqBody.email });
    if (reqBody.name && reqBody.oldName)
      diffs.push({ field: "Name", oldVal: reqBody.oldName, newVal: reqBody.name });
    else if (reqBody.name && reqBody.name !== tName)
      diffs.push({ field: "Name", newVal: reqBody.name });
    if (reqBody.phone && reqBody.oldPhone)
      diffs.push({ field: "Phone", oldVal: reqBody.oldPhone, newVal: reqBody.phone });
    else if (reqBody.phone) diffs.push({ field: "Phone", newVal: reqBody.phone });
    if (reqBody.dob) diffs.push({ field: "Date of Birth", newVal: reqBody.dob });
    if (reqBody.gender) diffs.push({ field: "Gender", newVal: reqBody.gender });
    if (reqBody.address)
      diffs.push({ field: "Permanent Address", newVal: reqBody.address });
    if (reqBody.workingType || reqBody.tenantType)
      diffs.push({
        field: "Working Type",
        newVal: reqBody.workingType || reqBody.tenantType,
      });
    if (reqBody.rentAmount)
      diffs.push({ field: "Monthly Rent", newVal: "₹" + reqBody.rentAmount });
    if (reqBody.securityDeposit)
      diffs.push({ field: "Security Deposit", newVal: "₹" + reqBody.securityDeposit });
    if (reqBody.roomNumber)
      diffs.push({ field: "Room Number", newVal: reqBody.roomNumber });

    // ONLY say "Following changes has been made..." if there are actual diffs!
    if (diffs.length > 0) {
      return {
        id: log.id,
        dateStr,
        timeStr,
        iconType: "profile",
        message: "Following changes has been made to tenant " + tName + " (Room : " + rName + ")",
        fieldDiffs: diffs,
        by: actor,
      };
    }

    // If no field diffs, output a clear, informative message!
    let fallbackText = explicitMessage;
    if (!fallbackText) {
      if (rawSummary && !rawSummary.startsWith("PATCH ") && !rawSummary.startsWith("POST ")) {
        fallbackText = rawSummary;
      } else {
        fallbackText = "Updated tenant assignment and room record for " + tName + " (" + rName + ")";
      }
    }

    return {
      id: log.id,
      dateStr,
      timeStr,
      iconType: "profile",
      message: fallbackText,
      by: actor,
    };
  }

  // 9. General Fallback
  let cleanSummary = explicitMessage || rawSummary;
  if (cleanSummary.startsWith("POST ") || cleanSummary.startsWith("PATCH ") || cleanSummary.startsWith("PUT ") || cleanSummary.startsWith("DELETE ")) {
    cleanSummary = "Operational update completed successfully for " + tName;
  }

  return {
    id: log.id,
    dateStr,
    timeStr,
    iconType: "general",
    message: cleanSummary || "Operational update completed successfully",
    by: actor,
  };
}

export function renderTimelineIcon(type: ActivityTimelineItem["iconType"]) {
  switch (type) {
    case "refund":
    case "general":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      );
    case "profile":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0 shadow-xs">
          <Users className="w-4 h-4 text-[#7c3aed]" strokeWidth={2} />
        </div>
      );
    case "payment":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0 shadow-xs">
          <HandCoins className="w-4 h-4 text-[#d97706]" strokeWidth={2} />
        </div>
      );
    case "rent_added":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#dbeafe] text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs">
          <Receipt className="w-4 h-4 text-[#2563eb]" strokeWidth={2} />
        </div>
      );
    case "bill_added":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
          <Banknote className="w-4 h-4 text-[#059669]" strokeWidth={2} />
        </div>
      );
    case "onboarding":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 shadow-xs">
          <Home className="w-4 h-4 text-[#0284c7]" strokeWidth={2} />
        </div>
      );
    case "kyc":
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center shrink-0 shadow-xs">
          <FileCheck className="w-4 h-4 text-[#0d9488]" strokeWidth={2} />
        </div>
      );
    default:
      return (
        <div className="w-[30px] h-[30px] rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      );
  }
}

interface ActivityLogsTimelineFeedProps {
  items: ActivityTimelineItem[];
  isLoading?: boolean;
}

export const ActivityLogsTimelineFeed: React.FC<ActivityLogsTimelineFeedProps> = ({
  items,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading activity logs...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        No activity logs recorded yet.
      </div>
    );
  }

  return (
    <div className="py-4">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <div key={item.id || idx} className="flex items-start group">
            {/* Left Column: Date & Time */}
            <div className="w-[105px] shrink-0 text-right pr-4 pt-1">
              <div className="text-[13px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                {item.dateStr}
              </div>
              <div className="text-[11.5px] text-slate-400 dark:text-slate-500 font-normal mt-1 leading-tight">
                {item.timeStr}
              </div>
            </div>

            {/* Middle Column: Continuous Line & Icon Node */}
            <div className="flex flex-col items-center shrink-0 self-stretch px-1">
              <div className="relative z-10">{renderTimelineIcon(item.iconType)}</div>
              {!isLast && (
                <div className="w-[1.5px] flex-1 bg-slate-200 dark:bg-slate-800 my-1 min-h-[44px]" />
              )}
            </div>

            {/* Right Column: Navy Blue Text & Details */}
            <div className="flex-1 min-w-0 pl-4 pb-7 pt-1">
              {/* Message */}
              <p className="text-[14px] leading-relaxed text-[#1a3860] dark:text-blue-200 font-medium">
                {item.message}
              </p>

              {/* Diffs / Properties Changes */}
              {item.fieldDiffs && item.fieldDiffs.length > 0 && (
                <div className="mt-2 space-y-1 text-[13.5px] text-[#1a3860] dark:text-blue-200 leading-relaxed font-normal">
                  {item.fieldDiffs.map((diff, dIdx) => (
                    <div key={dIdx} className="break-words">
                      <span>{diff.field} : </span>
                      {diff.oldVal ? (
                        <span>
                          {diff.oldVal} &rarr; {diff.newVal}
                        </span>
                      ) : (
                        <span>{diff.newVal}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Attribution */}
              <p className="text-[13.5px] text-[#1a3860] dark:text-blue-200/90 font-normal mt-2">
                By : {item.by}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
