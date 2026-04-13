import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TaskAdapter } from '../utils/taskAdapter';

export const TaskContext = createContext();

const initialState = {
  tasks: [],
  tags: [],
  loading: true,
  error: null,
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        ),
      };
    
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    
    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };
    
    case 'UPDATE_TAG':
      return {
        ...state,
        tags: state.tags.map(tag =>
          tag.id === action.payload.id ? action.payload : tag
        ),
      };
    
    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter(tag => tag.id !== action.payload),
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const tasks = await TaskAdapter.getTasks();
      const tags = await TaskAdapter.getTags();
      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_TAGS', payload: tags });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const addTask = useCallback(async (taskData) => {
    try {
      const newTask = {
        id: uuidv4(),
        title: taskData.title,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: taskData.dueDate || null,
        tags: taskData.tags || [],
        notes: taskData.notes || '',
      };
      await TaskAdapter.addTask(newTask);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      return newTask;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const updated = { ...updates, id: taskId };
      await TaskAdapter.updateTask(updated);
      dispatch({ type: 'UPDATE_TASK', payload: updated });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await TaskAdapter.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const completeTask = useCallback(async (taskId) => {
    try {
      await TaskAdapter.completeTask(taskId);
      dispatch({ type: 'COMPLETE_TASK', payload: taskId });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const addTag = useCallback(async (tagData) => {
    try {
      const newTag = {
        id: uuidv4(),
        name: tagData.name,
        color: tagData.color || '#3498db',
        createdAt: new Date().toISOString(),
      };
      await TaskAdapter.addTag(newTag);
      dispatch({ type: 'ADD_TAG', payload: newTag });
      return newTag;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const updateTag = useCallback(async (tagId, updates) => {
    try {
      const updated = { ...updates, id: tagId };
      await TaskAdapter.updateTag(updated);
      dispatch({ type: 'UPDATE_TAG', payload: updated });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (tagId) => {
    try {
      await TaskAdapter.deleteTag(tagId);
      dispatch({ type: 'DELETE_TAG', payload: tagId });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const exportTasks = useCallback(async () => {
    try {
      return await TaskAdapter.exportTasks();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const importTasks = useCallback(async (jsonData) => {
    try {
      await TaskAdapter.importTasks(jsonData);
      loadData(); // Reload data after import
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, [loadData]);

  const value = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addTag,
    updateTag,
    deleteTag,
    exportTasks,
    importTasks,
    loadData,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}
