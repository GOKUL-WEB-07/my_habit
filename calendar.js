/* ======================================================
   My Habit – calendar.js
   Per-habit progress calendar + streak logic
   + Working Close Button
====================================================== */

/* ==========================
   STATE
========================== */

let calendarHabit = null;
let calendarMonth = new Date();

let calendarOverlay = null;
let calendarGrid = null;
let calendarTitle = null;
let streakLabel = null;

/* ==========================
   LOCAL DATE KEY (NO UTC BUG)
========================== */

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/* ==========================
   OPEN CALENDAR
========================== */

function openHabitCalendar(habit) {
  calendarHabit = habit;
  calendarMonth = new Date();

  if (!calendarOverlay) buildCalendarUI();
  renderCalendar();

  calendarOverlay.style.display = "flex"; // 🔥 force show
}z


/* ==========================
   BUILD CALENDAR UI (ONCE)
========================== */

function buildCalendarUI() {
  calendarOverlay = document.createElement("div");
  calendarOverlay.className = "calendar-overlay";


  calendarOverlay.innerHTML = `
    <div class="calendar-card">
      <header class="calendar-header">
        <button id="calPrev">‹</button>
        <h3 id="calTitle"></h3>
        <button id="calNext">›</button>
      </header>

      <div class="calendar-streak">
        <span id="streakText">🔥 0 day streak</span>
      </div>

      <div class="calendar-grid" id="calendarGrid"></div>

      <button id="calendarCloseBtn" class="calendar-close">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(calendarOverlay);
  calendarOverlay.style.display = "none"; // 🔥 start hidden



  calendarGrid = calendarOverlay.querySelector("#calendarGrid");
  calendarTitle = calendarOverlay.querySelector("#calTitle");
  streakLabel = calendarOverlay.querySelector("#streakText");

  /* BUTTON EVENTS */
  calendarOverlay.querySelector("#calendarCloseBtn").addEventListener("click", closeCalendar);
  calendarOverlay.querySelector("#calPrev").addEventListener("click", () => changeMonth(-1));
  calendarOverlay.querySelector("#calNext").addEventListener("click", () => changeMonth(1));

  /* CLICK OUTSIDE CARD TO CLOSE */
  calendarOverlay.addEventListener("click", (e) => {
    if (e.target === calendarOverlay) closeCalendar();
  });
}

/* ==========================
   RENDER CALENDAR
========================== */

function renderCalendar() {
  if (!calendarGrid || !calendarHabit) return;

  calendarGrid.innerHTML = "";

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  calendarTitle.textContent = calendarMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  /* EMPTY CELLS */
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  /* DAY CELLS */
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = getLocalDateKey(new Date(year, month, d));

    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = d;

    if (calendarHabit.history?.[dateKey]) {
      cell.classList.add("done");
    }

    calendarGrid.appendChild(cell);
  }

  updateStreak();
}

/* ==========================
   STREAK LOGIC
========================== */

function updateStreak() {
  if (!calendarHabit || !streakLabel) return;

  let streak = 0;
  let d = new Date();

  while (true) {
    const key = getLocalDateKey(d);
    if (calendarHabit.history?.[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  streakLabel.textContent = `🔥 ${streak} day streak`;
}

/* ==========================
   MONTH NAVIGATION
========================== */

function changeMonth(step) {
  calendarMonth.setMonth(calendarMonth.getMonth() + step);
  renderCalendar();
}

/* ==========================
   CLOSE CALENDAR
========================== */

function closeCalendar() {
  if (!calendarOverlay) return;
  calendarOverlay.style.display = "none"; // 🔥 force hide
}


/* ==========================
   EXPORT
========================== */

window.openHabitCalendar = openHabitCalendar;


/* ======================================================
   My Habit – main.js
   Main application logic
====================================================== */