const USERS_KEY = "secretaria_users";
const SESSION_KEY = "secretaria_session";
const TASKS_KEY = "secretaria_tasks";

const priorityOrder = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4
};

const priorityLabels = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja"
};

const statusLabels = {
  open: "Pendiente",
  progress: "En proceso",
  done: "Terminado"
};

const elements = {
  authView: document.querySelector("#authView"),
  dashboardView: document.querySelector("#dashboardView"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  authMessage: document.querySelector("#authMessage"),
  loginUser: document.querySelector("#loginUser"),
  loginPassword: document.querySelector("#loginPassword"),
  registerName: document.querySelector("#registerName"),
  registerUser: document.querySelector("#registerUser"),
  registerPassword: document.querySelector("#registerPassword"),
  logoutBtn: document.querySelector("#logoutBtn"),
  welcomeTitle: document.querySelector("#welcomeTitle"),
  taskForm: document.querySelector("#taskForm"),
  formTitle: document.querySelector("#formTitle"),
  taskId: document.querySelector("#taskId"),
  taskTitle: document.querySelector("#taskTitle"),
  taskClient: document.querySelector("#taskClient"),
  taskPriority: document.querySelector("#taskPriority"),
  taskDueDate: document.querySelector("#taskDueDate"),
  taskStatus: document.querySelector("#taskStatus"),
  taskNotes: document.querySelector("#taskNotes"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  statusFilter: document.querySelector("#statusFilter"),
  taskList: document.querySelector("#taskList"),
  emptyState: document.querySelector("#emptyState"),
  urgentCount: document.querySelector("#urgentCount"),
  highCount: document.querySelector("#highCount"),
  openCount: document.querySelector("#openCount"),
  doneCount: document.querySelector("#doneCount")
};

let currentUser = null;

function readStore(key, fallback) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUserName(userName) {
  return userName.trim().toLowerCase();
}

async function hashPassword(text) {
  if (window.crypto && crypto.subtle && window.TextEncoder) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(hashBuffer));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return `local-${Math.abs(hash)}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setAuthMode(mode) {
  const isLogin = mode === "login";
  elements.loginTab.classList.toggle("active", isLogin);
  elements.registerTab.classList.toggle("active", !isLogin);
  elements.loginForm.classList.toggle("hidden", !isLogin);
  elements.registerForm.classList.toggle("hidden", isLogin);
  elements.authMessage.textContent = "";
}

function showDashboard(user) {
  currentUser = user;
  elements.authView.classList.add("hidden");
  elements.dashboardView.classList.remove("hidden");
  elements.welcomeTitle.textContent = `Hola, ${user.name}`;
  renderTasks();
}

function showAuth() {
  currentUser = null;
  elements.dashboardView.classList.add("hidden");
  elements.authView.classList.remove("hidden");
  elements.loginForm.reset();
  elements.authMessage.textContent = "";
}

function getTasks() {
  return readStore(TASKS_KEY, []).filter((task) => task.userName === currentUser.userName);
}

function saveTasksForCurrentUser(userTasks) {
  const allTasks = readStore(TASKS_KEY, []);
  const otherUsersTasks = allTasks.filter((task) => task.userName !== currentUser.userName);
  writeStore(TASKS_KEY, [...otherUsersTasks, ...userTasks]);
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    const dateA = a.dueDate || "9999-12-31";
    const dateB = b.dueDate || "9999-12-31";
    return dateA.localeCompare(dateB);
  });
}

function formatDate(value) {
  if (!value) return "Sin fecha limite";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function updateSummary(tasks) {
  elements.urgentCount.textContent = tasks.filter((task) => task.priority === "urgent" && task.status !== "done").length;
  elements.highCount.textContent = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  elements.openCount.textContent = tasks.filter((task) => task.status !== "done").length;
  elements.doneCount.textContent = tasks.filter((task) => task.status === "done").length;
}

function taskTemplate(task) {
  return `
    <article class="task-item ${task.priority}">
      <div>
        <div class="task-title-row">
          <h3>${escapeHtml(task.title)}</h3>
          <span class="badge">${priorityLabels[task.priority]}</span>
          <span class="badge">${statusLabels[task.status]}</span>
        </div>
        <p class="meta">
          <span>${escapeHtml(task.client || "Sin solicitante")}</span>
          <span>${formatDate(task.dueDate)}</span>
        </p>
        ${task.notes ? `<p class="notes">${escapeHtml(task.notes)}</p>` : ""}
      </div>
      <div class="task-actions">
        <button class="icon-btn" type="button" title="Editar" data-action="edit" data-id="${task.id}">E</button>
        <button class="icon-btn" type="button" title="Marcar terminado" data-action="done" data-id="${task.id}">T</button>
        <button class="icon-btn" type="button" title="Eliminar" data-action="delete" data-id="${task.id}">X</button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTasks() {
  const tasks = getTasks();
  const filter = elements.statusFilter.value;
  const visibleTasks = sortTasks(
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter)
  );

  updateSummary(tasks);
  elements.taskList.innerHTML = visibleTasks.map(taskTemplate).join("");
  elements.emptyState.classList.toggle("hidden", visibleTasks.length > 0);
}

function resetTaskForm() {
  elements.taskForm.reset();
  elements.taskId.value = "";
  elements.taskPriority.value = "medium";
  elements.taskStatus.value = "open";
  elements.formTitle.textContent = "Agregar trabajo";
  elements.cancelEditBtn.classList.add("hidden");
}

function fillTaskForm(task) {
  elements.taskId.value = task.id;
  elements.taskTitle.value = task.title;
  elements.taskClient.value = task.client;
  elements.taskPriority.value = task.priority;
  elements.taskDueDate.value = task.dueDate;
  elements.taskStatus.value = task.status;
  elements.taskNotes.value = task.notes;
  elements.formTitle.textContent = "Editar trabajo";
  elements.cancelEditBtn.classList.remove("hidden");
  elements.taskTitle.focus();
}

async function registerUser(event) {
  event.preventDefault();

  const users = readStore(USERS_KEY, []);
  const userName = normalizeUserName(elements.registerUser.value);

  if (users.some((user) => user.userName === userName)) {
    elements.authMessage.textContent = "Ese usuario ya existe.";
    return;
  }

  const passwordHash = await hashPassword(elements.registerPassword.value);
  const user = {
    id: createId(),
    name: elements.registerName.value.trim(),
    userName,
    passwordHash
  };

  writeStore(USERS_KEY, [...users, user]);
  writeStore(SESSION_KEY, { userName });
  showDashboard(user);
}

async function loginUser(event) {
  event.preventDefault();

  const users = readStore(USERS_KEY, []);
  const userName = normalizeUserName(elements.loginUser.value);
  const passwordHash = await hashPassword(elements.loginPassword.value);
  const user = users.find((item) => item.userName === userName);

  if (!user || user.passwordHash !== passwordHash) {
    elements.authMessage.textContent = "Usuario o contrasena incorrectos.";
    return;
  }

  writeStore(SESSION_KEY, { userName });
  showDashboard(user);
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showAuth();
}

function saveTask(event) {
  event.preventDefault();

  const tasks = getTasks();
  const taskId = elements.taskId.value;
  const taskData = {
    id: taskId || createId(),
    userName: currentUser.userName,
    title: elements.taskTitle.value.trim(),
    client: elements.taskClient.value.trim(),
    priority: elements.taskPriority.value,
    dueDate: elements.taskDueDate.value,
    status: elements.taskStatus.value,
    notes: elements.taskNotes.value.trim(),
    updatedAt: new Date().toISOString()
  };

  const nextTasks = taskId
    ? tasks.map((task) => (task.id === taskId ? { ...task, ...taskData } : task))
    : [{ ...taskData, createdAt: new Date().toISOString() }, ...tasks];

  saveTasksForCurrentUser(nextTasks);
  resetTaskForm();
  renderTasks();
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const tasks = getTasks();
  const selectedTask = tasks.find((task) => task.id === id);
  if (!selectedTask) return;

  if (action === "edit") {
    fillTaskForm(selectedTask);
    return;
  }

  if (action === "done") {
    saveTasksForCurrentUser(
      tasks.map((task) => (task.id === id ? { ...task, status: "done" } : task))
    );
    renderTasks();
    return;
  }

  if (action === "delete" && confirm("Deseas eliminar este trabajo pendiente?")) {
    saveTasksForCurrentUser(tasks.filter((task) => task.id !== id));
    renderTasks();
  }
}

function restoreSession() {
  const session = readStore(SESSION_KEY, null);
  const users = readStore(USERS_KEY, []);
  const user = session ? users.find((item) => item.userName === session.userName) : null;

  if (user) {
    showDashboard(user);
  } else {
    showAuth();
  }
}

elements.loginTab.addEventListener("click", () => setAuthMode("login"));
elements.registerTab.addEventListener("click", () => setAuthMode("register"));
elements.registerForm.addEventListener("submit", registerUser);
elements.loginForm.addEventListener("submit", loginUser);
elements.logoutBtn.addEventListener("click", logout);
elements.taskForm.addEventListener("submit", saveTask);
elements.cancelEditBtn.addEventListener("click", resetTaskForm);
elements.statusFilter.addEventListener("change", renderTasks);
elements.taskList.addEventListener("click", handleTaskAction);

restoreSession();
