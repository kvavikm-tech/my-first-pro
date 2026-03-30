#!/usr/bin/env node
const { addTask, listTasks, completeTask, deleteTask, editTask } = require('./lib/taskManager');

const argv = process.argv.slice(2);
const command = argv[0];

function printHelp() {
  console.log('CLI Task Manager');
  console.log('Usage: node app.js <command> [args]');
  console.log('Commands:');
  console.log('  add "task text"       Add a new task');
  console.log('  list                   List all tasks');
  console.log('  done <id>              Mark task as done');
  console.log('  delete <id>            Delete a task');
  console.log('  edit <id> "new text"   Edit task description');
  console.log('  help                   Show this help message');
}

function validateId(id) {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('Task ID must be a positive integer');
  }
  return num;
}

function formatTask(task) {
  const status = task.done ? '[x]' : '[ ]';
  return `${task.id}. ${status} ${task.text}`;
}

async function main() {
  try {
    switch (command) {
      case 'add': {
        const text = argv.slice(1).join(' ').trim();
        if (!text) {
          console.error('Error: task text is required.');
          printHelp();
          process.exit(1);
        }
        const task = addTask(text);
        console.log(`Task added: ${task.id}. ${task.text}`);
        break;
      }
      case 'list': {
        const tasks = listTasks();
        if (tasks.length === 0) {
          console.log('No tasks yet. Add one with: node app.js add "Buy milk"');
          break;
        }
        tasks.forEach((task) => {
          console.log(formatTask(task));
        });
        break;
      }
      case 'done': {
        const id = argv[1];
        if (!id) {
          console.error('Error: task id is required.');
          printHelp();
          process.exit(1);
        }
        const tid = validateId(id);
        const result = completeTask(tid);
        if (result.wasCompleted) {
          console.log(`Task marked done: ${result.task.id}. ${result.task.text}`);
        } else {
          console.log(`Task ${result.task.id} is already marked as done.`);
        }
        break;
      }
      case 'delete': {
        const id = argv[1];
        if (!id) {
          console.error('Error: task id is required.');
          printHelp();
          process.exit(1);
        }
        const tid = validateId(id);
        const task = deleteTask(tid);
        console.log(`Task deleted: ${task.id}. ${task.text}`);
        break;
      }
      case 'edit': {
        const id = argv[1];
        const text = argv.slice(2).join(' ').trim();
        if (!id) {
          console.error('Error: task id is required.');
          printHelp();
          process.exit(1);
        }
        if (!text) {
          console.error('Error: task text is required.');
          printHelp();
          process.exit(1);
        }
        const tid = validateId(id);
        const task = editTask(tid, text);
        console.log(`Task updated: ${task.id}. ${task.text}`);
        break;
      }
      case 'help':
      case undefined:
      case '':
        printHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
