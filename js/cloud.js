/* ============================================================
   FILM WEDDING DAYS — CLOUD SYNC (Supabase REST)
   Stores the whole app state ({orders, leads, team}) as a single
   JSON row so it persists across every device/browser.
   Falls back to local cache silently when offline / not configured.
   ============================================================ */

const CLOUD_ROW_ID = "singleton";
let cloudSaveTimer = null;
let cloudLastError = null;

function cloudReady() {
  return (
    typeof CLOUD_ENABLED !== "undefined" &&
    CLOUD_ENABLED === true &&
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL &&
    !SUPABASE_URL.includes("YOUR-PROJECT") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("YOUR-ANON")
  );
}

function cloudHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

/* Read the singleton row. Returns {orders, leads, team} or null. */
async function cloudLoad() {
  const url = `${SUPABASE_URL}/rest/v1/app_data?id=eq.${CLOUD_ROW_ID}&select=orders,leads,team`;
  const res = await fetch(url, { headers: cloudHeaders() });
  if (!res.ok) throw new Error(`cloud load ${res.status}`);
  const rows = await res.json();
  return rows && rows.length ? rows[0] : null;
}

/* Write the whole state to the singleton row (upsert). */
async function cloudSaveNow(payload) {
  const body = JSON.stringify({
    id: CLOUD_ROW_ID,
    orders: payload.orders,
    leads: payload.leads,
    team: payload.team,
    updated_at: new Date().toISOString(),
  });
  // Upsert via POST with on-conflict merge so it works whether or not the row exists.
  const url = `${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`;
  const res = await fetch(url, {
    method: "POST",
    headers: cloudHeaders({
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body,
  });
  if (!res.ok) throw new Error(`cloud save ${res.status} ${await res.text()}`);
}

/* Debounced cloud push — called from saveAppData on every change. */
function cloudPush(payload) {
  if (!cloudReady()) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    cloudSaveNow(payload)
      .then(() => {
        cloudLastError = null;
        setCloudStatus("saved");
      })
      .catch((e) => {
        cloudLastError = e;
        console.error("Cloud save failed:", e);
        setCloudStatus("error");
      });
  }, 600);
}

/* Footer status text reflecting where data lives. */
function setCloudStatus(state) {
  const el = document.querySelector(".site-footer span");
  if (!el) return;
  if (!cloudReady()) {
    el.textContent = "Data saved in this browser only";
    return;
  }
  if (state === "saving") el.textContent = "Syncing to cloud…";
  else if (state === "error") el.textContent = "⚠ Cloud sync failed — saved locally";
  else el.textContent = "✓ Synced to cloud";
}

/* On startup: pull cloud data (source of truth). If the cloud row is
   empty, seed it from whatever is currently loaded locally. */
async function syncWithCloud() {
  if (!cloudReady()) {
    setCloudStatus();
    return;
  }
  setCloudStatus("saving");
  try {
    const remote = await cloudLoad();
    const hasRemote =
      remote &&
      ((Array.isArray(remote.orders) && remote.orders.length) ||
        (Array.isArray(remote.leads) && remote.leads.length) ||
        (Array.isArray(remote.team) && remote.team.length));

    if (hasRemote) {
      // Cloud wins — adopt it and refresh the UI.
      orders = (remote.orders || []).map(normalizeOrder);
      leads = (remote.leads || []).map(normalizeLead);
      team = (remote.team || []).map(normalizeTeamMember);
      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ orders, leads, team }));
      } catch (e) {}
      if (typeof render === "function") render();
    } else {
      // Fresh cloud project — seed it with current local data.
      await cloudSaveNow({ orders, leads, team });
    }
    setCloudStatus("saved");
  } catch (e) {
    cloudLastError = e;
    console.error("Cloud sync failed, using local data:", e);
    setCloudStatus("error");
  }
}
