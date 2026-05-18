// Admin Dashboard — Self-contained Mock Data
// No external API calls. All data is hardcoded.

export const MOCK_BOOKINGS = [
  {
    id: "BK-001", clientName: "Sunrise Exports Ltd", inspectionType: "PSI",
    product: "Cotton T-Shirts (5,000 pcs)", factoryName: "Guangzhou Textile Co.",
    factoryLocation: "Guangzhou, China", inspectorName: "Raj Mehta",
    scheduledDate: "2025-01-20", createdDate: "2025-01-10",
    status: "Delivered", priority: "Normal", poNumber: "PO-2025-0142",
    reportId: "RPT-001", deliveredDate: "2025-01-25",
  },
  {
    id: "BK-002", clientName: "Pacific Traders Inc", inspectionType: "CLS",
    product: "Ceramic Dinnerware Set (2,000 sets)", factoryName: "Foshan Ceramics Ltd",
    factoryLocation: "Foshan, China", inspectorName: "Anita Sharma",
    scheduledDate: "2025-01-22", createdDate: "2025-01-12",
    status: "Ready to Deliver", priority: "High", poNumber: "PO-2025-0178",
    reportId: "RPT-002", deliveredDate: null,
  },
  {
    id: "BK-003", clientName: "EuroStyle GmbH", inspectionType: "DPI",
    product: "Leather Handbags (800 pcs)", factoryName: "Dongguan Leather Works",
    factoryLocation: "Dongguan, China", inspectorName: "Raj Mehta",
    scheduledDate: "2025-01-18", createdDate: "2025-01-08",
    status: "Under TM Review", priority: "Normal", poNumber: "PO-2025-0155",
    reportId: "RPT-003", deliveredDate: null,
  },
  {
    id: "BK-004", clientName: "Nordic Home Essentials", inspectionType: "Factory Audit",
    product: "Wooden Furniture (300 units)", factoryName: "Jiangxi Woodcraft Factory",
    factoryLocation: "Nanchang, China", inspectorName: "Li Wei",
    scheduledDate: "2025-01-25", createdDate: "2025-01-14",
    status: "In Progress", priority: "Urgent", poNumber: "PO-2025-0190",
    reportId: null, deliveredDate: null,
  },
  {
    id: "BK-005", clientName: "Sunrise Exports Ltd", inspectionType: "PSI",
    product: "Polyester Jackets (3,500 pcs)", factoryName: "Hangzhou Apparel Co.",
    factoryLocation: "Hangzhou, China", inspectorName: "Anita Sharma",
    scheduledDate: "2025-01-28", createdDate: "2025-01-16",
    status: "Scheduled", priority: "Normal", poNumber: "PO-2025-0201",
    reportId: null, deliveredDate: null,
  },
  {
    id: "BK-006", clientName: "AmeriGoods LLC", inspectionType: "Social Audit",
    product: "Sports Shoes (10,000 pairs)", factoryName: "Putian Footwear Inc",
    factoryLocation: "Putian, China", inspectorName: "Li Wei",
    scheduledDate: "2025-01-15", createdDate: "2025-01-05",
    status: "Correction Requested", priority: "High", poNumber: "PO-2025-0128",
    reportId: "RPT-006", deliveredDate: null,
  },
  {
    id: "BK-007", clientName: "Pacific Traders Inc", inspectionType: "PSI",
    product: "Stainless Steel Cookware (1,200 sets)", factoryName: "Chaozhou Metal Works",
    factoryLocation: "Chaozhou, China", inspectorName: "Raj Mehta",
    scheduledDate: "2025-01-30", createdDate: "2025-01-18",
    status: "Ready to Deliver", priority: "Normal", poNumber: "PO-2025-0215",
    reportId: "RPT-007", deliveredDate: null,
  },
  {
    id: "BK-008", clientName: "EuroStyle GmbH", inspectionType: "CLS",
    product: "Glass Vases (4,000 pcs)", factoryName: "Shenzhen Glass Art Co.",
    factoryLocation: "Shenzhen, China", inspectorName: "Anita Sharma",
    scheduledDate: "2025-02-01", createdDate: "2025-01-20",
    status: "Assigned", priority: "Normal", poNumber: "PO-2025-0230",
    reportId: null, deliveredDate: null,
  },
  {
    id: "BK-009", clientName: "AmeriGoods LLC", inspectionType: "DPI",
    product: "Bluetooth Speakers (6,000 units)", factoryName: "Shenzhen Electronics Hub",
    factoryLocation: "Shenzhen, China", inspectorName: "Li Wei",
    scheduledDate: "2025-01-17", createdDate: "2025-01-07",
    status: "Delivered", priority: "High", poNumber: "PO-2025-0135",
    reportId: "RPT-009", deliveredDate: "2025-01-23",
  },
  {
    id: "BK-010", clientName: "Nordic Home Essentials", inspectionType: "Factory Audit",
    product: "Bamboo Kitchenware (2,500 sets)", factoryName: "Anji Bamboo Products",
    factoryLocation: "Huzhou, China", inspectorName: "Raj Mehta",
    scheduledDate: "2025-02-03", createdDate: "2025-01-22",
    status: "Scheduled", priority: "Normal", poNumber: "PO-2025-0245",
    reportId: null, deliveredDate: null,
  },
];

export const MOCK_INSPECTORS = [
  { id: "INS-001", name: "Raj Mehta", email: "raj.mehta@rms.com", specialization: "PSI / DPI", activeJobs: 3, completedJobs: 47, rating: 4.8 },
  { id: "INS-002", name: "Anita Sharma", email: "anita.sharma@rms.com", specialization: "CLS / PSI", activeJobs: 2, completedJobs: 39, rating: 4.9 },
  { id: "INS-003", name: "Li Wei", email: "li.wei@rms.com", specialization: "Factory & Social Audit", activeJobs: 2, completedJobs: 52, rating: 4.7 },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, message: "Report RPT-002 finalized by TM Sarah Chen — Ready for client delivery", type: "success", timeAgo: "12 min ago", isRead: false, bookingId: "BK-002" },
  { id: 2, message: "Inspector Raj Mehta submitted report RPT-007 for TM review", type: "info", timeAgo: "45 min ago", isRead: false, bookingId: "BK-007" },
  { id: 3, message: "Correction requested on RPT-006 (Social Audit) — Round 1", type: "warning", timeAgo: "2 hours ago", isRead: false, bookingId: "BK-006" },
  { id: 4, message: "New booking BK-010 created for Nordic Home Essentials", type: "info", timeAgo: "3 hours ago", isRead: true, bookingId: "BK-010" },
  { id: 5, message: "Client Sunrise Exports acknowledged delivery of RPT-001", type: "success", timeAgo: "1 day ago", isRead: true, bookingId: "BK-001" },
  { id: 6, message: "Inspector Li Wei completed factory audit at Jiangxi Woodcraft", type: "info", timeAgo: "1 day ago", isRead: true, bookingId: "BK-004" },
];

export const STATUS_COLORS = {
  "Scheduled":            { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200" },
  "Assigned":             { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-200" },
  "In Progress":          { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200" },
  "Under TM Review":      { bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-200" },
  "Correction Requested": { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200" },
  "Ready to Deliver":     { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  "Delivered":            { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-200" },
};

export const INSPECTION_TYPES = ["PSI", "CLS", "DPI", "Factory Audit", "Social Audit"];
export const ALL_STATUSES = ["Scheduled", "Assigned", "In Progress", "Under TM Review", "Correction Requested", "Ready to Deliver", "Delivered"];
