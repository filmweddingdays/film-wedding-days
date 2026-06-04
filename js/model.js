/* Data model, normalization & business calculations */

function defaultExpenseBreakdown() {
  return Object.fromEntries(EXPENSE_FIELDS.map((f) => [f.key, 0]));
}

function defaultDeliverables() {
  return Object.fromEntries(DELIVERABLE_KEYS.map((d) => [d.key, false]));
}

function defaultServices() {
  return {
    droneIncluded: false,
    teaserIncluded: false,
    cinematicFilmIncluded: false,
    traditionalVideoIncluded: true,
    hardDiskIncluded: false,
  };
}

function defaultPayments() {
  return {
    totalPackage: 0,
    advancePaid: 0,
    secondPayment: 0,
    finalPayment: 0,
    balanceAmount: 0,
    dueDate: "",
    paymentMode: "",
    notes: "",
  };
}

function defaultCustomer() {
  return {
    customerName: "",
    brideName: "",
    groomName: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
  };
}

function normalizeCrewPayout(p, roster = []) {
  const crewKey = p.crewKey || "";
  if (crewKey && crewKey !== "other") {
    const match = roster.find((r) => r.crewKey === crewKey);
    if (match) {
      return {
        crewKey,
        name: match.name,
        role: match.roleLabel,
        payout: Number(p.payout) || 0,
        paid: !!p.paid,
        paymentDate: p.paymentDate || "",
        notes: p.notes || "",
      };
    }
  }
  return {
    crewKey: crewKey || "other",
    name: p.name || "",
    role: p.role || "",
    payout: Number(p.payout) || 0,
    paid: !!p.paid,
    paymentDate: p.paymentDate || "",
    notes: p.notes || "",
  };
}

function getCrewRoster(crewData) {
  const roster = [];
  CREW_SLOTS.forEach(({ field, roleKey, label }) => {
    (crewData[field] || []).forEach((name) => {
      if (!name.trim()) return;
      roster.push({
        crewKey: `${roleKey}::${name.trim()}`,
        roleKey,
        roleLabel: label,
        name: name.trim(),
      });
    });
  });
  return roster;
}

function normalizeOrder(o) {
  const customer = { ...defaultCustomer(), ...(o.customer || {}) };
  if (o.customerName && !customer.customerName) customer.customerName = o.customerName;

  const crewFields = {};
  CREW_SLOTS.forEach(({ field }) => {
    crewFields[field] = o[field] || [];
  });

  const expenseBreakdown = { ...defaultExpenseBreakdown(), ...(o.expenseBreakdown || {}) };
  if (typeof o.expenses === "number" && !o.expenseBreakdown) {
    expenseBreakdown.other = (expenseBreakdown.other || 0) + o.expenses;
  }

  const roster = getCrewRoster(crewFields);
  const rawPayouts = Array.isArray(o.crewPayouts)
    ? o.crewPayouts
    : Array.isArray(o.labourPayouts)
      ? o.labourPayouts
      : [];

  const payments = { ...defaultPayments(), ...(o.payments || {}) };
  if (!o.payments && o.budget) payments.totalPackage = Number(o.budget) || 0;
  payments.totalPackage = Number(payments.totalPackage) || Number(o.budget) || 0;
  payments.advancePaid = Number(payments.advancePaid) || 0;
  payments.secondPayment = Number(payments.secondPayment) || 0;
  payments.finalPayment = Number(payments.finalPayment) || 0;
  payments.balanceAmount =
    payments.totalPackage -
    (payments.advancePaid + payments.secondPayment + payments.finalPayment);

  return {
    id: o.id,
    ...customer,
    customerName: customer.customerName || o.customerName || "",
    eventType: o.eventType || "Wedding",
    venue: o.venue || "",
    city: o.city || "",
    mapLink: o.mapLink || "",
    startDate: o.startDate || "",
    endDate: o.endDate || o.startDate || "",
    numberOfDays: Number(o.numberOfDays) || getEventDaysFromDates(o.startDate, o.endDate),
    scheduleTimes: Array.isArray(o.scheduleTimes) ? o.scheduleTimes : [],
    ...crewFields,
    drone: o.drone ?? "",
    albumCount: Number(o.albumCount) || 0,
    albumSize: o.albumSize || "",
    ledWallSize: o.ledWallSize ?? "",
    services: { ...defaultServices(), ...(o.services || {}) },
    crewPayouts: rawPayouts.map((p) => normalizeCrewPayout(p, roster)),
    expenseBreakdown,
    payments,
    deliverables: { ...defaultDeliverables(), ...(o.deliverables || {}) },
    status: o.status || "confirmed",
    budget: Number(o.budget) || payments.totalPackage || 0,
    notes: o.notes || "",
  };
}

