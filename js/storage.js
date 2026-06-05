/* Film Wedding Days — persistence, state & seed data */

let orders = [];
let leads = [];
let team = [];

let dashboardExportScope = "month";
let dashboardScope = "month";
let dashboardPickYear = new Date().getFullYear();
let dashboardPickMonth = new Date().getMonth();
let dashboardPickCustomYear = new Date().getFullYear(); // for "pick-year" scope
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calDay = new Date().getDate();
let calView = "month";
let editingOrderId = null;
let viewingCustomerId = null;

let orderFilters = {
  search: "",
  month: "",
  status: "",
  paymentStatus: "all",
  eventType: "",
};

/* ——— Seed: team ——— */
const SEED_TEAM = [
  { id: "team-ragu", name: "Ragu", role: "Lead Photographer", phone: "9876543210", dayRate: 12000, availability: "Available" },
  { id: "team-karthik", name: "Karthik", role: "Traditional Photographer", phone: "9876543211", dayRate: 8000, availability: "Available" },
  { id: "team-suresh", name: "Suresh", role: "Traditional Videographer", phone: "9876543212", dayRate: 9000, availability: "Available" },
  { id: "team-vijay", name: "Vijay", role: "Receiving Videographer", phone: "9876543213", dayRate: 7500, availability: "Available" },
  { id: "team-divya", name: "Divya", role: "Candid Photographer", phone: "9876543214", dayRate: 8500, availability: "Available" },
  { id: "team-prakash", name: "Prakash", role: "Candid Videographer", phone: "9876543215", dayRate: 8500, availability: "Busy" },
  { id: "team-anitha", name: "Anitha", role: "Photographer", phone: "9876543216", dayRate: 7000, availability: "Available" },
  { id: "team-murugan", name: "Murugan", role: "Assistant", phone: "9876543217", dayRate: 2500, availability: "Available" },
];

/* ——— Seed: leads ——— */
const SEED_LEADS = [
  {
    id: "lead-1",
    name: "Deepa & Karthik",
    phone: "9443012345",
    eventDate: "2026-02-14",
    eventType: "Wedding",
    location: "Coimbatore",
    budgetRange: "₹4–5 L",
    source: "Instagram",
    status: "Follow-up",
    followUpDate: "2025-06-15",
    notes: "Interested in candid + traditional combo",
  },
  {
    id: "lead-2",
    name: "Nandhini Family",
    phone: "9443023456",
    eventDate: "2025-11-08",
    eventType: "Puberty Shoot",
    location: "Erode",
    budgetRange: "₹80k–1 L",
    source: "Referral",
    status: "Quotation Sent",
    followUpDate: "2025-06-20",
    notes: "Venue confirmed at Namakkal hall",
  },
  {
    id: "lead-3",
    name: "Arun & Priya",
    phone: "9443034567",
    eventDate: "2026-01-18",
    eventType: "Engagement",
    location: "Chennai",
    budgetRange: "₹1.5 L",
    source: "BNI",
    status: "New",
    followUpDate: "2025-07-01",
    notes: "Asked for drone add-on quote",
  },
  {
    id: "lead-4",
    name: "Selvam & Family",
    phone: "9443045678",
    eventDate: "2025-12-22",
    eventType: "Baby Shower",
    location: "Salem",
    budgetRange: "₹60k",
    source: "WhatsApp",
    status: "Contacted",
    followUpDate: "2025-06-10",
    notes: "Half-day coverage only",
  },
];

