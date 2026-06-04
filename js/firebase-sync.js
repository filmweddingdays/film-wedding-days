/* ============================================================
   FILM WEDDING DAYS — FIREBASE SYNC (REST API)
   Stores app state ({orders, leads, team}) in Firebase
   Uses REST API instead of SDK (no CDN dependency)
   Falls back to localStorage when offline / not configured
   ============================================================ */

let firebaseSaveTimer = null;
let firebaseLastError = null;
let firebaseInitialized = false;

function firebaseReady() {
  return (
    typeof FIREBASE_ENABLED !== "undefined" &&
    FIREBASE_ENABLED === true &&
    typeof FIREBASE_CONFIG === "object" &&
    FIREBASE_CONFIG.projectId &&
    firebaseInitialized === true
  );
}

/* Initialize Firebase (no SDK needed, just validate config) */
async function initFirebase() {
  try {
    console.log("✓ Firebase REST API ready");
    console.log("Project:", FIREBASE_CONFIG.projectId);
    console.log("Database:", FIREBASE_CONFIG.databaseURL);
    firebaseInitialized = true;
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

/* Read data from Firebase using REST API */
async function firebaseLoad() {
  const url = `${FIREBASE_CONFIG.databaseURL}/app_data.json?auth=${FIREBASE_CONFIG.apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (e) {
    throw new Error(`firebase load failed: ${e.message}`);
  }
}

/* Write data to Firebase using REST API */
async function firebaseSaveNow(payload) {
  const url = `${FIREBASE_CONFIG.databaseURL}/app_data.json?auth=${FIREBASE_CONFIG.apiKey}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: payload.orders,
        leads: payload.leads,
        team: payload.team,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    throw new Error(`firebase save failed: ${e.message}`);
  }
}

/* Debounced Firebase push — called from saveAppData on every change */
function firebasePush(payload) {
  if (!firebaseReady()) return;
  clearTimeout(firebaseSaveTimer);
  firebaseSaveTimer = setTimeout(() => {
    firebaseSaveNow(payload)
      .then(() => {
        firebaseLastError = null;
        setFirebaseStatus("saved");
      })
      .catch((e) => {
        firebaseLastError = e;
        console.error("Firebase save error:", e);
        setFirebaseStatus("error");
      });
  }, 600);
}

/* Footer status text */
function setFirebaseStatus(state) {
  const el = document.querySelector(".site-footer span");
  if (!el) return;
  if (!firebaseReady()) {
    el.textContent = "Data saved in this browser only";
    return;
  }
  if (state === "saving") el.textContent = "Syncing to Firebase…";
  else if (state === "error") el.textContent = "⚠ Firebase sync failed — saved locally";
  else el.textContent = "✓ Synced to Firebase";
}

/* On startup: pull from Firebase (source of truth) */
async function syncWithFirebase() {
  if (!firebaseReady()) {
    console.log("Firebase not ready, using local storage");
    setFirebaseStatus();
    return;
  }
  setFirebaseStatus("saving");
  try {
    const remote = await firebaseLoad();
    const hasRemote =
      remote &&
      ((Array.isArray(remote.orders) && remote.orders.length) ||
        (Array.isArray(remote.leads) && remote.leads.length) ||
        (Array.isArray(remote.team) && remote.team.length));

    if (hasRemote) {
      // Firebase data exists — adopt it
      orders = (remote.orders || []).map(normalizeOrder);
      leads = (remote.leads || []).map(normalizeLead);
      team = (remote.team || []).map(normalizeTeamMember);
      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ orders, leads, team }));
      } catch (e) {}
      if (typeof render === "function") render();
    } else {
      // First time — seed Firebase with local data
      await firebaseSaveNow({ orders, leads, team });
    }
    setFirebaseStatus("saved");
  } catch (e) {
    firebaseLastError = e;
    console.error("Firebase sync error:", e);
    setFirebaseStatus("error");
  }
}
