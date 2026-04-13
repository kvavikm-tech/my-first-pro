# Task Manager Mobile App

React Native cross-platform mobile app for iOS and Android built with Expo.

## Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

```bash
cd ui/mobile
npm install
```

### Run on iOS Simulator (macOS only)
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run on Device
```bash
npm start
# Then:
# - Press 'i' for iOS (requires iOS device)
# - Press 'a' for Android (requires Android device)
```

## Features

✅ **Create Tasks** - Add tasks with title, due date, tags, and notes  
✅ **Organize with Tags** - Create custom tags to organize tasks  
✅ **Due Dates** - Set optional due dates; see overdue/today highlights  
✅ **Auto-backup** - Every task change is auto-backed up locally  
✅ **Export/Import** - Share tasks as JSON files  
✅ **Restore** - Recover from any previous backup  
✅ **Dark Mode Ready** - Minimalist zen design  

## App Structure

```
ui/mobile/
├── App.js                    # Root component with navigation
├── src/
│   ├── screens/
│   │   ├── TaskListScreen.js    # Main task list view
│   │   ├── CreateTaskScreen.js  # Task creation/editing modal
│   │   ├── TagsScreen.js        # Tag management
│   │   └── BackupScreen.js      # Backup & restore
│   ├── components/
│   │   ├── TaskCard.js          # Reusable task item component
│   │   └── QuickAdd.js          # Floating action button
│   ├── context/
│   │   └── TaskContext.js       # Global state management
│   ├── navigation/
│   │   └── TabNavigator.js      # Bottom tab navigation
│   └── utils/
│       └── taskAdapter.js       # Bridge to file system persistence
├── package.json
└── app.json                  # Expo config
```

## Data Storage

- **Tasks**: `${FileSystem.documentDirectory}/tasks.json`
- **Tags**: `${FileSystem.documentDirectory}/tags.json`
- **Backups**: `${FileSystem.documentDirectory}/backups/backup-*.json`

All data is stored locally on the device for privacy.

## Development Notes

### State Management
- Uses React Context (TaskContext) for app-wide state
- Actions dispatch through context (addTask, updateTask, deleteTask, etc.)

### Adapter Pattern
- `TaskAdapter` bridges React Native UI to file system persistence
- Handles auto-backup creation on every task mutation
- Implements JSON-based data storage compatible with web/desktop

### Minimalist Design
- Single color palette (white, light grey, #3498db accent)
- Minimal shadows and borders
- Focus on typography and clear hierarchy
- Responsive touch targets

## Testing

### Manual Tests to Verify MVP
1. **Create Task**: Add a task with title, due date, tags → verify in list
2. **Complete Task**: Swipe task to complete → verify strikethrough
3. **Delete Task**: Swipe task → press Delete → verify removal
4. **Create Tag**: Go to Tags tab → + button → create "Work" tag with color
5. **Add Tags to Task**: Create task → + Add Tag → select "Work"
6. **Export**: Go to Backup tab → Export Tasks → verify JSON file
7. **Restore**: Go to Backup tab → Restore → select a backup → verify data restored

## Next Steps (Phase 2)

- [ ] Recurring tasks
- [ ] Due date reminders/notifications
- [ ] Team collaboration features
- [ ] Cloud sync (optional)
- [ ] Categories hierarchy
- [ ] Advanced filtering & search
- [ ] Performance optimizations
- [ ] Offline-first sync strategy

## Troubleshooting

### "Module not found" errors
```bash
cd ui/mobile
npm install  # Install all dependencies
```

### Build fails on Expo Go
Try clearing cache:
```bash
expo start --clear
```

### Data not persisting
Check that app has file system permissions:
- iOS: Check Info.plist in Xcode
- Android: Check AndroidManifest.xml permissions

## License
MIT
