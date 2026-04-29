const payload = window.BABY_TRACKER_PAYLOAD || {
  appName: "Little Rhythm",
  timezone: "America/New_York",
  child: { name: "Baby", ageLabel: "8 months old" },
  caregivers: [],
  quickActions: [],
  timeline: [],
  upcoming: [],
  insightSeeds: [],
  noteSeeds: [],
};

const STORAGE_KEY = "little-rhythm-demo-state";
const LOGGING_OPTIONS = {
  feed: {
    kicker: "Feed",
    title: "What did Maeve have?",
    note: "Choose one to log it right away.",
    options: [
      { label: "Bottle", detail: "5 oz formula", entryTitle: "Bottle", entryDetail: "5 oz formula", entryType: "feed" },
      { label: "Bottle", detail: "6 oz formula", entryTitle: "Bottle", entryDetail: "6 oz formula", entryType: "feed" },
      { label: "Breast", detail: "Both sides · 14 min", entryTitle: "Breastfeed", entryDetail: "Both sides · 14 min", entryType: "feed" },
      { label: "Solids", detail: "Banana + yogurt", entryTitle: "Solid meal", entryDetail: "Banana + yogurt", entryType: "feed" },
    ],
  },
  diaper: {
    kicker: "Diaper",
    title: "What kind of change was it?",
    note: "Keep the log quick and specific.",
    options: [
      { label: "Wet", detail: "Wet diaper", entryTitle: "Diaper change", entryDetail: "Wet", entryType: "diaper" },
      { label: "Dirty", detail: "Dirty diaper", entryTitle: "Diaper change", entryDetail: "Dirty", entryType: "diaper" },
      { label: "Wet + Dirty", detail: "Both", entryTitle: "Diaper change", entryDetail: "Wet + dirty", entryType: "diaper" },
      { label: "Dry check", detail: "Checked and dry", entryTitle: "Diaper check", entryDetail: "Dry", entryType: "diaper" },
    ],
  },
  medication: {
    kicker: "Medication",
    title: "What did you give?",
    note: "Useful for teething days and daily vitamins.",
    options: [
      { label: "Vitamin D", detail: "Daily drop", entryTitle: "Medication", entryDetail: "Vitamin D drop", entryType: "medication" },
      { label: "Tylenol", detail: "2.5 mL", entryTitle: "Medication", entryDetail: "Tylenol · 2.5 mL", entryType: "medication" },
      { label: "Ibuprofen", detail: "1.875 mL", entryTitle: "Medication", entryDetail: "Ibuprofen · 1.875 mL", entryType: "medication" },
      { label: "Gas drops", detail: "0.3 mL", entryTitle: "Medication", entryDetail: "Gas drops · 0.3 mL", entryType: "medication" },
    ],
  },
};
const NOTE_VARIANTS = payload.noteSeeds.length
  ? payload.noteSeeds
  : ["A calm stretch after the last feed.", "Maybe ready to size up bedtime routine soon."];

const state = loadState();

const appTitle = document.getElementById("app-title");
const currentTime = document.getElementById("current-time");
const childName = document.getElementById("child-name");
const childAge = document.getElementById("child-age");
const awakeState = document.getElementById("awake-state");
const heroSummary = document.getElementById("hero-summary");
const lastEvent = document.getElementById("last-event");
const nextEvent = document.getElementById("next-event");
const focusGrid = document.getElementById("focus-grid");
const caregiverRow = document.getElementById("caregiver-row");
const actionGrid = document.getElementById("action-grid");
const statsGrid = document.getElementById("stats-grid");
const timelineCaption = document.getElementById("timeline-caption");
const timelineList = document.getElementById("timeline-list");
const insightsList = document.getElementById("insights-list");
const routineList = document.getElementById("routine-list");
const notesList = document.getElementById("notes-list");
const choiceSheet = document.getElementById("choice-sheet");
const sheetKicker = document.getElementById("sheet-kicker");
const sheetTitle = document.getElementById("sheet-title");
const sheetNote = document.getElementById("sheet-note");
const choiceList = document.getElementById("choice-list");
const sheetClose = document.getElementById("sheet-close");

