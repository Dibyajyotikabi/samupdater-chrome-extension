import { devices, regions } from "./catalogue.js";

const SITE = "https://samupdater.com/";
const LOOKUP_URL = new URL("wp-admin/admin-ajax.php", SITE);
const RELEASE_LIMIT = 3;
const PUBLIC_REQUEST = {
  credentials: "omit",
  redirect: "error",
  referrerPolicy: "no-referrer"
};
const MODEL = /^(?:SM|GT|SCH|SGH|SHV|SHW|SC|SCG|SCV|SCL)-[A-Z0-9]{3,12}$/;
const CSC = /^[A-Z0-9]{3}$/;
const get = id => document.getElementById(id);
const form = get("checker");
const deviceInput = get("device");
const regionInput = get("region");
const submit = get("check");
const status = get("status");
const release = get("release");
const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });
const shortDayFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
let activeRequest;

for (const { name, model } of devices) get("devices").append(new Option(model, name));
for (const { name, code } of regions) get("regions").append(new Option(name, code));

function lookupKey(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function deviceKey(value) {
  return lookupKey(value).replace(/^(?:samsung )?(?:galaxy )?/, "");
}

function resolveRegion(value) {
  const key = lookupKey(value);
  const country = regions.find(({ name }) => lookupKey(name) === key);
  if (country) return country.code;
  const code = value.trim().toUpperCase();
  return CSC.test(code) ? code : null;
}

function resolveModel(value, csc) {
  const model = value.trim().toUpperCase().replace(/\/DSN?$/, "");
  if (MODEL.test(model)) return model;

  const key = deviceKey(value);
  const device = devices.find(({ name }) => deviceKey(name) === key);
  if (!device) return null;

  const regionalModel = Object.entries(device.variants ?? {}).find(([, codes]) => codes.includes(csc));
  return regionalModel?.[0] ?? device.model;
}

function parseDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function formatDate(value) {
  const date = parseDay(value);
  return date ? dayFormat.format(date) : "Not listed";
}

function channelName(country, csc) {
  const name = typeof country === "string" ? country.replace(` (${csc})`, "").trim() : "";
  return name ? `${name} (${csc})` : csc;
}

function notesUrl(value, model) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.origin === "https://doc.samsungmobile.com" && !url.username && !url.password &&
        url.pathname.startsWith(`/${model}/`)) return url.href;
  } catch {
    // Release notes are optional if the response does not have a valid source link.
  }
  return null;
}

async function fetchRelease(model, csc, signal) {
  const response = await fetch(LOOKUP_URL, {
    ...PUBLIC_REQUEST,
    method: "POST",
    body: new URLSearchParams({ action: "samupdater_live_device_info", model, csc }),
    signal
  });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Unexpected response");

  const { success, data } = await response.json();
  if (response.status === 404 && success === false) return null;
  if (!response.ok || success !== true || data?.model !== model || data.csc !== csc ||
      typeof data.build !== "string" || !data.build.trim()) {
    throw new Error("Firmware release unavailable");
  }
  return data;
}

function say(message, announcementOnly = false) {
  status.classList.toggle("visually-hidden", announcementOnly);
  status.textContent = message;
}

function setBusy(busy) {
  submit.setAttribute("aria-disabled", String(busy));
  submit.textContent = busy ? "Checking" : "Check update";
}