/* ——— Seed: orders (raw → normalized at init) ——— */
const SEED_ORDERS_RAW = [
  {
    id: "seed-ord-1",
    customerName: "Kavitha & Murali",
    brideName: "Kavitha",
    groomName: "Murali",
    phone: "9443100001",
    whatsapp: "9443100001",
    eventType: "Wedding",
    city: "Erode",
    venue: "Vijay Mahal, Erode",
    status: "confirmed",
    startDate: "2025-11-14",
    endDate: "2025-11-15",
    scheduleTimes: [
      { date: "2025-11-14", startTime: "18:00", endTime: "23:00", label: "Engagement dinner" },
      { date: "2025-11-15", startTime: "06:00", endTime: "22:00", label: "Muhurtham & reception" },
    ],
    photographers: ["Ragu", "Karthik"],
    videographers: ["Suresh"],
    candidPhotographers: ["Divya"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", payout: 24000, paid: true, paymentDate: "2025-10-01" },
      { crewKey: "traditionalPhotographer::Karthik", payout: 18000, paid: false },
      { crewKey: "traditionalVideographer::Suresh", payout: 20000, paid: false },
      { crewKey: "candidPhotographer::Divya", payout: 16000, paid: true, paymentDate: "2025-10-05" },
    ],
    payments: { totalPackage: 420000, advancePaid: 150000, secondPayment: 100000 },
    deliverables: { rawBackupDone: true, photoSelectionReceived: true, editedPhotosDelivered: false },
    expenseBreakdown: {
      photographerSalary: 65000,
      videographerSalary: 35000,
      albumPrinting: 42000,
      travel: 18000,
      food: 12000,
      stay: 8000,
    },
  },
  {
    id: "seed-ord-2",
    customerName: "Revathi & Ganesh",
    brideName: "Revathi",
    groomName: "Ganesh",
    phone: "9443100002",
    whatsapp: "9443100002",
    eventType: "Reception",
    city: "Salem",
    venue: "Grand Palace, Salem",
    status: "shoot-scheduled",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    scheduleTimes: [{ date: "2025-12-20", startTime: "17:00", endTime: "23:30", label: "Reception" }],
    photographers: ["Anitha"],
    videographers: ["Suresh", "Vijay"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Anitha", payout: 14000, paid: false },
      { crewKey: "traditionalVideographer::Suresh", payout: 16000, paid: false },
      { crewKey: "receivingVideographer::Vijay", payout: 12000, paid: true, paymentDate: "2025-11-15" },
    ],
    payments: { totalPackage: 185000, advancePaid: 75000 },
    deliverables: { rawBackupDone: false },
    expenseBreakdown: {
      photographerSalary: 28000,
      videographerSalary: 32000,
      travel: 8000,
      vehicleRent: 6000,
      other: 2000,
    },
  },
  {
    id: "seed-ord-3",
    customerName: "Harini & Dinesh",
    brideName: "Harini",
    groomName: "Dinesh",
    phone: "9443100003",
    whatsapp: "9443100003",
    eventType: "Pre Wedding",
    city: "Coimbatore",
    venue: "Valparai Road, Coimbatore",
    status: "advance-paid",
    startDate: "2025-08-16",
    endDate: "2025-08-16",
    scheduleTimes: [{ date: "2025-08-16", startTime: "15:00", endTime: "19:00", label: "Outdoor pre-wedding" }],
    photographers: ["Ragu", "Divya"],
    candidVideographers: ["Prakash"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", payout: 15000, paid: true, paymentDate: "2025-08-20" },
      { crewKey: "candidPhotographer::Divya", payout: 12000, paid: true, paymentDate: "2025-08-20" },
      { crewKey: "candidVideographer::Prakash", payout: 14000, paid: false },
    ],
    payments: { totalPackage: 95000, advancePaid: 50000 },
    deliverables: { editedPhotosDelivered: true, teaserDelivered: true },
    expenseBreakdown: { photographerSalary: 22000, travel: 15000, food: 4000 },
  },
  {
    id: "seed-ord-4",
    customerName: "Lakshmi & Sanjay",
    brideName: "Lakshmi",
    groomName: "Sanjay",
    phone: "9443100004",
    whatsapp: "9443100004",
    eventType: "Wedding",
    city: "Chennai",
    venue: "ITC Grand Chola, Chennai",
    status: "editing",
    startDate: "2025-05-28",
    endDate: "2025-05-30",
    scheduleTimes: [
      { date: "2025-05-28", startTime: "18:00", endTime: "23:30", label: "Engagement" },
      { date: "2025-05-29", startTime: "07:00", endTime: "14:00", label: "Temple ceremony" },
      { date: "2025-05-30", startTime: "08:00", endTime: "22:00", label: "Wedding & reception" },
    ],
    photographers: ["Ragu", "Karthik", "Anitha"],
    videographers: ["Suresh", "Vijay"],
    candidPhotographers: ["Divya"],
    candidVideographers: ["Prakash"],
    droneOperators: ["Ragu"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", payout: 36000, paid: true, paymentDate: "2025-06-05" },
      { crewKey: "traditionalPhotographer::Karthik", payout: 24000, paid: true, paymentDate: "2025-06-05" },
      { crewKey: "traditionalVideographer::Suresh", payout: 28000, paid: true, paymentDate: "2025-06-08" },
      { crewKey: "candidVideographer::Prakash", payout: 22000, paid: false },
      { crewKey: "other", name: "Murugan", role: "Assistant", payout: 8000, paid: true, paymentDate: "2025-06-08" },
    ],
    payments: { totalPackage: 520000, advancePaid: 200000, secondPayment: 150000, finalPayment: 50000 },
    deliverables: {
      rawBackupDone: true,
      photoSelectionReceived: true,
      editedPhotosDelivered: true,
      teaserDelivered: true,
      traditionalVideoDelivered: false,
      candidFilmDelivered: false,
    },
    expenseBreakdown: {
      photographerSalary: 88000,
      videographerSalary: 52000,
      candidPhotographerSalary: 18000,
      candidVideographerSalary: 22000,
      droneOperator: 15000,
      travel: 35000,
      food: 22000,
      stay: 28000,
      albumPrinting: 48000,
    },
  },
  {
    id: "seed-ord-5",
    customerName: "Meena & Kumar",
    brideName: "Meena",
    groomName: "Kumar",
    phone: "9443100005",
    whatsapp: "9443100005",
    eventType: "Engagement",
    city: "Namakkal",
    venue: "Sri Lakshmi Kalyana Mandapam",
    status: "quotation-sent",
    startDate: "2026-03-08",
    endDate: "2026-03-08",
    scheduleTimes: [{ date: "2026-03-08", startTime: "10:00", endTime: "14:00", label: "Ring ceremony" }],
    photographers: ["Karthik"],
    videographers: ["Suresh"],
    crewPayouts: [],
    payments: { totalPackage: 75000, advancePaid: 0 },
    deliverables: {},
    expenseBreakdown: { photographerSalary: 0, travel: 0 },
  },
  {
    id: "seed-ord-6",
    customerName: "Priyanka & Arun",
    brideName: "Priyanka",
    groomName: "Arun",
    phone: "9443100006",
    whatsapp: "9443100006",
    eventType: "Wedding",
    city: "Tiruchengode",
    venue: "Arulmigu Murugan Kalyana Mandapam",
    status: "shoot-completed",
    startDate: "2025-09-12",
    endDate: "2025-09-14",
    scheduleTimes: [
      { date: "2025-09-12", startTime: "06:00", endTime: "12:00", label: "Mehendi" },
      { date: "2025-09-13", startTime: "16:00", endTime: "23:00", label: "Sangeet" },
      { date: "2025-09-14", startTime: "08:00", endTime: "22:00", label: "Wedding" },
    ],
    photographers: ["Ragu", "Karthik"],
    videographers: ["Suresh", "Vijay"],
    candidPhotographers: ["Divya"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", payout: 28000, paid: true, paymentDate: "2025-09-20" },
      { crewKey: "traditionalPhotographer::Karthik", payout: 22000, paid: true, paymentDate: "2025-09-20" },
      { crewKey: "traditionalVideographer::Suresh", payout: 24000, paid: false },
      { crewKey: "receivingVideographer::Vijay", payout: 18000, paid: false },
    ],
    payments: { totalPackage: 450000, advancePaid: 200000, secondPayment: 100000 },
    deliverables: { rawBackupDone: true, photoSelectionReceived: true },
    expenseBreakdown: {
      photographerSalary: 72000,
      videographerSalary: 48000,
      albumPrinting: 45000,
      travel: 28000,
      cameraRent: 22000,
      officeShare: 8000,
    },
  },
  {
    id: "seed-ord-7",
    customerName: "Anitha & David",
    brideName: "Anitha",
    groomName: "David",
    phone: "9443100007",
    whatsapp: "9443100007",
    eventType: "Wedding",
    city: "Erode",
    venue: "St. Mary's Church & Green Park Hall",
    status: "album-design",
    startDate: "2025-07-18",
    endDate: "2025-07-18",
    scheduleTimes: [{ date: "2025-07-18", startTime: "09:00", endTime: "21:00", label: "Church + reception" }],
    photographers: ["Anitha"],
    videographers: ["Ragu", "Prakash"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Anitha", payout: 20000, paid: true, paymentDate: "2025-07-25" },
      { crewKey: "traditionalVideographer::Ragu", payout: 18000, paid: true, paymentDate: "2025-07-25" },
      { crewKey: "other", name: "Murugan", role: "Helper", payout: 6000, paid: true, paymentDate: "2025-07-28" },
    ],
    payments: { totalPackage: 280000, advancePaid: 140000, secondPayment: 80000 },
    deliverables: {
      rawBackupDone: true,
      editedPhotosDelivered: true,
      teaserDelivered: true,
      traditionalVideoDelivered: true,
      albumDesignStarted: true,
      albumDesignApproved: false,
    },
    expenseBreakdown: {
      photographerSalary: 38000,
      videographerSalary: 28000,
      albumDesigner: 12000,
      albumPrinting: 22000,
      travel: 15000,
    },
  },
  {
    id: "seed-ord-8",
    customerName: "Shalini & Prakash",
    brideName: "Shalini",
    groomName: "Prakash",
    phone: "9443100008",
    whatsapp: "9443100008",
    eventType: "Baby Shower",
    city: "Chennai",
    venue: "Home event, T Nagar",
    status: "delivered",
    startDate: "2025-04-06",
    endDate: "2025-04-06",
    scheduleTimes: [{ date: "2025-04-06", startTime: "11:00", endTime: "15:00", label: "Baby shower" }],
    photographers: ["Divya"],
    videographers: ["Vijay"],
    crewPayouts: [
      { crewKey: "candidPhotographer::Divya", payout: 8000, paid: true, paymentDate: "2025-04-10" },
      { crewKey: "receivingVideographer::Vijay", payout: 7000, paid: true, paymentDate: "2025-04-10" },
    ],
    payments: { totalPackage: 45000, advancePaid: 25000, secondPayment: 20000 },
    deliverables: {
      rawBackupDone: true,
      editedPhotosDelivered: true,
      teaserDelivered: true,
      finalHardDiskDelivered: true,
    },
    expenseBreakdown: { photographerSalary: 12000, travel: 3000, food: 2000 },
  },
  {
    id: "seed-ord-9",
    customerName: "Vijay & Keerthana",
    brideName: "Keerthana",
    groomName: "Vijay",
    phone: "9443100009",
    whatsapp: "9443100009",
    eventType: "Post Wedding",
    city: "Coimbatore",
    venue: "Pollachi highway shoot",
    status: "closed",
    startDate: "2025-02-22",
    endDate: "2025-02-22",
    scheduleTimes: [{ date: "2025-02-22", startTime: "05:30", endTime: "10:00", label: "Sunrise couple shoot" }],
    photographers: ["Ragu"],
    candidVideographers: ["Prakash"],
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", payout: 12000, paid: true, paymentDate: "2025-03-01" },
      { crewKey: "candidVideographer::Prakash", payout: 10000, paid: true, paymentDate: "2025-03-01" },
    ],
    payments: { totalPackage: 65000, advancePaid: 30000, secondPayment: 20000, finalPayment: 15000 },
    deliverables: {
      rawBackupDone: true,
      editedPhotosDelivered: true,
      candidFilmDelivered: true,
      fullWeddingFilmDelivered: true,
      finalHardDiskDelivered: true,
    },
    expenseBreakdown: { photographerSalary: 15000, travel: 8000, food: 2500 },
  },
  {
    id: "seed-ord-10",
    customerName: "Malathi & Selvam",
    brideName: "Malathi",
    groomName: "Selvam",
    phone: "9443100010",
    whatsapp: "9443100010",
    eventType: "Puberty Shoot",
    city: "Salem",
    venue: "Family residence, Salem",
    status: "new-lead",
    startDate: "2026-06-05",
    endDate: "2026-06-05",
    scheduleTimes: [{ date: "2026-06-05", startTime: "09:00", endTime: "13:00", label: "Puberty ceremony" }],
    photographers: ["Anitha"],
    crewPayouts: [],
    payments: { totalPackage: 85000, advancePaid: 10000 },
    deliverables: {},
    expenseBreakdown: { photographerSalary: 0, travel: 0, other: 0 },
  },
];

