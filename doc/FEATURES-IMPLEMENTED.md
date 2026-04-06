# CLI Task Manager - Implemented Features

**Last Updated:** March 30, 2026

## Project Overview

A simple command-line task manager built with Node.js that allows you to manage tasks from the terminal with automatic backup and data preservation functionality.

---

## ✅ Core Features Implemented

### 1. **Task Management (CRUD)**

#### Add Tasks
- **Command:** `node app.js add "task text"`
- **Example:** `node app.js add "Buy groceries"`
- Creates a new task with unique ID
- Auto-assigns timestamps (`createdAt`)

#### List Tasks
- **Command:** `node app.js list`
- Displays all tasks with status
- Format: `ID. [status] Text`
- Example output:
  ```
  1. [ ] Buy groceries
  2. [x] Clean house
  3. [ ] Call mom
  ```

#### Complete Tasks
- **Command:** `node app.js done <id>`
- **Example:** `node app.js done 1`
- Marks a task as complete
- Records completion time (`completedAt`)
- Prevents duplicate completions with warning message

#### Edit Tasks
- **Command:** `node app.js edit <id> "new text"`
- **Example:** `node app.js edit 1 "Buy milk and bread"`
- Updates task description
- Records update timestamp (`updatedAt`)

#### Delete Tasks
- **Command:** `node app.js delete <id>`
- **Example:** `node app.js delete 2`
- Permanently removes a task
- Deletes cannot be undone (unless you restore from backup)

---

## 💾 Data Preservation & Backup System

### Auto-Backup
- **What it does:** Automatically creates timestamped backups in the `backups/` folder
- **When it triggers:** Every time you modify tasks (add, edit, delete, complete)
- **Format:** `backup-YYYY-MM-DDTHH-mm-ss.json`
- **Example:** `backup-2026-03-30T13-15-57.json`
- **Benefit:** Never lose data - automatic protection against accidental deletions

### Export Functionality
- **Command:** `node app.js export [filename]`
- **Examples:**
  - `node app.js export my-backup.json` - Save to custom file
  - `node app.js export` - Auto-generates filename with date
- **Use case:** Create manual backups before major changes

### Import Functionality
- **Command:** `node app.js import <filename>`
- **Example:** `node app.js import my-backup.json`
- **Use case:** Restore tasks from a previously saved file
- **Note:** Replaces current tasks with imported data

### Backup Management
- **List Backups:** `node app.js backups`
  - Shows all available auto-backups (sorted newest first)
  - Example output:
    ```
    Available backups:
      1. backup-2026-03-30T13-16-59.json
      2. backup-2026-03-30T13-16-48.json
      3. backup-2026-03-30T13-16-35.json
    ```

- **Restore from Backup:** `node app.js restore <filename>`
  - **Example:** `node app.js restore backup-2026-03-30T13-16-35.json`
  - Restores exact state from that moment
  - Creates a new backup of the restored state

---

## 🛡️ Error Handling & Validation

### Input Validation
- ✅ Task IDs must be positive integers
- ✅ Task text cannot be empty or whitespace-only
- ✅ Filenames required for import/export/restore commands
- ✅ Clear error messages for invalid inputs

### Data Protection
- ✅ Corrupted `tasks.json` resets to empty list (with warning)
- ✅ Invalid JSON files gracefully handled
- ✅ Missing backup files detected with helpful errors
- ✅ File read/write errors don't crash the app

### Error Examples
```
$ node app.js done abc
Error: Task ID must be a positive integer

$ node app.js edit 1
Error: task text is required.

$ node app.js import missing-file.json
Error: File not found: missing-file.json

$ node app.js restore wrong-backup.json
Error: Backup not found: wrong-backup.json
```

---

## 📁 Data Storage

### Local Files
- **Main Data:** `tasks.json` - Current tasks (JSON array)
- **Auto-Backups:** `backups/backup-*.json` - Timestamped backups
- **Manual Exports:** User-specified filenames in project root

### Task Object Structure
```json
{
  "id": 1,
  "text": "Buy groceries",
  "done": false,
  "createdAt": "2026-03-30T15:27:25.395Z",
  "updatedAt": "2026-03-30T15:27:31.923Z",
  "completedAt": "2026-03-30T16:00:00.000Z"
}
```

---

## 🧪 Testing