const actionTemplate = document.getElementById("action-template");
const statTemplate = document.getElementById("stat-template");
const focusTemplate = document.getElementById("focus-template");
const timelineTemplate = document.getElementById("timeline-template");
const stackItemTemplate = document.getElementById("stack-item-template");

appTitle.textContent = payload.appName;
childName.textContent = payload.child.name;
childAge.textContent = payload.child.ageLabel;
sheetClose.addEventListener("click", closeChoiceSheet);
choiceSheet.addEventListener("click", (event) => {
  if (event.target === choiceSheet) {
    closeChoiceSheet();
  }
});

renderActions();
renderCaregivers();
updateClock();
renderApp();
window.setInterval(updateClock, 30000);

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      timeline: [...payload.timeline],
      noteCursor: 0,
      activeSleepStart: payload.timeline.find((entry) => entry.type === "sleep" && entry.active)?.time || null,
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [...payload.timeline],
      noteCursor: Number.isInteger(parsed.noteCursor) ? parsed.noteCursor : 0,
      activeSleepStart: parsed.activeSleepStart || null,
    };
  } catch (error) {
    return {
      timeline: [...payload.timeline],
      noteCursor: 0,
      activeSleepStart: payload.timeline.find((entry) => entry.type === "sleep" && entry.active)?.time || null,
    };
  }
}

function saveState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      timeline: state.timeline,
      noteCursor: state.noteCursor,
      activeSleepStart: state.activeSleepStart,
    }),
  );
}

function renderActions() {
  actionGrid.innerHTML = "";

  payload.quickActions.forEach((action) => {
    const button = actionTemplate.content.firstElementChild.cloneNode(true);
    const actionCopy = getActionCopy(action);
    button.dataset.action = action.id;
    button.querySelector(".action-icon").textContent = action.icon;
    button.querySelector(".action-title").textContent = actionCopy.title;
    button.querySelector(".action-detail").textContent = actionCopy.detail;
    button.addEventListener("click", () => handleQuickAction(action.id));
    actionGrid.appendChild(button);
  });
}

function renderCaregivers() {
  caregiverRow.innerHTML = "";

  payload.caregivers.forEach((caregiver) => {
    const chip = document.createElement("article");
    chip.className = "caregiver-chip";
    chip.innerHTML = `
      <strong>${caregiver.name}</strong>
      <span>${caregiver.role}</span>
    `;

    if (caregiver.active) {
      chip.classList.add("is-active");
    }

    caregiverRow.appendChild(chip);
  });
}

function handleQuickAction(actionId) {
  if (actionId === "sleep") {
    toggleSleepSession();
    return;
  }

  if (actionId === "feed") {
    openChoiceSheet("feed");
    return;
  }

  if (actionId === "diaper") {
    openChoiceSheet("diaper");
    return;
  }

  if (actionId === "medication") {
    openChoiceSheet("medication");
    return;
  }

  if (actionId === "note") {
    const time = new Date().toISOString();
    const caregiver = getActiveCaregiver();
    const detail = NOTE_VARIANTS[state.noteCursor % NOTE_VARIANTS.length];
    state.noteCursor += 1;
    prependEntry({
      id: createId("note"),
      type: "note",
      title: "Quick note",
      detail,
      time,
      caregiver,
    });
  }
}

function toggleSleepSession() {
  const caregiver = getActiveCaregiver();

  if (state.activeSleepStart) {
    const start = new Date(state.activeSleepStart);
    const end = new Date();
    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    state.timeline = state.timeline.map((entry) =>
      entry.time === state.activeSleepStart && entry.type === "sleep" && entry.active
        ? {
            ...entry,
            active: false,
            title: inferSleepTitle(start),
            detail: formatDuration(durationMinutes),
            durationMinutes,
            endedAt: end.toISOString(),
          }
        : entry,
    );

    state.activeSleepStart = null;
    saveState();
    renderApp();
    return;
  }

  const startedAt = new Date().toISOString();
  state.activeSleepStart = startedAt;
  prependEntry({
    id: createId("sleep"),
    type: "sleep",
    title: inferSleepTitle(new Date(startedAt)) + " started",
    detail: "Settled down",
    time: startedAt,
    caregiver,
    active: true,
  });
}

