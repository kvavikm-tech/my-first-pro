# Quick Reference Guide

## One-Liners

```bash
# Add tasks
node app.js add "Task name"

# Show all tasks  
node app.js list

# Mark done
node app.js done 1

# Edit task
node app.js edit 1 "New text"

# Delete task
node app.js delete 1

# Backup & Restore
node app.js export                          # Auto-save with date
node app.js export "my-backup.json"         # Custom filename
node app.js import "my-backup.json"         # Load from file
node app.js backups                         # List auto-backups
node app.js restore "backup-2026-03-30..." # Restore exact state

# Help
node app.js help
```

## Common Tasks

### Scenario 1: Move tasks to a new computer
```bash
# On old computer
node app.js export "tasks-to-move.json"
# Upload or copy tasks-to-move.json to new computer

# On new computer  
node app.js import "tasks-to-move.json"
```

### Scenario 2: Accidentally deleted a task
```bash
node app.js backups                         # Find recent backup
node app.js restore "backup-2026-03-30..." # Restore it
```

### Scenario 3: Before making big changes
```bash
node app.js export "before-cleanup.json"    # Safe backup
# ... do your changes ...
# If something goes wrong:
node app.js import "before-cleanup.json"    # Restore
```

### Scenario 4: See what changed over time
```bash
node app.js backups                         # See all timestamps
# Pick different backups and restore to see how list changed
```

## Status Indicators

| Indicator | Meaning |
|-----------|---------|
| `[ ]` | Not done |
| `[x]` | Completed |

## Error Messages

| Error | Fix |
|-------|-----|
| Task ID must be a positive integer | Use: `done 1` not `done abc` |
| task text is required | Provide text: `add "something"` |
| Task with ID X not found | Check with `list`, use correct ID |
| File not found | Check filename spelling and location |
| Backup not found | Use `backups` to see available ones |

## File Locations

- Current tasks: `tasks.json`
- Auto-backups: Inside `backups/` folder
- Manual exports: Wherever you specified in project root

## Testing

```bash
npm install   # One-time setup
npm test      # Run all tests
```

## Tips & Tricks

1. **Always export before deleting tasks** - Just in case!
2. **Backups are automatic** - You don't need to do anything, they're created on every change
3. **IDs don't change** - When you delete task 2, tasks 1 and 3 keep their IDs
4. **Timestamps are UTC** - Different from your local time zone
5. **Restore creates new backup** - All restores are also backed up

## What Gets Backed Up

✅ Task ID  
✅ Task text  
✅ Done status  
✅ Created date  
✅ Updated date (if edited)  
✅ Completed date (if done)  

## What's NOT Stored

❌ Command history  
❌ Deleted tasks (unless restored from backup)  
❌ Failed operations  

---

**Pro Tip:** Run `node app.js backups` every week to see how many backups you have. Old ones can be manually deleted if you need space.
