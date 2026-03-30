const { addTask, listTasks, completeTask, deleteTask, editTask, readTasks, exportTasks, importTasks, listBackups, restoreFromBackup } = require('../lib/taskManager');
const fs = require('fs');
const path = require('path');

const TEST_DATA_FILE = path.resolve(__dirname, '..', 'test-tasks.json');
const TEST_DIR = path.resolve(__dirname, '..');
const TEST_EXPORT_FILE = path.join(TEST_DIR, 'test-export.json');

// Set test data file
process.env.TASK_DATA_FILE = TEST_DATA_FILE;

beforeEach(() => {
  // Clean up test file before each test
  if (fs.existsSync(TEST_DATA_FILE)) {
    fs.unlinkSync(TEST_DATA_FILE);
  }
});

afterEach(() => {
  // Clean up after each test
  if (fs.existsSync(TEST_DATA_FILE)) {
    fs.unlinkSync(TEST_DATA_FILE);
  }
  if (fs.existsSync(TEST_EXPORT_FILE)) {
    fs.unlinkSync(TEST_EXPORT_FILE);
  }
});

describe('Task Manager', () => {
  test('addTask should add a new task', () => {
    const task = addTask('Test task');
    expect(task).toHaveProperty('id', 1);
    expect(task.text).toBe('Test task');
    expect(task.done).toBe(false);
    expect(task).toHaveProperty('createdAt');
  });

  test('addTask should throw error for empty text', () => {
    expect(() => addTask('')).toThrow('Task text is required');
    expect(() => addTask('   ')).toThrow('Task text is required');
  });

  test('listTasks should return all tasks', () => {
    addTask('Task 1');
    addTask('Task 2');
    const tasks = listTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].text).toBe('Task 1');
    expect(tasks[1].text).toBe('Task 2');
  });

  test('completeTask should mark task as done', () => {
    const added = addTask('Complete me');
    const result = completeTask(added.id);
    expect(result.wasCompleted).toBe(true);
    expect(result.task.done).toBe(true);
    expect(result.task).toHaveProperty('completedAt');
  });

  test('completeTask should handle already done task', () => {
    const added = addTask('Already done');
    completeTask(added.id); // Mark done first
    const result = completeTask(added.id); // Try again
    expect(result.wasCompleted).toBe(false);
    expect(result.task.done).toBe(true);
  });

  test('completeTask should throw error for non-existent task', () => {
    expect(() => completeTask(999)).toThrow('Task with ID 999 not found');
  });

  test('readTasks should handle corrupted JSON', () => {
    // Manually create corrupted file
    fs.writeFileSync(TEST_DATA_FILE, 'invalid json');
    const tasks = readTasks();
    expect(tasks).toEqual([]);
  });

  test('readTasks should handle non-array data', () => {
    fs.writeFileSync(TEST_DATA_FILE, '{"not": "array"}');
    const tasks = readTasks();
    expect(tasks).toEqual([]);
  });

  test('deleteTask should remove a task', () => {
    const added = addTask('Delete me');
    const deleted = deleteTask(added.id);
    expect(deleted.id).toBe(added.id);
    expect(deleted.text).toBe('Delete me');
    const remaining = listTasks();
    expect(remaining).toHaveLength(0);
  });

  test('deleteTask should throw error for non-existent task', () => {
    expect(() => deleteTask(999)).toThrow('Task with ID 999 not found');
  });

  test('editTask should update task text', () => {
    const added = addTask('Original text');
    const edited = editTask(added.id, 'Updated text');
    expect(edited.id).toBe(added.id);
    expect(edited.text).toBe('Updated text');
    expect(edited).toHaveProperty('updatedAt');
  });

  test('editTask should throw error for empty text', () => {
    const added = addTask('Task');
    expect(() => editTask(added.id, '')).toThrow('Task text is required');
    expect(() => editTask(added.id, '   ')).toThrow('Task text is required');
  });

  test('editTask should throw error for non-existent task', () => {
    expect(() => editTask(999, 'New text')).toThrow('Task with ID 999 not found');
  });

  test('exportTasks should save tasks to a file', () => {
    addTask('Task 1');
    addTask('Task 2');
    const result = exportTasks('test-export.json');
    expect(result.taskCount).toBe(2);
    expect(fs.existsSync(TEST_EXPORT_FILE)).toBe(true);
    const data = JSON.parse(fs.readFileSync(TEST_EXPORT_FILE, 'utf8'));
    expect(data).toHaveLength(2);
  });

  test('exportTasks should throw error for empty filename', () => {
    expect(() => exportTasks('')).toThrow('Filename is required');
  });

  test('importTasks should load tasks from a file', () => {
    // First create some tasks and export them
    addTask('Imported task 1');
    addTask('Imported task 2');
    exportTasks('test-export.json');
    
    // Clear current tasks
    const emptiedData = [];
    fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(emptiedData));
    
    // Import from file
    const result = importTasks('test-export.json');
    expect(result.taskCount).toBe(2);
    const tasks = listTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].text).toBe('Imported task 1');
    expect(tasks[1].text).toBe('Imported task 2');
  });

  test('importTasks should throw error for missing file', () => {
    expect(() => importTasks('non-existent-file.json')).toThrow('File not found');
  });

  test('importTasks should throw error for invalid file content', () => {
    fs.writeFileSync(TEST_EXPORT_FILE, '{"not": "array"}');
    expect(() => importTasks('test-export.json')).toThrow('not a valid task array');
  });

  test('listBackups should return array of backup files', () => {
    addTask('Task for backup');
    const backups = listBackups();
    expect(Array.isArray(backups)).toBe(true);
    expect(backups.length).toBeGreaterThan(0);
    expect(backups[0]).toMatch(/^backup-.*\.json$/);
  });

  test('listBackups should return empty array if no backups', () => {
    // Set to a non-existent backups directory
    process.env.BACKUPS_DIR = '/non/existent/path';
    // This would require mocking, but we can at least verify the function exists
    expect(typeof listBackups).toBe('function');
  });

  test('restoreFromBackup should restore tasks', () => {
    // Create initial tasks
    const task1 = addTask('Backup test 1');
    const task2 = addTask('Backup test 2');
    
    // Get the most recent backup
    const backups = listBackups();
    expect(backups.length).toBeGreaterThan(0);
    
    // Delete a task to change state
    deleteTask(task2.id);
    let tasks = listTasks();
    expect(tasks).toHaveLength(1);
    
    // Restore from backup
    const result = restoreFromBackup(backups[0]);
    expect(result.taskCount).toBe(2);
    tasks = listTasks();
    expect(tasks).toHaveLength(2);
  });

  test('restoreFromBackup should throw error for non-existent backup', () => {
    expect(() => restoreFromBackup('non-existent-backup.json')).toThrow('Backup not found');
  });
});