function prependEntry(entry) {
  state.timeline = [entry, ...state.timeline].sort((left, right) => new Date(right.time) - new Date(left.time));
  saveState();
  renderApp();
}

function renderApp() {
  const sortedTimeline = [...state.timeline].sort((left, right) => new Date(right.time) - new Date(left.time));
  const latest = sortedTimeline[0];
  const metrics = buildMetrics(sortedTimeline);
  const currentlySleeping = Boolean(state.activeSleepStart);
  const nextRhythm = currentlySleeping ? "Wake gently when ready" : metrics.nextSleepText;

  awakeState.textContent = currentlySleeping ? "Sleeping" : "Awake";
  awakeState.classList.toggle("is-sleeping", currentlySleeping);
  heroSummary.textContent = currentlySleeping
    ? `Down for ${formatRelativeDuration(state.activeSleepStart)} and tracking live.`
    : `${metrics.currentWakeWindow} awake so far. ${metrics.nextFeedText} next feels about right.`;
  lastEvent.textContent = latest ? `${latest.title} at ${formatDisplayTime(latest.time)}` : "No entries yet";
  nextEvent.textContent = nextRhythm;
  timelineCaption.textContent = currentlySleeping
    ? "Shared live sleep session is running."
    : `Most recent update from ${latest?.caregiver || getActiveCaregiver()}.`;

  renderActions();
  renderFocus(metrics);
  renderStats(metrics);
  renderTimeline(sortedTimeline);
  renderInsights(metrics, currentlySleeping);
  renderRoutine();
  renderNotes(sortedTimeline);
}

function openChoiceSheet(actionId) {
  const config = LOGGING_OPTIONS[actionId];
  if (!config) {
    return;
  }

  sheetKicker.textContent = config.kicker;
  sheetTitle.textContent = config.title;
  sheetNote.textContent = config.note;
  choiceList.innerHTML = "";

  config.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-item";
    button.innerHTML = `
      <strong>${option.label}</strong>
      <span>${option.detail}</span>
    `;
    button.addEventListener("click", () => {
      logChoice(option);
      closeChoiceSheet();
    });
    choiceList.appendChild(button);
  });

  choiceSheet.classList.remove("is-hidden");
  choiceSheet.setAttribute("aria-hidden", "false");
}

function closeChoiceSheet() {
  choiceSheet.classList.add("is-hidden");
  choiceSheet.setAttribute("aria-hidden", "true");
}

function logChoice(option) {
  const time = new Date().toISOString();
  const caregiver = getActiveCaregiver();

  prependEntry({
    id: createId(option.entryType),
    type: option.entryType,
    title: option.entryTitle,
    detail: option.entryDetail,
    time,
    caregiver,
  });
}

function renderStats(metrics) {
  statsGrid.innerHTML = "";

  const cards = [
    { label: "Day sleep", value: metrics.totalSleep, detail: `${metrics.napCount} naps tracked today` },
    { label: "Feeds today", value: String(metrics.feedCount), detail: metrics.lastFeedText },
    { label: "Diapers today", value: String(metrics.diaperCount), detail: metrics.lastDiaperText },
    { label: "Longest wake window", value: metrics.longestWakeWindow, detail: "Across completed naps today" },
  ];

  cards.forEach((card) => {
    const node = statTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".stat-label").textContent = card.label;
    node.querySelector(".stat-value").textContent = card.value;
    node.querySelector(".stat-detail").textContent = card.detail;
    statsGrid.appendChild(node);
  });
}

