const { addTask, listTasks, completeTask, deleteTask, editTask, readTasks } = require('../lib/taskManager');
const fs = require('fs');
const path = require('path');

const TEST_DATA_FILE = path.resolve(__dirname, '..', 'test-tasks.json');

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
});