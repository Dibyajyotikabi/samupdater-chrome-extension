import { devices, regions } from "./catalogue.js";

const API = "https://samupdater.com/wp-admin/admin-ajax.php";
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

function formatDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Not listed";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "Not listed";
  return dayFormat.format(date);
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
  const response = await fetch(API, {
    method: "POST",
    body: new URLSearchParams({ action: "samupdater_live_device_info", model, csc }),
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
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
  const country = region?.name.replace(` (${data.csc})`, "");
  const channel = country ? `${country} (${data.csc})` : data.csc;
  get("release-device").textContent = device;
  get("release-region").textContent = `${data.model} · ${channel}`;
  get("release-build").textContent = data.build;
  get("release-date").textContent = formatDate(data.release_date);
  get("release-patch").textContent = formatDate(data.security_patch);
  get("release-one-ui").textContent = typeof data.one_ui === "string" && data.one_ui.trim()
    ? data.one_ui.replace(/^One UI\s+/i, "") : "Not listed";
  get("release-android").textContent = typeof data.android === "string" && data.android.trim()
    ? data.android.replace(/^Android\s+/i, "") : "Not listed";

  const notes = get("release-notes");
  const source = notesUrl(data.source_url, data.model);
  if (source) notes.href = source;
  else notes.removeAttribute("href");
  notes.hidden = !source;
  release.hidden = false;
  say(`Latest release for ${device}, ${channel}: build ${data.build}.`, true);
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
