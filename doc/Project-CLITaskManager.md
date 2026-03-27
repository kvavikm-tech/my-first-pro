Here is a **clean, student-facing document** you can give directly in the course:

---

# 📦 Project: CLI Task Manager (Node.js)

## 🎯 Objective

You will build a simple **command-line application** that allows you to:

- Add tasks
- View tasks
- Mark tasks as done
- Save tasks so they persist between runs

---

# 🧠 Problem Description

We want to create a small tool that helps us keep track of tasks.

Instead of using apps like Todoist or Notion, we will build our own version that runs in the terminal.

---

# ⚙️ How the Program Should Work

You will run commands like:

```bash
node app.js add "Buy milk"
node app.js list
node app.js done 1
```

---

# 📥 Input → Output

## Input

- Command from terminal (`add`, `list`, `done`)
    
- Optional text or ID
    

## Output

- Updated task list
    
- Feedback in terminal (e.g. “Task added”)
    

---

# 🧱 Data Structure

Each task should look like this:

```json
{
  "id": 1,
  "text": "Buy milk",
  "done": false
}
```

All tasks should be stored in a file:

```
tasks.json
```

---

# 📋 Requirements (MVP)

## ✅ Core Features

### 1. Add Task

- Add a new task from terminal
    
- Assign it a unique ID
    
- Save it to file
    

---

### 2. List Tasks

- Show all tasks
    
- Display:
    
    - ID
        
    - Text
        
    - Status (done / not done)
        

---

### 3. Complete Task

- Mark a task as done using its ID
    

---

### 4. Persistent Storage

- Tasks must be saved in `tasks.json`
    
- Data should still exist after restarting the program
    

---

# 🧪 Testing Requirements

You should test that:

- Tasks are saved correctly
    
- Tasks are loaded correctly
    
- Completing a task updates it
    
- Program handles invalid input (e.g. wrong ID)
    

---

# 🗂️ Suggested Structure

```
project/
├── app.js
├── tasks.json
└── lib/
    └── taskManager.js
```

---

# ⚠️ Rules

- Focus on **one task at a time**
    
- Keep code simple
    
- Run your program often
    
- Do not try to build everything at once
    

---

# 🔁 Workflow (Important)

You will follow this loop:

1. **Discuss** – understand the problem
    
2. **Plan** – break it into tasks (use gsd)
    
3. **Execute** – build one thing at a time
    
4. **Test** – verify that it works
    

Then repeat.

---

# 🚀 Goal

By the end of this project, you will understand:

- How to structure a small program
    
- How to work step-by-step like a developer
    
- How to store and manage data
    
- How to debug and improve your code
    

---

If you get stuck:

👉 Go back to **plan**, not forward to more code.