function invalid(input, message) {
  say(message);
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function render(data) {
  const device = data.device || data.model;
  const region = regions.find(({ code }) => code === data.csc);
  const channel = channelName(region?.name, data.csc);
  get("release-device").textContent = device;
  get("release-region").textContent = `${data.model} · ${channel}`;
  get("release-build").textContent = data.build;
  get("release-date").textContent = formatDate(data.release_date);
  get("release-patch").textContent = formatDate(data.security_patch);
  const oneUi = typeof data.one_ui === "string" && data.one_ui.trim()
    ? `One UI ${data.one_ui.trim().replace(/^One UI\s+/i, "")}` : "";
  const android = typeof data.android === "string" && data.android.trim()
    ? `Android ${data.android.trim().replace(/^Android\s+/i, "")}` : "";
  get("release-software").textContent = [oneUi, android].filter(Boolean).join(" · ") || "Not listed";

  const notes = get("release-notes");
  const source = notesUrl(data.source_url, data.model);
  if (source) notes.href = source;
  else notes.removeAttribute("href");
  notes.hidden = !source;
  release.hidden = false;
  say(`Latest release for ${device}, ${channel}: build ${data.build}.`, true);
}

function latestFeedUrl() {
  const day = new Date();
  const sizes = {};
  // The site defaults to two entries per day. Ask for three on recent dates.
  for (let offset = 0; offset < 14; offset++) {
    sizes[day.toISOString().slice(0, 10)] = RELEASE_LIMIT;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  const url = new URL(SITE);
  url.search = new URLSearchParams({ sam_updater_api: "window", days: "5", sizes: JSON.stringify(sizes) });
  return url;
}

function isFeedRelease(item) {
  return item && typeof item.device === "string" && item.device.trim() &&
    typeof item.model === "string" && MODEL.test(item.model) &&
    typeof item.csc === "string" && CSC.test(item.csc) &&
    typeof item.build === "string" && item.build.trim() && parseDay(item.date);
}

function latestRow(item) {
  const row = get("latest-row").content.cloneNode(true);
  const date = row.querySelector("time");
  const releaseDay = parseDay(item.date);
  date.dateTime = item.date;
  date.textContent = shortDayFormat.format(releaseDay);
  date.setAttribute("aria-label", dayFormat.format(releaseDay));
  row.querySelector(".latest-device").textContent = item.device;
  row.querySelector(".latest-region").textContent = channelName(item.country, item.csc);
  row.querySelector(".latest-build").textContent = item.build;
  row.querySelector("a").href = `https://doc.samsungmobile.com/${item.model}/${item.csc}/doc.html`;
  return row;
}

async function loadLatest() {
  const message = get("latest-status");
  try {
    const response = await fetch(latestFeedUrl(), { ...PUBLIC_REQUEST, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Firmware feed unavailable");
    const { updates } = await response.json();
    if (!Array.isArray(updates)) throw new Error("Unexpected firmware feed");

    const releases = updates.filter(isFeedRelease)
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, RELEASE_LIMIT);
    if (!releases.length) {
      message.textContent = "No releases to show yet.";
      return;
    }

    const list = get("latest-list");
    list.replaceChildren(...releases.map(latestRow));
    list.hidden = false;
    message.hidden = true;
  } catch {
    message.textContent = "Couldn’t load recent releases.";
  }
}

form.addEventListener("input", event => {
  if (activeRequest) {
    activeRequest.abort();
    activeRequest = undefined;
    setBusy(false);
  }
  event.target.removeAttribute("aria-invalid");
  release.hidden = true;
  say("");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (activeRequest) return;
  release.hidden = true;

  const csc = resolveRegion(regionInput.value);
  const model = resolveModel(deviceInput.value, csc);
  if (!model) return invalid(deviceInput, "Choose a device name or enter its model number, such as SM-S928B.");
  if (!csc) return invalid(regionInput, "Choose a country or enter a 3-character CSC code, such as INS.");

  const request = new AbortController();
  activeRequest = request;
  setBusy(true);
  say("Checking the latest release.", true);
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
    const data = await fetchRelease(model, csc, signal);
    if (activeRequest !== request) return;
    if (data) render(data);
    else say(`Samsung has no listed release for ${model} and ${csc}. Check the model and CSC on your device.`);
  } catch (error) {
    if (activeRequest !== request) return;
    say(error.name === "TimeoutError"
      ? "The firmware check timed out. Try again."
      : "SamUpdater couldn't check for an update. Check your connection and try again.");
  } finally {
    if (activeRequest === request) {
      activeRequest = undefined;
      setBusy(false);
    }
  }
});

loadLatest();
