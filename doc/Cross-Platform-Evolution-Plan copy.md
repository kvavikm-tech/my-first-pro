# Cross-Platform Evolution Plan for Task Manager

## TL;DR
Transform the current Node.js CLI task manager into a cross-platform app for mobile and desktop, keeping the core logic and auto-backup, while separating UI from engine for future extensibility. Use Electron for desktop and React Native for mobile, with the existing task service and persistence layers as the core.

## Steps

1. **Separate core engine from UI**: Extract task operations into a reusable module, keeping `taskManager.js` and `database.js` as the core, and make `app.js` a CLI adapter.

2. **Design UI adapter pattern**: Create a `ui/` directory with adapters for different interfaces, starting with CLI, then adding desktop and mobile.

3. **Choose cross-platform technologies**: Use Electron for desktop app (wraps web UI), and React Native for mobile app, both calling the same core task engine.

4. **Implement desktop app**: Create `ui/desktop/` with Electron setup, a simple web UI (HTML/CSS/JS), and integrate the core engine via Node.js require.

5. **Implement mobile app**: Create `ui/mobile/` with React Native setup, screens for task list, add/edit, and integrate the core engine (may need to adapt for mobile filesystem).

6. **Update build and packaging**: Add scripts for building desktop and mobile apps, update `package.json` with new dependencies and scripts.

7. **Test cross-platform compatibility**: Ensure core engine works on mobile filesystem, test auto-backup on different platforms.

## Relevant Files

- `taskManager.js` — Reuse as core task service, no changes needed.
- `database.js` — Reuse as persistence layer, may need minor adaptations for mobile paths.
- `app.js` — Refactor to be a CLI adapter in `ui/cli/app.js`.
- `package.json` — Update with new dependencies (electron, react-native), add build scripts.
- `ui/desktop/main.js` — New Electron main process file.
- `ui/desktop/index.html` — New web UI for desktop.
- `ui/mobile/App.js` — New React Native entry point.

## Verification

- Run existing tests to ensure core engine unchanged: `npm test`.
- Build and run desktop app: `npm run build:desktop` then launch, verify task add/list/complete works.
- Build and run mobile app: `npm run build:mobile` then launch on simulator, verify same functionality.
- Test auto-backup: Add a task on each platform, check backups directory for new files.
- Test import/export: Export from one platform, import on another, verify tasks transfer.

## Decisions

- **Keep auto-backup as-is**: Every task mutation creates a JSON snapshot in backups.
- **UI separation**: Core engine is pure Node.js, UI adapters handle platform-specific rendering and input.
- **Technologies**: Electron for desktop (familiar web tech), React Native for mobile (cross-platform native).
- **Scope**: Include basic task CRUD and backup/restore in first release, advanced features later.
- **Excluded**: Web-only UI for now, focus on native apps; no cloud sync yet.

## Further Considerations

- **How to handle mobile filesystem permissions for backups?** Recommendation: Use app-specific storage directory.
- **Should the UI be consistent across platforms?** Option A: Unified design language, Option B: Platform-native look.
- **What about offline-first?** Option A: Keep local-only as-is, Option B: Add basic sync later.

This is the plan. Now, since the user said "the exact user flow is open for discussion and we will tackle this later", I can ask for approval or further discussion.