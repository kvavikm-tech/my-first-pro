const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.TASK_DATA_FILE || path.resolve(__dirname, '..', 'tasks.json');

function readTasks() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) {
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.warn('Warning: tasks.json is corrupted or not an array. Resetting to empty list.');
      return [];
    }
    return data;
  } catch (err) {
    console.warn(`Warning: Failed to read tasks (${err.message}). Resetting to empty list.`);
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function getNextId(tasks) {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}

function addTask(text) {
  if (!text || !text.trim()) {
    throw new Error('Task text is required');
  }
  const tasks = readTasks();
  const task = {
    id: getNextId(tasks),
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

function listTasks() {
  return readTasks();
}

function completeTask(id) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }

  if (tasks[idx].done) {
    return { task: tasks[idx], wasCompleted: false };
  }

  tasks[idx].done = true;
  tasks[idx].completedAt = new Date().toISOString();
  writeTasks(tasks);
  return { task: tasks[idx], wasCompleted: true };
}

function deleteTask(id) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }

  const deletedTask = tasks.splice(idx, 1)[0];
  writeTasks(tasks);
  return deletedTask;
}

function editTask(id, newText) {
  if (!newText || !newText.trim()) {
    throw new Error('Task text is required');
  }
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }

  tasks[idx].text = newText.trim();
  tasks[idx].updatedAt = new Date().toISOString();
  writeTasks(tasks);
  return tasks[idx];
}

module.exports = {
  readTasks,
  addTask,
  listTasks,
  completeTask,
  deleteTask,
  editTask,
};