const SEED_ORDERS = SEED_ORDERS_RAW.map((o) => normalizeOrder(o));

/* ——— Load / save ——— */
function loadAppData() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data)) {
        return {
          orders: Array.isArray(data.orders) ? data.orders : [],
          leads: Array.isArray(data.leads) ? data.leads : [],
          team: Array.isArray(data.team) ? data.team : [],
        };
      }
    }
    return migrateLegacyOrders();
  } catch {
    return null;
  }
}

function migrateLegacyOrders() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY_LEGACY_V2);
    if (!raw) raw = localStorage.getItem(STORAGE_KEY_LEGACY_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return { orders: parsed, leads: [], team: [] };
  } catch {
    return null;
  }
}

function saveAppData(opts = {}) {
  try {
    localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({ orders, leads, team })
    );
  } catch (e) {
    console.error("saveAppData failed", e);
    return;
  }
  if (!opts.skipHistory && opts.history) {
    recordHistory(opts.history.action, opts.history.label);
  }
  // Push to Firebase on every save
  if (!opts.skipHistory) {
    if (typeof firebasePush === "function") firebasePush({ orders, leads, team });
  }
}

function initData() {
  const stored = loadAppData();
  if (stored) {
    orders = stored.orders.map(normalizeOrder);
    leads = stored.leads.length
      ? stored.leads.map(normalizeLead)
      : SEED_LEADS.map((l) => normalizeLead({ ...l }));
    team = stored.team.length
      ? stored.team.map(normalizeTeamMember)
      : SEED_TEAM.map((m) => normalizeTeamMember({ ...m }));
  } else {
    orders = SEED_ORDERS.map((o) => normalizeOrder({ ...o }));
    leads = SEED_LEADS.map((l) => normalizeLead({ ...l }));
    team = SEED_TEAM.map((m) => normalizeTeamMember({ ...m }));
  }
  saveAppData({ skipHistory: true });
}

