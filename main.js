/* ======================================================
   MY HABIT 2.0 – main.js
   Core Logic + Calendar + History + Reset
====================================================== */

/* =====================
   HELPERS
===================== */
function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // LOCAL YYYY-MM-DD
}

getTodayKey();

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const todayKey = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "my_habit_v2";

/* =====================
   STATE
===================== */

let habits = [];
let activeTab = "all";
let editingId = null;
let selectedColor = null;

/* =====================
   DOM
===================== */

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");

const fab = document.getElementById("fab");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const inputName = document.getElementById("inputName");
const inputNote = document.getElementById("inputNote");
const colorList = document.getElementById("colorList");

const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closeModalBtn = document.getElementById("closeModal");
const deleteBtn = document.getElementById("deleteBtn");

const tabAll = document.getElementById("tabAll");
const tabDone = document.getElementById("tabDone");

const statTotal = document.getElementById("statTotal");
const statToday = document.getElementById("statToday");
const statPercent = document.getElementById("statPercent");
const dateChip = document.getElementById("dateChip");

const toast = document.getElementById("toast");

const closeCalendarBtn = document.getElementById("closeCalendarBtn");
const calendarView = document.getElementById("calendarView");


const homeScreen = document.getElementById("homeScreen");
const progressScreen = document.getElementById("progressScreen");
const backToHomeBtn = document.getElementById("backToHome");

function closeProgressScreen() {
  progressScreen.classList.remove("active");
  homeScreen.classList.add("active");
}

if (closeCalendarBtn) {
  closeCalendarBtn.addEventListener("click", closeProgressScreen);
}

if (backToHomeBtn) {
  backToHomeBtn.addEventListener("click", closeProgressScreen);
}


function closeCalendar() {
  if (!calendarView) return;
  calendarView.classList.add("hidden");
}

if (closeCalendarBtn) {
  closeCalendarBtn.addEventListener("click", closeCalendar);
}


/* =====================
   COLORS
===================== */

const COLORS = [
  "#7A8450",
  "#CFD522",
  "#2071BD",
  "#DD1E90",
  "#332AB1",
  "#5FB7FF",
  "#8AFFC1"
];

/* =====================
   STORAGE
===================== */

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  habits = raw ? JSON.parse(raw) : [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  render();
}

/* =====================
   DATE + RESET
===================== */

function updateDate() {
  const d = new Date();
  dateChip.textContent = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function dailyResetIfNeeded() {
  const today = todayKey();

  habits.forEach(h => {
    if (!h.history) h.history = {};
    if (!(today in h.history)) {
      h.history[today] = false;
    }
  });

  save();
}

/* =====================
   COLOR PICKER
===================== */

function renderColors(selected) {
  colorList.innerHTML = "";
  COLORS.forEach(c => {
    const dot = document.createElement("div");
    dot.className = "color-dot";
    dot.style.background = c;
    if (c === selected) dot.classList.add("selected");
    dot.onclick = () => {
      selectedColor = c;
      renderColors(c);
    };
    colorList.appendChild(dot);
  });
}

/* =====================
   MODAL
===================== */

function openCreateModal() {
  editingId = null;
  modalTitle.textContent = "Create Habit";
  inputName.value = "";
  inputNote.value = "";
  selectedColor = COLORS[0];
  deleteBtn.classList.add("hidden");
  renderColors(selectedColor);
  modal.setAttribute("aria-hidden", "false");
}

function openEditModal(id) {
  const h = habits.find(x => x.id === id);
  if (!h) return;

  editingId = id;
  modalTitle.textContent = "Edit Habit";

  inputName.value = h.name;
  inputNote.value = h.note || "";
  selectedColor = h.color;

  deleteBtn.classList.remove("hidden");

  // ✅ Progress button logic
  const progressBtn = document.getElementById("viewProgressBtn");
  progressBtn.classList.remove("hidden");

  progressBtn.onclick = () => {
    closeModal();
    openHabitCalendar(h); // 🔥 this must receive habit OBJECT
  };

  renderColors(selectedColor);
  modal.setAttribute("aria-hidden", "false");
}

function openCreateModal() {
  editingId = null;

  modalTitle.textContent = "Create Habit";
  inputName.value = "";
  inputNote.value = "";

  selectedColor = COLORS[0];
  deleteBtn.classList.add("hidden");

  const progressBtn = document.getElementById("viewProgressBtn");
  progressBtn.classList.add("hidden"); // ✅ hide here

  renderColors(selectedColor);
  modal.setAttribute("aria-hidden", "false");
}



// Example button (you already planned "Progress")



function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  editingId = null;
}