### Jest Unit Tests
- **Location:** `__tests__/taskManager.test.js`
- **Run tests:** `npm test`
- **Coverage:** 25+ tests covering:
  - Task CRUD operations
  - Completion status tracking
  - Export/import functionality
  - Backup and restore
  - Error handling
  - Corrupted data recovery

### Test Categories
| Category | Tests |
|----------|-------|
| Add Task | 2 (valid, empty text) |
| List/Read | 3 (return tasks, corrupted JSON, non-array) |
| Complete Task | 3 (new, already done, not found) |
| Delete Task | 2 (success, not found) |
| Edit Task | 3 (update, empty text, not found) |
| Export | 2 (success, invalid filename) |
| Import | 3 (success, missing file, invalid content) |
| Backup/Restore | 3 (list, restore, errors) |

---

## 📋 Complete Command Reference

```
CLI Task Manager
Usage: node app.js <command> [args]

Commands:
  add "task text"       Add a new task
  list                   List all tasks
  done <id>              Mark task as done
  delete <id>            Delete a task
  edit <id> "new text"   Edit task description

Backup & Export:
  export [filename]      Export tasks to a file
  import <filename>      Import tasks from a file
  backups                List available backup files
  restore <filename>     Restore tasks from a backup

  help                   Show this help message
```

---

## Related Documentation

- [Project overview and student-facing guide](Project-CLITaskManager.md)
- [Quick command reference](QUICK-REFERENCE.md)
- [Development workflow and process](Development-method.md)
- [GSD task organization tool](GSD.md)

---

## 🚀 Recent Changes (Latest Commits)

### Commit History
1. **Add backup, export, and import functionality**
   - Auto-backup on every write
   - Export/import commands
   - Backup listing and restore

2. **Add tests for backup and export/import functions**
   - 15+ new unit tests
   - Coverage for all backup scenarios

3. **Add delete and edit commands**
   - Delete function and CLI command
   - Edit function with text updates
   - 6 tests for new features

4. **Add unit testing with Jest**
   - Jest setup
   - 10 initial unit tests

5. **Improve error handling and validation**
   - Input validation
   - Graceful JSON corruption handling
   - Better error messages

---

## 🔧 Installation & Setup

### Requirements
- Node.js (v12 or higher)
- npm (comes with Node.js)

### Quick Start
```bash
# Clone or navigate to project
cd my-first-pro

# Install dependencies (for testing)
npm install

# Run a task command
node app.js add "My first task"
node app.js list

# Run tests
npm test
```

---

## 💡 Key Design Decisions

### 1. **Automatic Backup Strategy**
- **Decision:** Auto-backup on every write operation
- **Rationale:** User data protection without extra commands
- **Benefit:** Never lose tasks, can go back to any point in time

### 2. **JSON File Storage**
- **Decision:** Simple JSON files instead of database
- **Rationale:** Easy to understand, portable, version control friendly
- **Benefit:** Can manually inspect/edit tasks, backup is human-readable

### 3. **Graceful Error Handling**
- **Decision:** Warn instead of crash on corrupted data
- **Rationale:** User can recover instead of losing everything
- **Benefit:** Robust, forgiving system

### 4. **Comprehensive Testing**
- **Decision:** Jest unit tests for all functions
- **Rationale:** Catch bugs early, prevent regressions
- **Benefit:** Safe to add features, know what works

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Commands | 11 |
| Total Functions | 10 |
| Unit Tests | 25+ |
| Backup Formats | 2 (Auto + Manual) |
| Lines of Code | ~400+ |
| Error Scenarios Handled | 15+ |

---

## 🔮 Potential Future Improvements

- [ ] Add task priorities (high/medium/low)
- [ ] Add due dates for tasks
- [ ] Add task categories/tags
- [ ] Color-coded output (using chalk library)
- [ ] Interactive mode (REPL)
- [ ] Search/filter functionality
- [ ] Task completion statistics
- [ ] Database backend (SQLite)
- [ ] Web UI
- [ ] Cloud sync

---

## 📝 Notes

- All dates are stored in ISO format (UTC)
- Task IDs are sequential and never reused
- Backups are kept indefinitely (you can delete old ones manually)
- The app is single-user (no authentication)
- All data is stored locally on your computer

---

**Created:** March 27, 2026  
**Last Updated:** March 30, 2026  
**Status:** Feature-complete for basic task management with backup protection
