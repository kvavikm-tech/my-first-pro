const express = require('express');
const {
  addTask,
  listTasks,
  completeTask,
  deleteTask,
  editTask,
  listBackups,
  restoreFromBackup,
} = require('../lib/taskManager');
const { createApiKeyMiddleware } = require('./auth');

function parseTaskId(rawId) {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Task ID must be a positive integer');
  }
  return parsed;
}

function mapErrorToStatus(err) {
  const message = String(err && err.message ? err.message : '');

  if (message.includes('not found')) {
    return 404;
  }

  if (message.includes('required') || message.includes('positive integer') || message.includes('must be')) {
    return 400;
  }

  return 500;
}

function extractTaskMetadata(body = {}) {
  const metadata = {};

  if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== 'string')) {
      throw new Error('Task tags must be an array of strings');
    }
    metadata.tags = body.tags;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
    if (typeof body.notes !== 'string') {
      throw new Error('Task notes must be a string');
    }
    metadata.notes = body.notes;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    if (body.dueDate !== null && typeof body.dueDate !== 'string') {
      throw new Error('Task dueDate must be a string or null');
    }
    metadata.dueDate = body.dueDate;
  }

  return metadata;
}

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(createApiKeyMiddleware());

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/tasks', (req, res) => {
    const tasks = listTasks();
    res.json({ tasks });
  });

  app.post('/tasks', (req, res, next) => {
    try {
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      if (!text) {
        throw new Error('Task text is required');
      }

      const metadata = extractTaskMetadata(req.body);
      const task = addTask(text, metadata);
      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  });

  app.patch('/tasks/:id', (req, res, next) => {
    try {
      const taskId = parseTaskId(req.params.id);
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      if (!text) {
        throw new Error('Task text is required');
      }

      const metadata = extractTaskMetadata(req.body);
      const task = editTask(taskId, text, metadata);
      res.json({ task });
    } catch (err) {
      next(err);
    }
  });

  app.patch('/tasks/:id/done', (req, res, next) => {
    try {
      const taskId = parseTaskId(req.params.id);
      const result = completeTask(taskId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/tasks/:id', (req, res, next) => {
    try {
      const taskId = parseTaskId(req.params.id);
      const task = deleteTask(taskId);
      res.json({ task });
    } catch (err) {
      next(err);
    }
  });

  app.get('/backups', (req, res, next) => {
    try {
      const backups = listBackups();
      res.json({ backups });
    } catch (err) {
      next(err);
    }
  });

  app.post('/backups/:filename/restore', (req, res, next) => {
    try {
      const { filename } = req.params;
      const result = restoreFromBackup(filename);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.use((err, req, res, next) => {
    const status = mapErrorToStatus(err);
    const message = status === 500 ? 'Internal server error' : err.message;
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = {
  createApp,
};
