# CLI Task Manager

A simple, reliable command-line task manager with **automatic backup protection** to ensure you never lose your tasks.

## Quick Start

```bash
# Add tasks
node app.js add "Buy groceries"
node app.js add "Clean the house"

# List all tasks
node app.js list

# Mark task as done
node app.js done 1

# See all commands
node app.js help
```

## Features

✅ **Add, edit, delete, and complete tasks**  
✅ **Automatic backup on every change** - Never lose data  
✅ **Export/import tasks** - Create manual backups anytime  
✅ **Restore from backup** - Go back to any point in time  
✅ **Full test coverage** - 25+ unit tests ensure reliability  
✅ **Graceful error handling** - App won't crash on bad data  

## Commands

### Task Management
| Command | Purpose | Example |
|---------|---------|---------|
| `add "text"` | Create a new task | `node app.js add "Buy milk"` |
| `list` | Show all tasks | `node app.js list` |
| `done <id>` | Mark task complete | `node app.js done 1` |
| `edit <id> "text"` | Update task text | `node app.js edit 1 "Buy milk and bread"` |
| `delete <id>` | Remove a task | `node app.js delete 2` |

### Backup & Recovery
| Command | Purpose | Example |
|---------|---------|---------|
| `export [filename]` | Save tasks to file | `node app.js export my-tasks.json` |
| `import <filename>` | Load tasks from file | `node app.js import my-tasks.json` |
| `backups` | List auto-backups | `node app.js backups` |
| `restore <filename>` | Restore from backup | `node app.js restore backup-2026-03-30T13-15-57.json` |

## Installation

### Requirements
- Node.js v12+
- npm (included with Node.js)

### Setup
```bash
# Install project (for testing)
npm install

# Run the app
node app.js add "Your first task"
```

## How It Works

### Automatic Backups
- Every time you add, edit, delete, or complete a task, a timestamped backup is automatically created
- Backups are stored in `backups/` folder with format: `backup-YYYY-MM-DDTHH-mm-ss.json`
- You can restore to any previous backup anytime

### Data Storage
- Current tasks: `tasks.json`
- Auto-backups: `backups/backup-*.json`
- Manual exports: Any filename you specify

### Error Protection
- Corrupted data? The app resets and warns you
- Missing files? Clear error message with solution
- Invalid input? You'll know exactly what went wrong

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- Adding, editing, deleting tasks
- Completing tasks (no duplicates)
- Export/import functionality
- Backup and restore
- Error handling
- Data corruption recovery

## Example Workflow

```bash
# Start fresh
node app.js add "Buy groceries"
node app.js add "Walk the dog"
node app.js add "Study JavaScript"
node app.js list
# Output:
# 1. [ ] Buy groceries
# 2. [ ] Walk the dog
# 3. [ ] Study JavaScript

# Oops, made a mistake - undo with backup
node app.js backups
# Available backups:
#   1. backup-2026-03-30T13-16-59.json
#   2. backup-2026-03-30T13-16-48.json

node app.js restore backup-2026-03-30T13-16-48.json

# Or export before experimenting
node app.js export "safe-backup.json"
node app.js delete 1
node app.js list

# Then restore if needed
node app.js import "safe-backup.json"
```

## Documentation

This is the main README for the project. It contains the core overview, install steps, usage, commands, testing, and troubleshooting.

Additional documentation is stored in the secondary README at `doc/README.md`.

- [Secondary documentation README](doc/README.md)
- [Complete feature reference](doc/FEATURES-IMPLEMENTED.md)

For detailed information about all features, see [FEATURES-IMPLEMENTED.md](doc/FEATURES-IMPLEMENTED.md)

## Architecture

```
my-first-pro/
├── app.js                    # CLI entry point
├── lib/
│   └── taskManager.js        # Core task management logic
├── __tests__/
│   └── taskManager.test.js  # Unit tests (Jest)
├── backups/                  # Auto-backup directory
├── tasks.json               # Current task data
└── doc/
    ├── README.md
    ├── FEATURES-IMPLEMENTED.md  # Complete feature reference
    ├── Project-CLITaskManager.md
    ├── QUICK-REFERENCE.md
    ├── Development-method.md
    └── GSD.md
```

## Key Functions

### taskManager.js
- `addTask(text)` - Create task
- `listTasks()` - Get all tasks
- `completeTask(id)` - Mark done
- `editTask(id, newText)` - Update task
- `deleteTask(id)` - Remove task
- `exportTasks(filename)` - Save to file
- `importTasks(filename)` - Load from file
- `listBackups()` - Get backup list
- `restoreFromBackup(filename)` - Restore from backup

## Troubleshooting

### Tasks disappeared!
Don't worry - check your backups:
```bash
node app.js backups
node app.js restore backup-YOUR-DATE-HERE.json
```

### Can't import a file?
Make sure:
1. File exists in the project folder: `node app.js import filename.json`
2. File contains valid JSON
3. File is an array of task objects

### Tests failing?
Run test setup:
```bash
npm install
npm test
```

## Version History

**v1.0.0** (March 30, 2026)
- Task CRUD operations
- Automatic backup system
- Export/import functionality
- Full test coverage
- Error handling

## License

MIT

## Questions?

All code is well-commented. Check out:
- `app.js` - Command handling
- `lib/taskManager.js` - Core logic
- `__tests__/taskManager.test.js` - Test examples

---

**Remember:** Your tasks are automatically backed up on every change. You're safe! 🎉
