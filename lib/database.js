const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_DIR = path.resolve(__dirname, '..', 'db');
const DB_FILE = path.join(DB_DIR, 'tasks.db');

let db = null;
let SQL = null;
let isInitialized = false;

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function normalizeTaskMetadata(metadata = {}) {
  return {
    dueDate: metadata.dueDate ?? null,
    tags: normalizeTags(metadata.tags),
    notes: typeof metadata.notes === 'string' ? metadata.notes : '',
  };
}

function serializeTags(tags) {
  return JSON.stringify(normalizeTags(tags));
}

function parseTags(rawTags) {
  if (!rawTags) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTags);
    return normalizeTags(parsed);
  } catch {
    return [];
  }
}

function normalizeRow(row) {
  return {
    ...row,
    done: row.done === 1,
    dueDate: row.dueDate || null,
    tags: parseTags(row.tags),
    notes: typeof row.notes === 'string' ? row.notes : '',
  };
}

function getTaskByIdOrThrow(database, id) {
  const stmt = database.prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);

  if (!stmt.step()) {
    stmt.free();
    throw new Error(`Task with ID ${id} not found`);
  }

  const row = stmt.getAsObject();
  stmt.free();
  return normalizeRow(row);
}

function mergeMetadata(currentTask, metadata = {}) {
  const has = Object.prototype.hasOwnProperty.bind(metadata);

  return {
    dueDate: has('dueDate') ? (metadata.dueDate ?? null) : (currentTask.dueDate ?? null),
    tags: has('tags') ? normalizeTags(metadata.tags) : normalizeTags(currentTask.tags),
    notes: has('notes')
      ? (typeof metadata.notes === 'string' ? metadata.notes : '')
      : (typeof currentTask.notes === 'string' ? currentTask.notes : ''),
  };
}

function ensureTasksColumns(database) {
  const stmt = database.prepare('PRAGMA table_info(tasks)');
  const columns = new Set();

  while (stmt.step()) {
    const row = stmt.getAsObject();
    columns.add(row.name);
  }
  stmt.free();

  if (!columns.has('dueDate')) {
    database.run('ALTER TABLE tasks ADD COLUMN dueDate TEXT');
  }

  if (!columns.has('tags')) {
    database.run('ALTER TABLE tasks ADD COLUMN tags TEXT');
  }

  if (!columns.has('notes')) {
    database.run('ALTER TABLE tasks ADD COLUMN notes TEXT');
  }
}

// Ensure db directory exists
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Initialize sql.js (load it once)
async function loadSqlJs() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

// Load database from disk or create new
function loadDatabase() {
  if (!db) {
    ensureDbDir();
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE);
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
    }
  }
  return db;
}

// Save database to disk
function saveDatabase() {
  if (db) {
    ensureDbDir();
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

async function initDatabase() {
  if (isInitialized) return;
  
  await loadSqlJs();
  const database = loadDatabase();
  
  database.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      completedAt TEXT,
      dueDate TEXT,
      tags TEXT,
      notes TEXT
    )
  `);

  ensureTasksColumns(database);
  saveDatabase();
  isInitialized = true;
}

function getTasks() {
  const database = loadDatabase();
  const stmt = database.prepare('SELECT * FROM tasks ORDER BY id ASC');
  const tasks = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    tasks.push(normalizeRow(row));
  }
  stmt.free();
  return tasks;
}

function addTask(text, metadata = {}) {
  if (!text || !text.trim()) {
    throw new Error('Task text is required');
  }

  const database = loadDatabase();
  const now = new Date().toISOString();
  const normalizedMetadata = normalizeTaskMetadata(metadata);

  database.run(
    'INSERT INTO tasks (text, done, createdAt, dueDate, tags, notes) VALUES (?, 0, ?, ?, ?, ?)',
    [
      text.trim(),
      now,
      normalizedMetadata.dueDate,
      serializeTags(normalizedMetadata.tags),
      normalizedMetadata.notes,
    ]
  );
  saveDatabase();
  
  // Get the inserted task
  const stmt = database.prepare('SELECT id FROM tasks ORDER BY id DESC LIMIT 1');
  stmt.step();
  const { id } = stmt.getAsObject();
  stmt.free();
  
  return {
    id,
    text: text.trim(),
    done: false,
    createdAt: now,
    dueDate: normalizedMetadata.dueDate,
    tags: normalizedMetadata.tags,
    notes: normalizedMetadata.notes,
  };
}

function completeTask(id) {
  const database = loadDatabase();
  const task = getTaskByIdOrThrow(database, id);

  // Check if already done
  if (task.done) {
    return {
      task,
      wasCompleted: false
    };
  }

  // Mark as done
  const now = new Date().toISOString();
  database.run(
    'UPDATE tasks SET done = 1, completedAt = ? WHERE id = ?',
    [now, id]
  );
  saveDatabase();

  const updatedTask = {
    ...task,
    done: true,
    completedAt: now
  };

  return {
    task: updatedTask,
    wasCompleted: true
  };
}

function deleteTask(id) {
  const database = loadDatabase();
  const task = getTaskByIdOrThrow(database, id);

  // Delete task
  database.run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDatabase();

  return task;
}

function editTask(id, newText, metadata = {}) {
  if (!newText || !newText.trim()) {
    throw new Error('Task text is required');
  }

  const database = loadDatabase();
  const task = getTaskByIdOrThrow(database, id);
  const mergedMetadata = mergeMetadata(task, metadata);

  // Update task
  const now = new Date().toISOString();
  database.run(
    'UPDATE tasks SET text = ?, updatedAt = ?, dueDate = ?, tags = ?, notes = ? WHERE id = ?',
    [
      newText.trim(),
      now,
      mergedMetadata.dueDate,
      serializeTags(mergedMetadata.tags),
      mergedMetadata.notes,
      id,
    ]
  );
  saveDatabase();

  return {
    ...task,
    text: newText.trim(),
    updatedAt: now,
    dueDate: mergedMetadata.dueDate,
    tags: mergedMetadata.tags,
    notes: mergedMetadata.notes,
  };
}

function resetDatabase() {
  const database = loadDatabase();
  database.run('DELETE FROM tasks');
  // Reset auto-increment counter
  database.run('DELETE FROM sqlite_sequence WHERE name="tasks"');
  saveDatabase();
}

function addTaskWithMetadata(task) {
  const database = loadDatabase();
  const metadata = normalizeTaskMetadata(task);

  database.run(
    'INSERT INTO tasks (id, text, done, createdAt, updatedAt, completedAt, dueDate, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      task.id,
      task.text,
      task.done ? 1 : 0,
      task.createdAt,
      task.updatedAt || null,
      task.completedAt || null,
      metadata.dueDate,
      serializeTags(metadata.tags),
      metadata.notes,
    ]
  );
  saveDatabase();

  return {
    ...task,
    dueDate: metadata.dueDate,
    tags: metadata.tags,
    notes: metadata.notes,
  };
}

module.exports = {
  initDatabase,
  getTasks,
  addTask,
  completeTask,
  deleteTask,
  editTask,
  resetDatabase,
  addTaskWithMetadata
};
