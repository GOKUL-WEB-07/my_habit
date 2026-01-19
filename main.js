/* ===========================
   My Habit - main.js
   OPTION 1 IMPLEMENTED (DATE-BASED COMPLETION)
   =========================== */

/* ------------ Helpers ------------ */
const UID = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayKey = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD
const lsKey = "myhabit_tasks_v2";

/* ------------ DOM ------------ */
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const fab = document.getElementById("fab");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const inputName = document.getElementById("inputName");
const inputNote = document.getElementById("inputNote");
const colorListEl = document.getElementById("colorList");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closeModalBtn = document.getElementById("closeModal");
const deleteBtn = document.getElementById("deleteBtn");
const confirm = document.getElementById("confirm");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const toastEl = document.getElementById("toast");

const tabAll = document.getElementById("tabAll");
const tabDone = document.getElementById("tabDone");
const dateChip = document.getElementById("dateChip");
const statTotal = document.getElementById("statTotal");
const statToday = document.getElementById("statToday");
const statPercent = document.getElementById("statPercent");

/* ------------ State ------------ */
let tasks = [];
let editingId = null;
let activeTab = "all";

/* ------------ Colors ------------ */
const COLORS = [
  "#7A8450", "#CFD522", "#2071BD",
  "#DD1E90", "#332AB1", "#5FB7FF", "#8AFFC1"
];

/* ------------ Storage ------------ */
function load(){
  const raw = localStorage.getItem(lsKey);
  tasks = raw ? JSON.parse(raw) : [];

  // backward safety
  tasks.forEach(t => {
    if (!t.completedDates) t.completedDates = {};
  });
}

function save(){
  localStorage.setItem(lsKey, JSON.stringify(tasks));
  render();
}

/* ------------ Date UI ------------ */
function uiDate(){
  const d = new Date();
  dateChip.textContent = d.toLocaleDateString(undefined, {
    weekday:'short', month:'short', day:'numeric'
  });
}

/* ------------ Color Picker ------------ */
function renderColorChoices(selected){
  colorListEl.innerHTML = "";
  COLORS.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "color-dot";
    btn.style.background = c;
    if(c === selected) btn.classList.add("selected");
    btn.onclick = () => {
      [...colorListEl.children].forEach(x=>x.classList.remove("selected"));
      btn.classList.add("selected");
    };
    colorListEl.appendChild(btn);
  });
}

function selectedColor(){
  const sel = colorListEl.querySelector(".color-dot.selected");
  return sel ? sel.style.background : COLORS[0];
}

/* ------------ Completion Helpers ------------ */
function isCompletedToday(task){
  return task.completedDates?.[todayKey()] === true;
}

/* ------------ Render ------------ */
function render(){
  listEl.innerHTML = "";

  const total = tasks.length;
  const doneToday = tasks.filter(isCompletedToday).length;

  statTotal.textContent = total;
  statToday.textContent = doneToday;
  statPercent.textContent = total === 0 ? "0%" : Math.round((doneToday/total)*100) + "%";

  let visible;
  if(activeTab === "all"){
    const active = tasks.filter(t => !isCompletedToday(t));
    const done = tasks.filter(isCompletedToday);
    visible = [...active, ...done];
  } else {
    visible = tasks.filter(isCompletedToday);
  }

  emptyEl.style.display = visible.length === 0 ? "block" : "none";

  visible.forEach(task => {
    const li = document.createElement("li");
    li.className = "item";
    li.style.setProperty("--c", task.color);

    if(isCompletedToday(task)) li.classList.add("done");

    li.innerHTML = `
      <div class="content">
        <h4>${escapeHtml(task.name)}</h4>
        <p>${escapeHtml(task.note || "—")}</p>
      </div>
      <div class="circle ${isCompletedToday(task) ? "done" : ""}">
        <span class="tick">✔</span>
      </div>
    `;

    li.onclick = e => {
      if(e.target.closest(".circle")) return;
      openEditModal(task.id);
    };

    li.querySelector(".circle").onclick = e => {
      e.stopPropagation();
      toggleComplete(task, li);
    };

    listEl.appendChild(li);
  });
}

/* ------------ Toggle Complete (OPTION 1 CORE) ------------ */
function toggleComplete(task, li){
  const today = todayKey();

  if(isCompletedToday(task)){
    delete task.completedDates[today];
    li.classList.remove("done");
    showToast(`Marked "${task.name}" incomplete`);
    save();
  } else {
    task.completedDates[today] = true;
    li.classList.add("done","fly-down");

    setTimeout(()=>{
      tasks = tasks.filter(t=>t.id!==task.id);
      tasks.push(task);
      save();
    },300);

    showToast(`Nice — "${task.name}" done today`);
  }
}

/* ------------ Modal ------------ */
function openCreateModal(){
  editingId = null;
  modalTitle.textContent = "Create Habit";
  inputName.value = "";
  inputNote.value = "";
  deleteBtn.classList.add("hidden");
  renderColorChoices(COLORS[0]);
  modal.style.display = "grid";
}

function openEditModal(id){
  const task = tasks.find(t=>t.id===id);
  if(!task) return;
  editingId = id;
  modalTitle.textContent = "Edit Habit";
  inputName.value = task.name;
  inputNote.value = task.note || "";
  deleteBtn.classList.remove("hidden");
  renderColorChoices(task.color);
  modal.style.display = "grid";
}

function closeModal(){
  modal.style.display = "none";
  editingId = null;
}

/* ------------ Save ------------ */
function saveFromModal(){
  const name = inputName.value.trim();
  if(!name){ showToast("Give your habit a name"); return; }

  const note = inputNote.value.trim();
  const color = selectedColor();

  if(editingId){
    const t = tasks.find(x=>x.id===editingId);
    t.name = name;
    t.note = note;
    t.color = color;
    showToast("Habit updated");
  } else {
    tasks.unshift({
      id: UID(),
      name, note, color,
      createdAt: new Date().toISOString(),
      completedDates: {}
    });
    showToast("Habit added");
  }
  save();
  closeModal();
}

/* ------------ Delete ------------ */
let pendingDeleteId = null;
function askDelete(){
  pendingDeleteId = editingId;
  confirm.classList.remove("hidden");
}
function cancelDelete(){
  confirm.classList.add("hidden");
  pendingDeleteId = null;
}
function confirmDelete(){
  tasks = tasks.filter(t=>t.id!==pendingDeleteId);
  showToast("Habit deleted");
  save();
  cancelDelete();
  closeModal();
}

/* ------------ Tabs ------------ */
function setTab(tab){
  activeTab = tab;
  tabAll.classList.toggle("active", tab==="all");
  tabDone.classList.toggle("active", tab==="done");
  render();
}

/* ------------ Toast ------------ */
let toastTimer=null;
function showToast(msg,ms=1800){
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toastEl.classList.add("hidden"),ms);
}

/* ------------ Utils ------------ */
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

/* ------------ Events ------------ */
fab.onclick = openCreateModal;
closeModalBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
saveBtn.onclick = saveFromModal;
deleteBtn.onclick = askDelete;
confirmYes.onclick = confirmDelete;
confirmNo.onclick = cancelDelete;
tabAll.onclick = ()=>setTab("all");
tabDone.onclick = ()=>setTab("done");

/* ------------ Start ------------ */
function bootstrap(){
  load();
  uiDate();
  renderColorChoices(COLORS[0]);
  setTab("all");
}
bootstrap();
