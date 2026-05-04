const db = require('./database');
const fs = require('fs');
const path = require('path');

const BACKUPS_DIR = path.resolve(__dirname, '..', 'backups');

// Ensure backups directory exists
function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

// Create automatic backup with timestamp (including milliseconds for uniqueness)
function createAutoBackup(tasks) {
  try {
    ensureBackupsDir();
    const now = new Date().toISOString();
    // Format: YYYY-MM-DDTHH-mm-ss-mmm (keep milliseconds for uniqueness)
    const timestamp = now.replace(/[:.]/g, '-').replace('Z', '');
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
  const tasks = db.getTasks();
  const exportDir = path.resolve(__dirname, '..');
  const exportFile = path.join(exportDir, filename);
  fs.writeFileSync(exportFile, JSON.stringify(tasks, null, 2), 'utf8');
  return { filename: path.basename(exportFile), taskCount: tasks.length };
}

// Import tasks from a file and load them into the database
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
    
    // Clear existing tasks and insert imported ones
    db.resetDatabase();
    for (const task of data) {
      // Restore tasks with their original IDs and timestamps
      const importedTask = db.addTaskWithMetadata(task);
    }
    
    // Create backup of imported state
    createAutoBackup(data);
    
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
    
    // Clear existing tasks and restore from backup
    db.resetDatabase();
    for (const task of data) {
      db.addTaskWithMetadata(task);
    }
    
    // Create a backup of the restored state
    createAutoBackup(data);
    
    return { filename: path.basename(backupFile), taskCount: data.length };
  } catch (err) {
    throw new Error(`Failed to restore from ${filename}: ${err.message}`);
  }
}

// Core CRUD functions (delegate to database layer)
function addTask(text, metadata = {}) {
  const task = db.addTask(text, metadata);
  createAutoBackup(db.getTasks());
  return task;
}

function listTasks() {
  return db.getTasks();
}

function completeTask(id) {
  const result = db.completeTask(id);
  createAutoBackup(db.getTasks());
  return result;
}

function deleteTask(id) {
  const task = db.deleteTask(id);
  createAutoBackup(db.getTasks());
  return task;
}

function editTask(id, newText, metadata = {}) {
  const task = db.editTask(id, newText, metadata);
  createAutoBackup(db.getTasks());
  return task;
}

module.exports = {
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
