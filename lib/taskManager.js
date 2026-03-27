const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'tasks.json');

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
      throw new Error('tasks.json content is not an array');
    }
    return data;
  } catch (err) {
    throw new Error(`Failed to read tasks: ${err.message}`);
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
  const tid = Number(id);
  if (!Number.isInteger(tid) || tid <= 0) {
    throw new Error('Task ID must be a positive integer');
  }

  const idx = tasks.findIndex((t) => t.id === tid);
  if (idx === -1) {
    throw new Error(`Task with ID ${tid} not found`);
  }

  if (tasks[idx].done) {
    return tasks[idx];
  }

  tasks[idx].done = true;
  tasks[idx].completedAt = new Date().toISOString();
  writeTasks(tasks);
  return tasks[idx];
}

module.exports = {
  readTasks,
  addTask,
  listTasks,
  completeTask,
};
