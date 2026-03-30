const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_DIR = path.resolve(__dirname, '..', 'db');
const DB_FILE = path.join(DB_DIR, 'tasks.db');

let db = null;
let SQL = null;
let isInitialized = false;

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
      completedAt TEXT
    )
  `);
  saveDatabase();
  isInitialized = true;
}

function getTasks() {
  const database = loadDatabase();
  const stmt = database.prepare('SELECT * FROM tasks ORDER BY id ASC');
  const tasks = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    tasks.push({
      ...row,
      done: row.done === 1
    });
  }
  stmt.free();
  return tasks;
}

function addTask(text) {
  if (!text || !text.trim()) {
    throw new Error('Task text is required');
  }
  const database = loadDatabase();
  const now = new Date().toISOString();
  database.run(
    'INSERT INTO tasks (text, done, createdAt) VALUES (?, 0, ?)',
    [text.trim(), now]
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
    createdAt: now
  };
}

function completeTask(id) {
  const database = loadDatabase();
  
  // Check if task exists
  const stmt = database.prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = stmt.getAsObject();
  stmt.free();

  // Check if already done
  if (task.done === 1) {
    return {
      task: { ...task, done: true },
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
  
  // Check if task exists
  const stmt = database.prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = stmt.getAsObject();
  stmt.free();

  // Delete task
  database.run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDatabase();

  return { ...task, done: task.done === 1 };
}

function editTask(id, newText) {
  if (!newText || !newText.trim()) {
    throw new Error('Task text is required');
  }
  const database = loadDatabase();

  // Check if task exists
  const stmt = database.prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = stmt.getAsObject();
  stmt.free();

  // Update task
  const now = new Date().toISOString();
  database.run(
    'UPDATE tasks SET text = ?, updatedAt = ? WHERE id = ?',
    [newText.trim(), now, id]
  );
  saveDatabase();

  return {
    ...task,
    text: newText.trim(),
    updatedAt: now,
    done: task.done === 1
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
  database.run(
    'INSERT INTO tasks (id, text, done, createdAt, updatedAt, completedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.text, task.done ? 1 : 0, task.createdAt, task.updatedAt || null, task.completedAt || null]
  );
  saveDatabase();
  return task;
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
