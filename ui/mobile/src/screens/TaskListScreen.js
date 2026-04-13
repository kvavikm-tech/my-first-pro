import React, { useContext, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, SectionList, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TaskContext } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import QuickAdd from '../components/QuickAdd';

export default function TaskListScreen({ navigation }) {
  const { tasks, completeTask, deleteTask, loadData } = useContext(TaskContext);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTaskPress = (task) => {
    navigation.navigate('CreateTask', { taskId: task.id, task });
  };

  const handleComplete = async (taskId) => {
    try {
      await completeTask(taskId);
    } catch (err) {
      alert('Failed to complete task: ' + err.message);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const handleAddPress = () => {
    navigation.navigate('CreateTask', { task: null });
  };

  // Filter tasks by search text
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Separate active and completed tasks
  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const sections = [
    { title: 'Active', data: activeTasks },
    { title: 'Completed', data: completedTasks },
  ].filter(section => section.data.length > 0);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search tasks..."
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor="#999"
      />
      
      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks yet</Text>
          <Text style={styles.emptySubtext}>Tap + to create your first task</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onComplete={() => handleComplete(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      <QuickAdd onPress={handleAddPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 0,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});