/* Schedule calendar — month / week / day views */

function getCalendarAnchorDate() {
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const day = Math.min(calDay, daysInMonth);
  return new Date(calYear, calMonth, day);
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function getCalendarTitle() {
  const anchor = getCalendarAnchorDate();
  if (calView === "day") {
    return formatDate(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (calView === "week") {
    const start = getWeekStart(anchor);
    const end = getWeekEnd(anchor);
    const sameMonth = start.getMonth() === end.getMonth();
    const startStr = formatDate(start, { day: "numeric", month: "short" });
    const endStr = formatDate(end, {
      day: "numeric",
      month: sameMonth ? undefined : "short",
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }
  return new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getVisiblePeriodRange() {
  const anchor = getCalendarAnchorDate();
  if (calView === "day") {
    return { start: anchor, end: anchor };
  }
  if (calView === "week") {
    return { start: getWeekStart(anchor), end: getWeekEnd(anchor) };
  }
  const start = new Date(calYear, calMonth, 1);
  const end = new Date(calYear, calMonth + 1, 0);
  return { start, end };
}

function getPeriodClashes(start, end) {
  const seen = new Map();
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);
  while (d <= endD) {
    getCrewClashes(d).forEach((c) => {
      if (!seen.has(c.name)) seen.set(c.name, c);
    });
    d.setDate(d.getDate() + 1);
  }
  return [...seen.values()];
}

function getEventDayOnDate(order, date) {
  const start = parseDate(order.startDate);
  const d = parseDate(toIsoDate(date));
  return Math.max(1, Math.round((d - start) / 86400000) + 1);
}

function getSlotTimeForDate(order, date) {
  const iso = toIsoDate(date);
  const slots = order.scheduleTimes || [];
  const match = slots.find((s) => s.date === iso) || slots[0];
  if (!match) return "—";
  return match.endTime ? `${match.startTime} – ${match.endTime}` : match.startTime;
}

function renderCalendarEventCard(order, date) {
  const meta = getEventTypeMeta(order.eventType);
  const dayNum = getEventDayOnDate(order, date);
  const totalDays = getEventDays(order);
  const time = getSlotTimeForDate(order, date);
  const budget = formatCurrency(order.payments?.totalPackage || order.budget || 0);
  const name = order.customerName || "—";

  return `
    <button type="button" class="cal-event cal-event-rich" data-order-id="${escapeAttr(order.id)}"
      style="background:${meta.color};border-color:${meta.color}">
      <span class="cal-event-name">${escapeHtml(name)}</span>
      <span class="cal-event-badges">${eventTypeBadge(order.eventType)}</span>
      <span class="cal-event-day">Day ${dayNum}/${totalDays}</span>
      <span class="cal-event-time">${escapeHtml(time)}</span>
      <span class="cal-event-crew">${escapeHtml(crewSummary(order))}</span>
      <span class="cal-event-budget">${budget}</span>
    </button>`;
}

function renderClashBanner() {
  const { start, end } = getVisiblePeriodRange();
  const clashes = getPeriodClashes(start, end);
  if (!clashes.length) return "";

  const items = clashes
    .map((c) => {
      const names = c.orders.map((o) => escapeHtml(o.customerName)).join(", ");
      return `<li><strong>${escapeHtml(c.name)}</strong> — ${names}</li>`;
    })
    .join("");

  return `
    <div class="clash-banner card" style="margin-bottom:1rem;padding:0.85rem 1rem;border-color:var(--alert-border);background:var(--alert-bg);color:var(--alert-text)">
      <strong>⚠ Crew clash detected</strong>
      <ul style="margin:0.5rem 0 0;padding-left:1.25rem;font-size:0.85rem">${items}</ul>
    </div>`;
}

function renderMonthGrid() {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const first = new Date(calYear, calMonth, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = weekdays.map((w) => `<div class="cal-weekday">${w}</div>`).join("");

  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    html += renderDayCell(new Date(calYear, calMonth - 1, day), true);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    html += renderDayCell(date, false, today);
  }

  const totalCells = startPad + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    html += renderDayCell(new Date(calYear, calMonth + 1, d), true);
  }

  return `<div class="cal-grid">${html}</div>`;
}

function renderDayCell(date, otherMonth, todayRef) {
  const isToday =
    todayRef &&
    date.getFullYear() === todayRef.getFullYear() &&
    date.getMonth() === todayRef.getMonth() &&
    date.getDate() === todayRef.getDate();

  const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));
  const events = dayOrders.map((o) => renderCalendarEventCard(o, date)).join("");

  return `
    <div class="cal-day ${otherMonth ? "other-month" : ""} ${isToday ? "today" : ""}">
      <div class="cal-day-num">${date.getDate()}</div>
      ${events}
    </div>`;
}

function renderWeekView() {
  const anchor = getCalendarAnchorDate();
  const start = getWeekStart(anchor);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let row = '<div class="cal-week-row">';
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));
    const events = dayOrders.length
      ? dayOrders.map((o) => renderCalendarEventCard(o, date)).join("")
      : '<span class="meta">—</span>';
    row += `
      <div class="cal-week-cell ${isToday ? "today" : ""}">
        <strong>${formatDate(date, { weekday: "short", day: "numeric", month: "short" })}</strong>
        <div style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem">${events}</div>
      </div>`;
  }
  row += "</div>";
  return `<div class="cal-week-grid">${row}</div>`;
}

