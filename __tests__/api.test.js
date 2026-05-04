const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp } = require('../api/app');
const { initDatabase, resetDatabase } = require('../lib/database');

const BACKUPS_DIR = path.resolve(__dirname, '..', 'backups');

function cleanBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    return;
  }

  const files = fs.readdirSync(BACKUPS_DIR);
  files.forEach((file) => {
    fs.unlinkSync(path.join(BACKUPS_DIR, file));
  });
}

describe('Task API', () => {
  let app;

  beforeAll(async () => {
    process.env.API_KEY = 'test-api-key';
    await initDatabase();
    app = createApp();
  });

  beforeEach(() => {
    resetDatabase();
    cleanBackups();
  });

  test('GET /health should work without API key', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /tasks should reject missing API key', async () => {
    const res = await request(app).get('/tasks');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('POST /tasks should create task with API key', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Write API tests' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.task.text).toBe('Write API tests');
    expect(createRes.body.task.done).toBe(false);

    const listRes = await request(app)
      .get('/tasks')
      .set('X-API-Key', 'test-api-key');

    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks).toHaveLength(1);
    expect(listRes.body.tasks[0].text).toBe('Write API tests');
  });

  test('POST /tasks should validate text', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Task text is required');
  });

  test('POST /tasks should persist metadata fields', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({
        text: 'Task with metadata',
        tags: ['backend', 'api'],
        notes: 'Needs follow-up',
        dueDate: '2026-06-01T00:00:00.000Z',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.task.tags).toEqual(['backend', 'api']);
    expect(createRes.body.task.notes).toBe('Needs follow-up');
    expect(createRes.body.task.dueDate).toBe('2026-06-01T00:00:00.000Z');
  });

  test('PATCH /tasks/:id should edit an existing task', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Old text' });

    const taskId = createRes.body.task.id;

    const editRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Updated text' });

    expect(editRes.status).toBe(200);
    expect(editRes.body.task.text).toBe('Updated text');
  });

  test('PATCH /tasks/:id should update metadata fields', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({
        text: 'Metadata task',
        tags: ['old'],
        notes: 'Old note',
      });

    const taskId = createRes.body.task.id;

    const editRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .set('X-API-Key', 'test-api-key')
      .send({
        text: 'Metadata task updated',
        tags: ['new', 'priority'],
        notes: 'Updated note',
        dueDate: '2026-07-01T00:00:00.000Z',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.task.tags).toEqual(['new', 'priority']);
    expect(editRes.body.task.notes).toBe('Updated note');
    expect(editRes.body.task.dueDate).toBe('2026-07-01T00:00:00.000Z');
  });

  test('PATCH /tasks/:id/done should complete a task', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Finish me' });

    const taskId = createRes.body.task.id;

    const doneRes = await request(app)
      .patch(`/tasks/${taskId}/done`)
      .set('X-API-Key', 'test-api-key');

    expect(doneRes.status).toBe(200);
    expect(doneRes.body.wasCompleted).toBe(true);
    expect(doneRes.body.task.done).toBe(true);
  });

  test('DELETE /tasks/:id should delete a task', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Delete me' });

    const taskId = createRes.body.task.id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('X-API-Key', 'test-api-key');

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.task.id).toBe(taskId);

    const listRes = await request(app)
      .get('/tasks')
      .set('X-API-Key', 'test-api-key');

    expect(listRes.body.tasks).toHaveLength(0);
  });

  test('GET /backups should return backup list', async () => {
    await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Generate backup' });

    const backupsRes = await request(app)
      .get('/backups')
      .set('X-API-Key', 'test-api-key');

    expect(backupsRes.status).toBe(200);
    expect(Array.isArray(backupsRes.body.backups)).toBe(true);
    expect(backupsRes.body.backups.length).toBeGreaterThan(0);
  });

  test('POST /backups/:filename/restore should restore data', async () => {
    const first = await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Task A' });

    await request(app)
      .post('/tasks')
      .set('X-API-Key', 'test-api-key')
      .send({ text: 'Task B' });

    const backupsRes = await request(app)
      .get('/backups')
      .set('X-API-Key', 'test-api-key');

    const backupFile = backupsRes.body.backups[0];

    await request(app)
      .delete(`/tasks/${first.body.task.id}`)
      .set('X-API-Key', 'test-api-key');

    const restoreRes = await request(app)
      .post(`/backups/${backupFile}/restore`)
      .set('X-API-Key', 'test-api-key');

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.taskCount).toBe(2);
  });
});