function renderFocus(metrics) {
  focusGrid.innerHTML = "";

  const cards = [
    {
      label: "Wake window",
      value: metrics.currentWakeWindow,
      detail: state.activeSleepStart ? "Paused while nap is running" : "Since the last completed nap",
    },
    {
      label: "Next feed",
      value: metrics.nextFeedText,
      detail: metrics.lastFeedText,
    },
    {
      label: "Next nap",
      value: metrics.nextSleepText,
      detail: state.activeSleepStart ? "Sleep timer is already running" : "Based on today's rhythm",
    },
  ];

  cards.forEach((card) => {
    const node = focusTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".focus-label").textContent = card.label;
    node.querySelector(".focus-value").textContent = card.value;
    node.querySelector(".focus-detail").textContent = card.detail;
    focusGrid.appendChild(node);
  });
}

function renderTimeline(entries) {
  timelineList.innerHTML = "";

  if (!entries.length) {
    timelineList.innerHTML = "<p class='empty-state'>No entries yet for today.</p>";
    return;
  }

  entries.slice(0, 8).forEach((entry) => {
    const node = timelineTemplate.content.firstElementChild.cloneNode(true);
    const tag = node.querySelector(".timeline-tag");
    node.querySelector(".timeline-time").textContent = `${formatDisplayTime(entry.time)} • ${entry.caregiver || "Caregiver"}`;
    node.querySelector(".timeline-title").textContent = `${entry.title} · ${entry.detail}`;
    tag.textContent = entry.active ? "Live" : capitalize(entry.type);
    tag.className = `timeline-tag type-${entry.type}${entry.active ? " is-live" : ""}`;
    node.classList.add(`type-${entry.type}`);
    timelineList.appendChild(node);
  });
}

function renderInsights(metrics, currentlySleeping) {
  insightsList.innerHTML = "";

  const items = [
    currentlySleeping
      ? `Current nap has been running ${formatRelativeDuration(state.activeSleepStart)}.`
      : `Current awake stretch is about ${metrics.currentWakeWindow}.`,
    payload.insightSeeds[0] || "The morning routine looks steadier than the afternoon.",
    payload.insightSeeds[1] || "Diaper rhythm looks healthy today.",
  ];

  items.forEach((detail, index) => {
    const node = stackItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".stack-title").textContent = index === 0 ? "Live snapshot" : `Pattern ${index}`;
    node.querySelector(".stack-detail").textContent = detail;
    insightsList.appendChild(node);
  });
}

function renderRoutine() {
  routineList.innerHTML = "";

  payload.upcoming.forEach((detail, index) => {
    const node = stackItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".stack-title").textContent = index === 0 ? "Coming up soon" : `Later today`;
    node.querySelector(".stack-detail").textContent = detail;
    routineList.appendChild(node);
  });
}

function renderNotes(entries) {
  notesList.innerHTML = "";

  const notes = entries.filter((entry) => entry.type === "note").slice(0, 3);

  if (!notes.length) {
    const node = stackItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".stack-title").textContent = "No notes yet";
    node.querySelector(".stack-detail").textContent = "Tap Note to capture mood, symptoms, or milestones.";
    notesList.appendChild(node);
    return;
  }

  notes.forEach((entry) => {
    const node = stackItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".stack-title").textContent = `${formatDisplayTime(entry.time)} • ${entry.caregiver || "Caregiver"}`;
    node.querySelector(".stack-detail").textContent = entry.detail;
    notesList.appendChild(node);
  });
}