function normalizeLead(l) {
  return {
    id: l.id || createId("lead"),
    name: l.name || "",
    phone: l.phone || "",
    eventDate: l.eventDate || "",
    eventType: l.eventType || "Wedding",
    location: l.location || "",
    budgetRange: l.budgetRange || "",
    source: l.source || "WhatsApp",
    status: l.status || "New",
    followUpDate: l.followUpDate || "",
    notes: l.notes || "",
  };
}

function normalizeTeamMember(m) {
  return {
    id: m.id || createId("team"),
    name: m.name || "",
    role: m.role || "Photographer",
    phone: m.phone || "",
    dayRate: Number(m.dayRate) || 0,
    availability: m.availability || "Available",
    notes: m.notes || "",
  };
}

function getEventDaysFromDates(start, end) {
  if (!start) return 1;
  const s = parseDate(start);
  const e = parseDate(end || start);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

function getEventDays(order) {
  return order.numberOfDays || getEventDaysFromDates(order.startDate, order.endDate);
}

function getCrewPayoutTotal(order) {
  return (order.crewPayouts || []).reduce((s, l) => s + (Number(l.payout) || 0), 0);
}

function getExpenseBreakdownTotal(order) {
  const b = order.expenseBreakdown || defaultExpenseBreakdown();
  return Object.values(b).reduce((s, v) => s + (Number(v) || 0), 0);
}

function getTotalExpenses(order) {
  return getExpenseBreakdownTotal(order) + getCrewPayoutTotal(order);
}

function getProfit(order) {
  const revenue = order.payments?.totalPackage || order.budget || 0;
  return revenue - getTotalExpenses(order);
}

function getProfitPct(order) {
  const revenue = order.payments?.totalPackage || order.budget || 0;
  return pct(getProfit(order), revenue);
}

function getTotalPaid(order) {
  const p = order.payments || defaultPayments();
  return (Number(p.advancePaid) || 0) + (Number(p.secondPayment) || 0) + (Number(p.finalPayment) || 0);
}

function getBalance(order) {
  const pkg = order.payments?.totalPackage || order.budget || 0;
  return pkg - getTotalPaid(order);
}

function getDeliverableProgress(order) {
  const d = order.deliverables || defaultDeliverables();
  const done = DELIVERABLE_KEYS.filter((k) => d[k.key]).length;
  return pct(done, DELIVERABLE_KEYS.length);
}

function formatDateRange(order) {
  const start = parseDate(order.startDate);
  const end = parseDate(order.endDate);
  if (order.startDate === order.endDate) {
    return formatDate(start, { day: "numeric", month: "short", year: "numeric" });
  }
  return `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function crewSummary(order) {
  const parts = [];
  if (order.photographers?.length) parts.push(`📷 ${order.photographers.join(", ")}`);
  if (order.videographers?.length) parts.push(`🎬 ${order.videographers.join(", ")}`);
  if (order.candidPhotographers?.length) parts.push(`✨ ${order.candidPhotographers.join(", ")}`);
  return parts.join(" · ") || "No crew assigned";
}

function allAssignedCrew(order) {
  const names = [];
  CREW_SLOTS.forEach(({ field }) => {
    (order[field] || []).forEach((n) => names.push({ name: n, field }));
  });
  return names;
}

function orderOverlapsDay(order, date) {
  const d = toIsoDate(date);
  return d >= order.startDate && d <= order.endDate;
}

function getCrewClashes(forDate) {
  const iso = typeof forDate === "string" ? forDate : toIsoDate(forDate);
  const dayOrders = orders.filter((o) => orderOverlapsDay(o, parseDate(iso)));
  const map = new Map();
  dayOrders.forEach((o) => {
    allAssignedCrew(o).forEach(({ name }) => {
      if (!name) return;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(o);
    });
  });
  return [...map.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([name, list]) => ({ name, orders: list }));
}

function isEditingPending(o) {
  return ["shoot-completed", "editing"].includes(o.status);
}

function isAlbumPending(o) {
  return ["editing", "album-design"].includes(o.status) || getDeliverableProgress(o) < 100;
}

function isShootCompleted(o) {
  return ["shoot-completed", "editing", "album-design", "delivered", "closed"].includes(o.status);
}

function getTotals(list) {
  return list.reduce(
    (acc, o) => ({
      revenue: acc.revenue + (o.payments?.totalPackage || o.budget || 0),
      expenses: acc.expenses + getTotalExpenses(o),
      paid: acc.paid + getTotalPaid(o),
      balance: acc.balance + getBalance(o),
    }),
    { revenue: 0, expenses: 0, paid: 0, balance: 0 }
  );
}

function getOrdersThisMonth(list = orders) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return list.filter((o) => {
    const d = parseDate(o.startDate);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

function getUpcoming(list = orders, limit = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [...list]
    .filter((o) => parseDate(o.endDate) >= today)
    .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
    .slice(0, limit);
}

function getTodaySchedule() {
  const today = toIsoDate(new Date());
  return orders
    .filter((o) => orderOverlapsDay(o, parseDate(today)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function getPendingPayments() {
  return orders.filter((o) => getBalance(o) > 0 && o.status !== "cancelled");
}

function getEditingPendingOrders() {
  return orders.filter((o) => isEditingPending(o));
}

function getAlbumPendingOrders() {
  return orders.filter((o) => isAlbumPending(o) && o.status !== "cancelled");
}

function getMonthWiseStats(monthsBack = 12) {
  const now = new Date();
  const stats = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const period = orders.filter((o) => {
      const s = parseDate(o.startDate);
      return s.getFullYear() === y && s.getMonth() === m;
    });
    const totals = getTotals(period);
    stats.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      count: period.length,
      revenue: totals.revenue,
      expenses: totals.expenses,
      profit: totals.revenue - totals.expenses,
    });
  }
  return stats;
}

function getEventTypeCounts() {
  const map = new Map();
  orders.forEach((o) => {
    const t = o.eventType || "Wedding";
    map.set(t, (map.get(t) || 0) + 1);
  });
  return EVENT_TYPES.map((t) => ({ ...t, count: map.get(t.id) || 0 })).filter((t) => t.count > 0);
}

function getTeamStats(member) {
  const name = member.name;
  const assigned = orders.filter((o) => allAssignedCrew(o).some((c) => c.name === name));
  let pending = 0;
  let paid = 0;
  assigned.forEach((o) => {
    (o.crewPayouts || []).forEach((p) => {
      if (p.name !== name) return;
      if (p.paid) paid += Number(p.payout) || 0;
      else pending += Number(p.payout) || 0;
    });
  });
  return { assigned: assigned.length, pending, paid };
}

function renderChips(arr, cls = "chip") {
  if (!arr?.length) return `<span class="meta">—</span>`;
  return arr.map((n) => `<span class="${cls}">${escapeHtml(n)}</span>`).join("");
}
