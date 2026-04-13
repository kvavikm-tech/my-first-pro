import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { TaskContext } from '../context/TaskContext';

export default function TaskCard({ task, onPress, onComplete, onDelete }) {
  const { tags: allTags } = useContext(TaskContext);

  const getTagColor = (tagId) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag?.color || '#999';
  };

  const getTagName = (tagId) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag?.name || 'Unknown';
  };

  const isDueToday = () => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return (
      dueDate.toDateString() === today.toDateString()
    );
  };

  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        if (onDelete) onDelete();
        // Close the swipeable
        if (swipeRef) swipeRef.current?.close();
      }}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  const swipeRef = React.useRef(null);

  const getDueDateStyle = () => {
    if (isOverdue()) return { color: '#e74c3c' };
    if (isDueToday()) return { color: '#f39c12' };
    return { color: '#999' };
  };

  const getDueDateLabel = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    if (isOverdue()) return 'OVERDUE';
    if (isDueToday()) return 'DUE TODAY';
    return null;
  };

  return (
    <Swipeable renderRightActions={renderRightActions} ref={swipeRef}>
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={onComplete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[
            styles.checkboxIcon,
            task.completed && styles.checkboxIconCompleted
          ]}>
            {task.completed ? '✓' : '○'}
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              task.completed && styles.titleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.tags}>
              {task.tags.map(tagId => (
                <View
                  key={tagId}
                  style={[
                    styles.tag,
                    { borderColor: getTagColor(tagId) },
                  ]}
                >
                  <Text style={[
                    styles.tagText,
                    { color: getTagColor(tagId) },
                  ]}>
                    {getTagName(tagId)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <View style={styles.dueDateContainer}>
              <Text style={[styles.dueDate, getDueDateStyle()]}>
                {getDueDateLabel() ? getDueDateLabel() + ' • ' : ''}
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
    paddingVertical: 4,
  },
  checkboxIcon: {
    fontSize: 22,
    color: '#3498db',
    fontWeight: '600',
  },
  checkboxIconCompleted: {
    color: '#27ae60',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dueDateContainer: {
    marginTop: 6,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightContent: {
    marginLeft: 8,
  },
  chevron: {
    fontSize: 20,
    color: '#ddd',
  },
  deleteAction: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginRight: 0,
  },
  deleteActionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});