/* ——— History ——— */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persistHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function formatHistoryTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function snapshotAppState() {
  return {
    orders: JSON.parse(JSON.stringify(orders)),
    leads: JSON.parse(JSON.stringify(leads)),
    team: JSON.parse(JSON.stringify(team)),
  };
}

function applySnapshot(snapshot) {
  if (Array.isArray(snapshot)) {
    orders = snapshot.map(normalizeOrder);
    leads = [];
    team = SEED_TEAM.map((m) => normalizeTeamMember({ ...m }));
    return;
  }
  orders = (snapshot.orders || []).map(normalizeOrder);
  leads = (snapshot.leads || []).map(normalizeLead);
  team = (snapshot.team || []).length
    ? snapshot.team.map(normalizeTeamMember)
    : SEED_TEAM.map((m) => normalizeTeamMember({ ...m }));
}

function recordHistory(action, label) {
  const entry = {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    action,
    label,
    orderCount: orders.length,
    leadCount: leads.length,
    teamCount: team.length,
    snapshot: snapshotAppState(),
  };
  const list = loadHistory();
  list.unshift(entry);
  while (list.length > MAX_HISTORY_ENTRIES) list.pop();
  persistHistory(list);
  return entry;
}

function restoreFromHistory(historyId) {
  const entry = loadHistory().find((h) => h.id === historyId);
  if (!entry?.snapshot) return false;
  if (
    !confirm(
      `Restore data from ${formatHistoryTime(entry.at)}?\n\n"${entry.label}"\n\nCurrent data will be saved to history first.`
    )
  ) {
    return false;
  }
  recordHistory("restore", `Before restore: ${entry.label}`);
  applySnapshot(entry.snapshot);
  saveAppData({
    history: { action: "restore", label: `Restored: ${entry.label}` },
  });
  return true;
}