function renderDayView() {
  const date = getCalendarAnchorDate();
  const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));

  if (!dayOrders.length) {
    return `
      <div class="cal-day-view">
        <h3>${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
        <p class="empty-state">No events this day</p>
      </div>`;
  }

  const list = dayOrders.map((o) => renderCalendarEventCard(o, date)).join("");
  return `
    <div class="cal-day-view">
      <h3>${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
      <div style="display:flex;flex-direction:column;gap:0.5rem;max-width:28rem">${list}</div>
    </div>`;
}

function renderCalendar() {
  let body = "";
  if (calView === "month") body = renderMonthGrid();
  else if (calView === "week") body = renderWeekView();
  else body = renderDayView();

  return `
    <div class="page-header">
      <div>
        <h1>Schedule calendar</h1>
        <p>Month, week, and day views with crew clash warnings</p>
      </div>
      <p class="meta"><strong>${orders.length}</strong> total bookings</p>
    </div>
    ${renderClashBanner()}
    <div class="card calendar-card">
      <div class="cal-toolbar">
        <div class="cal-nav">
          <button type="button" id="cal-prev" aria-label="Previous">‹</button>
          <h2>${escapeHtml(getCalendarTitle())}</h2>
          <button type="button" id="cal-next" aria-label="Next">›</button>
          <button type="button" id="cal-today" class="btn-secondary btn-sm">Today</button>
        </div>
        <div class="cal-view-btns">
          <button type="button" data-cal-view="month" class="${calView === "month" ? "active" : ""}">Month</button>
          <button type="button" data-cal-view="week" class="${calView === "week" ? "active" : ""}">Week</button>
          <button type="button" data-cal-view="day" class="${calView === "day" ? "active" : ""}">Day</button>
        </div>
      </div>
      ${body}
    </div>`;
}

function shiftCalendarNav(delta) {
  if (calView === "month") {
    calMonth += delta;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    } else if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    return;
  }

  const anchor = getCalendarAnchorDate();
  if (calView === "week") {
    anchor.setDate(anchor.getDate() + delta * 7);
  } else {
    anchor.setDate(anchor.getDate() + delta);
  }
  calYear = anchor.getFullYear();
  calMonth = anchor.getMonth();
  calDay = anchor.getDate();
}

function bindCalendarEvents() {
  $("#cal-prev")?.addEventListener("click", () => {
    shiftCalendarNav(-1);
    if (typeof render === "function") render();
  });

  $("#cal-next")?.addEventListener("click", () => {
    shiftCalendarNav(1);
    if (typeof render === "function") render();
  });

  $("#cal-today")?.addEventListener("click", () => {
    const n = new Date();
    calYear = n.getFullYear();
    calMonth = n.getMonth();
    calDay = n.getDate();
    if (typeof render === "function") render();
  });

  $$("[data-cal-view]").forEach((btn) => {
    btn.onclick = () => {
      calView = btn.dataset.calView;
      if (typeof render === "function") render();
    };
  });

  $$(".cal-event").forEach((btn) => {
    btn.onclick = () => {
      if (typeof showOrderDetail === "function") {
        showOrderDetail(btn.dataset.orderId);
      }
    };
  });
}