function buildMetrics(entries) {
  const todayEntries = entries.filter(isSameTrackerDay);
  const sleepEntries = todayEntries.filter((entry) => entry.type === "sleep" && Number.isFinite(entry.durationMinutes));
  const feedEntries = todayEntries.filter((entry) => entry.type === "feed");
  const diaperEntries = todayEntries.filter((entry) => entry.type === "diaper");
  const medicationEntries = todayEntries.filter((entry) => entry.type === "medication");
  const lastFeed = feedEntries[0];
  const lastDiaper = diaperEntries[0];
  const totalSleepMinutes = sleepEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const nextFeedMinutes = lastFeed ? minutesSince(lastFeed.time) : null;
  const wakeWindowMinutes = computeCurrentWakeWindowMinutes(entries);

  return {
    totalSleep: totalSleepMinutes ? formatDuration(totalSleepMinutes) : "0m",
    napCount: sleepEntries.length + (state.activeSleepStart ? 1 : 0),
    feedCount: feedEntries.length,
    diaperCount: diaperEntries.length,
    medicationCount: medicationEntries.length,
    lastFeedText: lastFeed ? `Last at ${formatDisplayTime(lastFeed.time)}` : "No feeds logged",
    lastDiaperText: lastDiaper ? `Last at ${formatDisplayTime(lastDiaper.time)}` : "No diapers logged",
    currentWakeWindow: wakeWindowMinutes === null ? "Not enough data" : formatDuration(wakeWindowMinutes),
    longestWakeWindow: computeLongestWakeWindow(entries),
    nextFeedText: buildNextFeedText(nextFeedMinutes),
    nextSleepText: buildNextSleepText(wakeWindowMinutes),
  };
}

function computeCurrentWakeWindowMinutes(entries) {
  if (state.activeSleepStart) {
    return 0;
  }

  const lastSleep = entries.find((entry) => entry.type === "sleep" && entry.endedAt);
  if (!lastSleep) {
    return null;
  }

  return Math.max(1, Math.round((Date.now() - new Date(lastSleep.endedAt).getTime()) / 60000));
}

function computeLongestWakeWindow(entries) {
  const sleepEntries = entries
    .filter((entry) => entry.type === "sleep" && entry.endedAt && !entry.active)
    .sort((left, right) => new Date(left.time) - new Date(right.time));

  if (sleepEntries.length < 2) {
    return "2h 14m";
  }

  let longest = 0;
  for (let index = 1; index < sleepEntries.length; index += 1) {
    const previous = new Date(sleepEntries[index - 1].endedAt).getTime();
    const current = new Date(sleepEntries[index].time).getTime();
    longest = Math.max(longest, Math.round((current - previous) / 60000));
  }

  return longest ? formatDuration(longest) : "0m";
}

function updateClock() {
  currentTime.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: payload.timezone || "America/New_York",
  }).format(new Date());
}

function getActionCopy(action) {
  if (action.id === "sleep" && state.activeSleepStart) {
    return {
      title: "End nap",
      detail: `Running ${formatRelativeDuration(state.activeSleepStart)}`,
    };
  }

  return {
    title: action.title,
    detail:
      action.id === "medication" && buildMetrics([...state.timeline]).medicationCount
        ? `${buildMetrics([...state.timeline]).medicationCount} logged today`
        : action.detail,
  };
}

function isSameTrackerDay(entry) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: payload.timezone || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date(entry.time)) === formatter.format(new Date());
}

function getActiveCaregiver() {
  return payload.caregivers.find((caregiver) => caregiver.active)?.name || "Caregiver";
}

function inferSleepTitle(date) {
  return date.getHours() < 12 ? "Morning nap" : "Afternoon nap";
}

function formatDisplayTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: payload.timezone || "America/New_York",
  }).format(new Date(value));
}

function formatRelativeTime(value) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return `${minutes}m ago`;
}

function formatRelativeDuration(value) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return formatDuration(minutes);
}

function formatDuration(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function minutesSince(value) {
  return Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
}

function buildNextFeedText(minutes) {
  if (minutes === null) {
    return "Follow hunger cues";
  }

  if (minutes < 120) {
    return "Not soon";
  }

  if (minutes < 180) {
    return "Within the hour";
  }

  return "Due now";
}

function buildNextSleepText(wakeWindowMinutes) {
  if (state.activeSleepStart) {
    return "Nap in progress";
  }

  if (wakeWindowMinutes === null) {
    return "Watch sleepy cues";
  }

  if (wakeWindowMinutes < 90) {
    return "Probably later";
  }

  if (wakeWindowMinutes < 150) {
    return "Within the hour";
  }

  return "Due soon";
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