/* =====================
   SAVE / DELETE
===================== */

function saveHabit() {
  const name = inputName.value.trim();
  if (!name) return showToast("Habit name required");

  if (editingId) {
    const h = habits.find(x => x.id === editingId);
    h.name = name;
    h.note = inputNote.value;
    h.color = selectedColor;
    showToast("Habit updated");
  } else {
    habits.unshift({
      id: uid(),
      name,
      note: inputNote.value,
      color: selectedColor,
      createdAt: todayKey(),
      history: { [todayKey()]: false }
    });
    showToast("Habit created");
  }

  save();
  closeModal();
}

function deleteHabit() {
  if (!editingId) return;
  habits = habits.filter(h => h.id !== editingId);
  save();
  closeModal();
  showToast("Habit deleted");
}

/* =====================
   COMPLETE TOGGLE
===================== */

function toggleComplete(habit) {
  const today = todayKey();
  habit.history[today] = !habit.history[today];
  save();
}

/* =====================
   STREAK
===================== */

function calculateStreak(history) {
  let streak = 0;
  let d = new Date();

  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (history[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/* =====================
   RENDER
===================== */

function render() {
  listEl.innerHTML = "";

  const today = todayKey();
  let doneToday = 0;

  let visible = habits.filter(h =>
    activeTab === "done" ? h.history[today] : true
  );

  if (!visible.length) {
    emptyEl.style.display = "block";
  } else {
    emptyEl.style.display = "none";
  }

  visible.forEach(h => {
    const li = document.createElement("li");
    li.className = "item";
    li.style.setProperty("--c", h.color);

    if (h.history[today]) li.classList.add("done");

    li.innerHTML = `
      <div class="content">
        <h4>${h.name}</h4>
        <p>${h.note || "—"}</p>
      </div>
      <div class="circle ${h.history[today] ? "done" : ""}">
        <span class="tick">✔</span>
      </div>
    `;

    li.onclick = () => openEditModal(h.id);

    li.querySelector(".circle").onclick = e => {
      e.stopPropagation();
      toggleComplete(h);
    };

    listEl.appendChild(li);

    if (h.history[today]) doneToday++;
  });

  statTotal.textContent = habits.length;
  statToday.textContent = doneToday;
  statPercent.textContent =
    habits.length === 0
      ? "0%"
      : Math.round((doneToday / habits.length) * 100) + "%";
}

/* =====================
   TOAST
===================== */

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 1600);
}

/* =====================
   EVENTS
===================== */

fab.onclick = openCreateModal;
saveBtn.onclick = saveHabit;
cancelBtn.onclick = closeModal;
closeModalBtn.onclick = closeModal;
deleteBtn.onclick = deleteHabit;

tabAll.onclick = () => {
  activeTab = "all";
  tabAll.classList.add("active");
  tabDone.classList.remove("active");
  render();
};

tabDone.onclick = () => {
  activeTab = "done";
  tabDone.classList.add("active");
  tabAll.classList.remove("active");
  render();
};

document.addEventListener("DOMContentLoaded", () => {
  const closeCalendarBtn = document.getElementById("closeCalendarBtn");
  const calendarView = document.getElementById("calendarView");

  if (!closeCalendarBtn) {
    console.error("❌ closeCalendarBtn not found");
    return;
  }

  if (!calendarView) {
    console.error("❌ calendarView not found");
    return;
  }

  closeCalendarBtn.addEventListener("click", () => {
    calendarView.style.display = "none";
  });
});



/* =====================
   BOOT
===================== */

function init() {
  load();
  updateDate();
  dailyResetIfNeeded();
  renderColors(COLORS[0]);
  render();
}

init();
