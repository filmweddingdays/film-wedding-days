/* Film Wedding Days — configuration & constants */
const APP_STORAGE_KEY = "fwds-app-v3";
const STORAGE_KEY_LEGACY_V2 = "fwds-orders-v2";
const STORAGE_KEY_LEGACY_V1 = "fwds-orders-v1";
const HISTORY_KEY = "fwds-history-v1";
const MAX_HISTORY_ENTRIES = 50;

const ROUTES = [
  { id: "dashboard", label: "Dashboard", icon: "◆", hash: "#/" },
  { id: "calendar", label: "Calendar", icon: "▦", hash: "#/calendar" },
  { id: "orders", label: "Orders", icon: "☰", hash: "#/orders" },
  { id: "leads", label: "Leads", icon: "✦", hash: "#/leads" },
  { id: "team", label: "Team", icon: "◎", hash: "#/team" },
  { id: "reports", label: "Reports", icon: "▤", hash: "#/reports" },
];

/* Event types — refined film palette (brass → wine → warm earth tones) */
const EVENT_TYPES = [
  { id: "Wedding", label: "Wedding", color: "#b08534" },
  { id: "Engagement", label: "Engagement", color: "#6c2f39" },
  { id: "Reception", label: "Reception", color: "#8a6622" },
  { id: "Baby Shower", label: "Baby Shower", color: "#a07857" },
  { id: "Puberty Shoot", label: "Puberty Shoot", color: "#3f6b4d" },
  { id: "Pre Wedding", label: "Pre Wedding", color: "#9a8a6a" },
  { id: "Post Wedding", label: "Post Wedding", color: "#5c4a38" },
  { id: "Maxi Shoot", label: "Maxi Shoot", color: "#7a5c3a" },
  { id: "Colabration", label: "Colabration", color: "#8a5a4a" },
  { id: "Temple", label: "Temple", color: "#9a7a5a" },
  { id: "Baby Shoot", label: "Baby Shoot", color: "#b08a6a" },
  { id: "Ear Piercing", label: "Ear Piercing", color: "#6c5a3a" },
  { id: "Maxi photo", label: "Maxi photo", color: "#8a7a5a" },
  { id: "Mangalyam", label: "Mangalyam", color: "#a07a5a" },
  { id: "Drone shoot", label: "Drone shoot", color: "#5c4a38" },
  { id: "Awards night", label: "Awards night", color: "#7a5c2a" },
  { id: "Annual day", label: "Annual day", color: "#9a8a5a" },
  { id: "Montage shoot", label: "Montage shoot", color: "#6c3a3a" },
  { id: "Birthday Shoot", label: "Birthday Shoot", color: "#8a5a2a" },
  { id: "Eluthingal", label: "Eluthingal", color: "#7a6a4a" },
  { id: "School", label: "School", color: "#8a6a3a" },
  { id: "BNI", label: "BNI", color: "#7a5a4a" },
  { id: "Opening", label: "Opening", color: "#9a7a4a" },
  { id: "Promotion", label: "Promotion", color: "#5c3a3a" },
];

/* Order statuses — graduated earth-tone scale: stone → brass → wine → green → ink */
const ORDER_STATUSES = [
  { id: "new-lead", label: "New Lead", color: "#9c8f7a" },
  { id: "quotation-sent", label: "Quotation Sent", color: "#b0a07a" },
  { id: "advance-paid", label: "Advance Paid", color: "#c9a227" },
  { id: "confirmed", label: "Confirmed", color: "#b08534" },
  { id: "shoot-scheduled", label: "Shoot Scheduled", color: "#8a6622" },
  { id: "shoot-completed", label: "Shoot Completed", color: "#6c5a3a" },
  { id: "editing", label: "Editing", color: "#6c2f39" },
  { id: "album-design", label: "Album Design", color: "#8a4a52" },
  { id: "delivered", label: "Delivered", color: "#3f6b4d" },
  { id: "closed", label: "Closed", color: "#221d16" },
  { id: "cancelled", label: "Cancelled", color: "#a73a30" },
];

const LEAD_SOURCES = ["Instagram", "WhatsApp", "Referral", "BNI", "Website", "Direct Call"];
const LEAD_STATUSES = ["New", "Contacted", "Quotation Sent", "Follow-up", "Converted", "Lost"];

const CREW_SLOTS = [
  { field: "photographers", roleKey: "traditionalPhotographer", label: "Traditional Photographer" },
  { field: "videographers", roleKey: "traditionalVideographer", label: "Traditional Videographer" },
  { field: "candidPhotographers", roleKey: "candidPhotographer", label: "Candid Photographer" },
  { field: "candidVideographers", roleKey: "candidVideographer", label: "Candid Videographer" },
  { field: "receivingVideographers", roleKey: "receivingVideographer", label: "Receiving Videographer" },
  { field: "droneOperators", roleKey: "droneOperator", label: "Drone Operator" },
  { field: "editors", roleKey: "editor", label: "Editor" },
  { field: "albumDesigners", roleKey: "albumDesigner", label: "Album Designer" },
  { field: "assistants", roleKey: "assistant", label: "Assistant" },
];

const EXPENSE_FIELDS = [
  { key: "photographerSalary", label: "Photographer salary" },
  { key: "videographerSalary", label: "Videographer salary" },
  { key: "candidPhotographerSalary", label: "Candid photographer salary" },
  { key: "candidVideographerSalary", label: "Candid videographer salary" },
  { key: "droneOperator", label: "Drone operator" },
  { key: "editorPayment", label: "Editor payment" },
  { key: "albumDesigner", label: "Album designer" },
  { key: "albumPrinting", label: "Album printing" },
  { key: "travel", label: "Travel" },
  { key: "food", label: "Food" },
  { key: "stay", label: "Stay" },
  { key: "vehicleRent", label: "Vehicle rent" },
  { key: "cameraRent", label: "Camera rent" },
  { key: "ledWall", label: "LED wall" },
  { key: "hardDisk", label: "Hard disk" },
  { key: "officeShare", label: "Office share" },
  { key: "other", label: "Other expenses" },
];

const DELIVERABLE_KEYS = [
  { key: "rawBackupDone", label: "Raw backup done" },
  { key: "photoSelectionReceived", label: "Photo selection received" },
  { key: "editedPhotosDelivered", label: "Edited photos delivered" },
  { key: "teaserDelivered", label: "Teaser delivered" },
  { key: "traditionalVideoDelivered", label: "Traditional video delivered" },
  { key: "candidFilmDelivered", label: "Candid film delivered" },
  { key: "fullWeddingFilmDelivered", label: "Full wedding film delivered" },
  { key: "albumDesignStarted", label: "Album design started" },
  { key: "albumDesignApproved", label: "Album design approved" },
  { key: "albumPrinted", label: "Album printed" },
  { key: "albumDelivered", label: "Album delivered" },
  { key: "finalHardDiskDelivered", label: "Final hard disk delivered" },
];

const MONTH_TAB_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getEventTypeMeta(type) {
  return EVENT_TYPES.find((t) => t.id === type) || EVENT_TYPES[0];
}

function getStatusMeta(status) {
  return ORDER_STATUSES.find((s) => s.id === status) || ORDER_STATUSES[0];
}
