/**
 * TaskAdapter: Bridge between React Native UI and core Node.js taskManager
 * 
 * This adapter handles:
 * - Translating task operations to file system operations
 * - Managing JSON persistence for mobile
 * - Backup/restore operations
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const API_KEY = (process.env.EXPO_PUBLIC_API_KEY || '').trim();
const USE_API = (process.env.EXPO_PUBLIC_USE_API || '').toLowerCase() === 'true';
const STORAGE_KEYS = {
  tasks: 'task_manager_tasks',
  tags: 'task_manager_tags',
  backups: 'task_manager_backups',
  backupsIndex: 'task_manager_backups_index',
};

const TASKS_FILE = FileSystem.documentDirectory + 'tasks.json';
const TAGS_FILE = FileSystem.documentDirectory + 'tags.json';
const BACKUPS_DIR = FileSystem.documentDirectory + 'backups/';
const BACKUPS_INDEX_FILE = FileSystem.documentDirectory + 'backups-index.json';

class TaskAdapterClass {
  constructor() {
    this.initialized = false;
    this.apiEnabled = USE_API && Boolean(API_URL) && Boolean(API_KEY);
  }

  shouldUseApi() {
    return this.apiEnabled;
  }

  normalizeTaskId(taskId) {
    const parsed = Number(taskId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('Task ID must be a positive integer');
    }
    return parsed;
  }

  toApiTaskPayload(task) {
    const text = (task?.title || task?.text || '').trim();
    if (!text) {
      throw new Error('Task text is required');
    }

    const tags = Array.isArray(task?.tags)
      ? task.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    return {
      text,
      tags,
      notes: typeof task?.notes === 'string' ? task.notes : '',
      dueDate: task?.dueDate ?? null,
    };
  }

  fromApiTask(task) {
    return {
      id: task.id,
      title: task.text,
      completed: Boolean(task.done),
      createdAt: task.createdAt || new Date().toISOString(),
      dueDate: task.dueDate ?? null,
      tags: Array.isArray(task.tags) ? task.tags : [],
      notes: typeof task.notes === 'string' ? task.notes : '',
      updatedAt: task.updatedAt || null,
      completedAt: task.completedAt || null,
    };
  }

  async apiRequest(path, options = {}) {
    if (!this.shouldUseApi()) {
      throw new Error('API mode is not enabled');
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(options.headers || {}),
      },
    });

    const bodyText = await response.text();
    let body = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = { error: bodyText };
      }
    }

    if (!response.ok) {
      const message = body?.error || `API request failed with status ${response.status}`;
      throw new Error(message);
    }

    return body;
  }

  readWebJson(key, fallback) {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  writeWebJson(key, value) {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch (err) {
      throw new Error('Failed to write web storage: ' + err.message);
    }
  }

  createBackupFileName(suffix = '') {
    return `backup-${new Date().toISOString().replace(/[:.]/g, '-')}${suffix}.json`;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      if (this.shouldUseApi()) {
        this.initialized = true;
        return;
      }

      if (IS_WEB) {
        if (!Array.isArray(this.readWebJson(STORAGE_KEYS.tasks, null))) {
          this.writeWebJson(STORAGE_KEYS.tasks, []);
        }
        if (!Array.isArray(this.readWebJson(STORAGE_KEYS.tags, null))) {
          this.writeWebJson(STORAGE_KEYS.tags, []);
        }
        if (!Array.isArray(this.readWebJson(STORAGE_KEYS.backups, null))) {
          this.writeWebJson(STORAGE_KEYS.backups, []);
        }
        if (!this.readWebJson(STORAGE_KEYS.backupsIndex, null)) {
          this.writeWebJson(STORAGE_KEYS.backupsIndex, {
            count: 0,
            latestBackup: null,
            backups: [],
          });
        }

        this.initialized = true;
        return;
      }

      // Create necessary directories
      const backupsInfo = await FileSystem.getInfoAsync(BACKUPS_DIR);
      if (!backupsInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUPS_DIR, { intermediates: true });
      }
      
      // Initialize tasks file if it doesn't exist
      const tasksInfo = await FileSystem.getInfoAsync(TASKS_FILE);
      if (!tasksInfo.exists) {
        await FileSystem.writeAsStringAsync(TASKS_FILE, JSON.stringify([]));
      }
      
      // Initialize tags file if it doesn't exist
      const tagsInfo = await FileSystem.getInfoAsync(TAGS_FILE);
      if (!tagsInfo.exists) {
        await FileSystem.writeAsStringAsync(TAGS_FILE, JSON.stringify([]));
      }
      
      this.initialized = true;
    } catch (err) {
      console.error('TaskAdapter init error:', err);
      throw new Error('Failed to initialize task adapter: ' + err.message);
    }
  }

  async getTasks() {
    await this.init();
    try {
      if (this.shouldUseApi()) {
        const data = await this.apiRequest('/tasks');
        return Array.isArray(data.tasks) ? data.tasks.map((task) => this.fromApiTask(task)) : [];
      }

      if (IS_WEB) {
        return this.readWebJson(STORAGE_KEYS.tasks, []);
      }
      const content = await FileSystem.readAsStringAsync(TASKS_FILE);
      return JSON.parse(content);
    } catch (err) {
      console.error('getTasks error:', err);
      return [];
    }
  }

  async getTags() {
    await this.init();
    try {
      if (IS_WEB) {
        return this.readWebJson(STORAGE_KEYS.tags, []);
      }
      const content = await FileSystem.readAsStringAsync(TAGS_FILE);
      return JSON.parse(content);
    } catch (err) {
      console.error('getTags error:', err);
      return [];
    }
  }

  async addTask(task) {
    await this.init();
    try {
      if (this.shouldUseApi()) {
        const payload = this.toApiTaskPayload(task);
        const data = await this.apiRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const mapped = this.fromApiTask(data.task);
        task.id = mapped.id;
        task.title = mapped.title;
        task.completed = mapped.completed;
        task.createdAt = mapped.createdAt;
        task.dueDate = mapped.dueDate;
        task.tags = mapped.tags;
        task.notes = mapped.notes;
        task.updatedAt = mapped.updatedAt;
        task.completedAt = mapped.completedAt;
        return;
      }

      const tasks = await this.getTasks();
      tasks.push(task);
      await this.saveTasks(tasks);
      await this.createBackup('task_add');
    } catch (err) {
      throw new Error('Failed to add task: ' + err.message);
    }
  }

  async updateTask(task) {
    await this.init();
    try {
      if (this.shouldUseApi()) {
        const taskId = this.normalizeTaskId(task.id);
        const payload = this.toApiTaskPayload(task);
        await this.apiRequest(`/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return;
      }

      const tasks = await this.getTasks();
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = task;
      }
      await this.saveTasks(tasks);
      await this.createBackup('task_update');
    } catch (err) {
      throw new Error('Failed to update task: ' + err.message);
    }
  }

  async deleteTask(taskId) {
    await this.init();
    try {
      if (this.shouldUseApi()) {
        const normalizedId = this.normalizeTaskId(taskId);
        await this.apiRequest(`/tasks/${normalizedId}`, {
          method: 'DELETE',
        });
        return;
      }

      const tasks = await this.getTasks();
      const filtered = tasks.filter(t => t.id !== taskId);
      await this.saveTasks(filtered);
      await this.createBackup('task_delete');
    } catch (err) {
      throw new Error('Failed to delete task: ' + err.message);
    }
  }

  async completeTask(taskId) {
    await this.init();
    try {
      if (this.shouldUseApi()) {
        const normalizedId = this.normalizeTaskId(taskId);
        await this.apiRequest(`/tasks/${normalizedId}/done`, {
          method: 'PATCH',
        });
        return;
      }

      const tasks = await this.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
      }
      await this.saveTasks(tasks);
      await this.createBackup('task_complete');
    } catch (err) {
      throw new Error('Failed to complete task: ' + err.message);
    }
  }

  async addTag(tag) {
    await this.init();
    try {
      const tags = await this.getTags();
      tags.push(tag);
      await this.saveTags(tags);
      await this.createBackup('tag_add');
    } catch (err) {
      throw new Error('Failed to add tag: ' + err.message);
    }
  }

  async updateTag(tag) {
    await this.init();
    try {
      const tags = await this.getTags();
      const index = tags.findIndex(t => t.id === tag.id);
      if (index !== -1) {
        tags[index] = tag;
      }
      await this.saveTags(tags);
      await this.createBackup('tag_update');
    } catch (err) {
      throw new Error('Failed to update tag: ' + err.message);
    }
  }

  async deleteTag(tagId) {
    await this.init();
    try {
      const tags = await this.getTags();
      const filtered = tags.filter(t => t.id !== tagId);
      await this.saveTags(filtered);
      
      // Remove tag from all tasks
      const tasks = await this.getTasks();
      tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags = task.tags.filter(t => t !== tagId);
        }
      });
      await this.saveTasks(tasks);
      
      await this.createBackup('tag_delete');
    } catch (err) {
      throw new Error('Failed to delete tag: ' + err.message);
    }
  }

  async saveTasks(tasks) {
    try {
      if (IS_WEB) {
        this.writeWebJson(STORAGE_KEYS.tasks, tasks);
        return;
      }
      await FileSystem.writeAsStringAsync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    } catch (err) {
      throw new Error('Failed to save tasks: ' + err.message);
    }
  }

  async saveTags(tags) {
    try {
      if (IS_WEB) {
        this.writeWebJson(STORAGE_KEYS.tags, tags);
        return;
      }
      await FileSystem.writeAsStringAsync(TAGS_FILE, JSON.stringify(tags, null, 2));
    } catch (err) {
      throw new Error('Failed to save tags: ' + err.message);
    }
  }

  async createBackup(action = '') {
    try {
      if (this.shouldUseApi()) {
        return;
      }

      const tasks = await this.getTasks();
      const tags = await this.getTags();
      const fileName = this.createBackupFileName();
      const backup = {
        fileName,
        tasks,
        tags,
        timestamp: new Date().toISOString(),
        action,
      };

      if (IS_WEB) {
        const backups = this.readWebJson(STORAGE_KEYS.backups, []);
        backups.unshift(backup);
        this.writeWebJson(STORAGE_KEYS.backups, backups.slice(0, 200));
        await this.updateBackupsIndex();
        return;
      }
      
      const filePath = BACKUPS_DIR + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));
      
      // Update backups index
      await this.updateBackupsIndex();
    } catch (err) {
      console.error('createBackup error:', err);
      // Don't throw - backup failures shouldn't crash the app
    }
  }

  async updateBackupsIndex() {
    try {
      if (this.shouldUseApi()) {
        return;
      }

      if (IS_WEB) {
        const backups = this.readWebJson(STORAGE_KEYS.backups, []);
        const names = backups.map(b => b.fileName).filter(Boolean);
        const index = {
          count: names.length,
          latestBackup: names.length > 0 ? names[0] : null,
          backups: names.slice(0, 20),
        };
        this.writeWebJson(STORAGE_KEYS.backupsIndex, index);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(BACKUPS_DIR);
      const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
      
      const index = {
        count: backupFiles.length,
        latestBackup: backupFiles.length > 0 ? backupFiles[backupFiles.length - 1] : null,
        backups: backupFiles.sort().reverse().slice(0, 20), // Keep latest 20
      };
      
      await FileSystem.writeAsStringAsync(BACKUPS_INDEX_FILE, JSON.stringify(index, null, 2));
    } catch (err) {
      console.error('updateBackupsIndex error:', err);
    }
  }

  async getBackupsList() {
    await this.init();

    if (this.shouldUseApi()) {
      const data = await this.apiRequest('/backups');
      const backups = Array.isArray(data.backups) ? data.backups : [];
      return {
        count: backups.length,
        latestBackup: backups.length > 0 ? backups[0] : null,
        backups,
      };
    }

    if (IS_WEB) {
      const parsed = this.readWebJson(STORAGE_KEYS.backupsIndex, null);
      if (parsed && Array.isArray(parsed.backups)) {
        return parsed;
      }
      await this.updateBackupsIndex();
      return this.readWebJson(STORAGE_KEYS.backupsIndex, { count: 0, latestBackup: null, backups: [] });
    }

    try {
      const content = await FileSystem.readAsStringAsync(BACKUPS_INDEX_FILE);
      const parsed = JSON.parse(content);

      // If index exists but is malformed/stale, rebuild from directory.
      if (!parsed || !Array.isArray(parsed.backups)) {
        throw new Error('Invalid backups index');
      }

      return parsed;
    } catch (err) {
      try {
        await this.init();
        const files = await FileSystem.readDirectoryAsync(BACKUPS_DIR);
        const backupFiles = files
          .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
          .sort()
          .reverse();

        const rebuilt = {
          count: backupFiles.length,
          latestBackup: backupFiles.length > 0 ? backupFiles[0] : null,
          backups: backupFiles.slice(0, 20),
        };

        // Keep index in sync so subsequent loads are fast.
        await FileSystem.writeAsStringAsync(BACKUPS_INDEX_FILE, JSON.stringify(rebuilt, null, 2));
        return rebuilt;
      } catch {
        return { count: 0, latestBackup: null, backups: [] };
      }
    }
  }

  async restoreFromBackup(backupFileName) {
    try {
      if (this.shouldUseApi()) {
        await this.apiRequest(`/backups/${encodeURIComponent(backupFileName)}/restore`, {
          method: 'POST',
        });
        return;
      }

      let backup;

      if (IS_WEB) {
        const backups = this.readWebJson(STORAGE_KEYS.backups, []);
        backup = backups.find(b => b.fileName === backupFileName);
        if (!backup) {
          throw new Error('Backup file not found');
        }
      } else {
        const filePath = BACKUPS_DIR + backupFileName;
        const content = await FileSystem.readAsStringAsync(filePath);
        backup = JSON.parse(content);
      }

      // Support both current and legacy backup formats.
      // - Current: { tasks: [...], tags: [...] }
      // - Legacy: [...] (tasks array only)
      let tasksToRestore = [];
      let tagsToRestore = [];

      if (Array.isArray(backup)) {
        tasksToRestore = backup;
      } else if (Array.isArray(backup?.tasks)) {
        tasksToRestore = backup.tasks;
        if (Array.isArray(backup.tags)) {
          tagsToRestore = backup.tags;
        }
      } else {
        throw new Error('Backup file has invalid format');
      }

      const currentTasks = await this.getTasks();
      const currentTags = await this.getTags();

      // Save a backup of the current state before applying restore.
      const preRestoreBackup = {
        fileName: this.createBackupFileName('-pre-restore'),
        tasks: currentTasks,
        tags: currentTags,
        timestamp: new Date().toISOString(),
        action: 'pre_restore',
      };

      if (IS_WEB) {
        const backups = this.readWebJson(STORAGE_KEYS.backups, []);
        backups.unshift(preRestoreBackup);
        this.writeWebJson(STORAGE_KEYS.backups, backups.slice(0, 200));
        await this.updateBackupsIndex();
      } else {
        await FileSystem.writeAsStringAsync(BACKUPS_DIR + preRestoreBackup.fileName, JSON.stringify(preRestoreBackup, null, 2));
      }

      await this.saveTasks(tasksToRestore);
      await this.saveTags(tagsToRestore);
      await this.createBackup('restore');
    } catch (err) {
      throw new Error('Failed to restore from backup: ' + err.message);
    }
  }

  async exportTasks() {
    try {
      const tasks = await this.getTasks();
      const tags = await this.getTags();
      
      return JSON.stringify({
        tasks,
        tags,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      }, null, 2);
    } catch (err) {
      throw new Error('Failed to export tasks: ' + err.message);
    }
  }

  async importTasks(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!Array.isArray(data.tasks)) {
        throw new Error('Invalid import format: missing tasks array');
      }
      
      await this.saveTasks(data.tasks);
      if (Array.isArray(data.tags)) {
        await this.saveTags(data.tags);
      }
      
      await this.createBackup('import');
    } catch (err) {
      throw new Error('Failed to import tasks: ' + err.message);
    }
  }

  async getBackupStatus() {
    try {
      const backupsList = await this.getBackupsList();
      const latestBackup = backupsList.latestBackup;
      
      if (!latestBackup) {
        return { lastBackup: null, status: this.shouldUseApi() ? 'No server backups yet' : 'No backups yet' };
      }
      
      if (!IS_WEB && !this.shouldUseApi()) {
        const filePath = BACKUPS_DIR + latestBackup;
        await FileSystem.getInfoAsync(filePath);
      }
      
      return {
        lastBackup: latestBackup,
        status: this.shouldUseApi()
          ? `✓ Server backup enabled (${backupsList.count} backups)`
          : `✓ Auto-backup enabled (${backupsList.count} backups)`,
        timestamp: latestBackup.replace(/['-]/g, ':').substring(7, 20),
      };
    } catch (err) {
      return { status: 'Backup system ready' };
    }
  }
}

export const TaskAdapter = new TaskAdapterClass();