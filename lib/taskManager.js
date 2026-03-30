const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.TASK_DATA_FILE || path.resolve(__dirname, '..', 'tasks.json');
const BACKUPS_DIR = path.resolve(__dirname, '..', 'backups');

// Ensure backups directory exists
function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

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
  createAutoBackup(tasks);
}

// Create automatic backup with timestamp
function createAutoBackup(tasks) {
  try {
    ensureBackupsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(BACKUPS_DIR, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (err) {
    console.warn(`Warning: Could not create backup (${err.message})`);
  }
}

// Export tasks to a custom file
function exportTasks(filename) {
  if (!filename || !filename.trim()) {
    throw new Error('Filename is required');
  }
  const tasks = readTasks();
  const exportDir = path.resolve(__dirname, '..');
  const exportFile = path.join(exportDir, filename);
  fs.writeFileSync(exportFile, JSON.stringify(tasks, null, 2), 'utf8');
  return { filename: path.basename(exportFile), taskCount: tasks.length };
}

// Import tasks from a file
function importTasks(filename) {
  if (!filename || !filename.trim()) {
    throw new Error('Filename is required');
  }
  const importDir = path.resolve(__dirname, '..');
  const importFile = path.join(importDir, filename);
  
  if (!fs.existsSync(importFile)) {
    throw new Error(`File not found: ${filename}`);
  }
  
  try {
    const raw = fs.readFileSync(importFile, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('File content is not a valid task array');
    }
    writeTasks(data);
    return { filename: path.basename(importFile), taskCount: data.length };
  } catch (err) {
    throw new Error(`Failed to import from ${filename}: ${err.message}`);
  }
}

// List available backup files
function listBackups() {
  ensureBackupsDir();
  try {
    const files = fs.readdirSync(BACKUPS_DIR).sort().reverse();
    return files.filter((f) => f.startsWith('backup-') && f.endsWith('.json'));
  } catch (err) {
    return [];
  }
}

// Restore tasks from a backup file
function restoreFromBackup(filename) {
  if (!filename || !filename.trim()) {
    throw new Error('Filename is required');
  }
  const backupFile = path.join(BACKUPS_DIR, filename);
  
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup not found: ${filename}`);
  }
  
  try {
    const raw = fs.readFileSync(backupFile, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('Backup content is not a valid task array');
    }
    writeTasks(data);
    return { filename: path.basename(backupFile), taskCount: data.length };
  } catch (err) {
    throw new Error(`Failed to restore from ${filename}: ${err.message}`);
  }
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
  exportTasks,
  importTasks,
  listBackups,
  restoreFromBackup,
};
