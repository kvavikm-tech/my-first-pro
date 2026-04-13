import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Modal } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { TaskContext } from '../context/TaskContext';

export default function CreateTaskScreen({ route, navigation }) {
  const { addTask, updateTask, tags } = useContext(TaskContext);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditing = route?.params?.task !== null;
  const editingTask = route?.params?.task;

  useEffect(() => {
    if (isEditing && editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      setDueDate(editingTask.dueDate ? new Date(editingTask.dueDate) : null);
      setSelectedTags(editingTask.tags || []);
      navigation.setOptions({
        title: 'Edit Task',
      });
    } else {
      navigation.setOptions({
        title: 'New Task',
      });
    }
  }, [editingTask, navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateTask(editingTask.id, {
          ...editingTask,
          title: title.trim(),
          notes: notes.trim(),
          dueDate: dueDate?.toISOString() || null,
          tags: selectedTags,
        });
      } else {
        await addTask({
          title: title.trim(),
          notes: notes.trim(),
          dueDate: dueDate?.toISOString() || null,
          tags: selectedTags,
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const getTagName = (tagId) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || 'Unknown';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Title Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you need to do?"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        {/* Due Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Due Date (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {dueDate ? dueDate.toDateString() : 'No due date'}
            </Text>
          </TouchableOpacity>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)}>
              <Text style={styles.clearDate}>Clear date</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags (Optional)</Text>
          {selectedTags.length > 0 && (
            <View style={styles.selectedTags}>
              {selectedTags.map(tagId => (
                <TouchableOpacity
                  key={tagId}
                  style={styles.selectedTag}
                  onPress={() => toggleTag(tagId)}
                >
                  <Text style={styles.selectedTagText}>{getTagName(tagId)} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => setShowTagPicker(true)}
          >
            <Text style={styles.addTagButtonText}>+ Add Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add additional notes"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={dueDate || new Date()}
        onConfirm={(date) => {
          setDueDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Tag Picker Modal */}
      <Modal visible={showTagPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.tagPickerContainer}>
          <View style={styles.tagPickerHeader}>
            <TouchableOpacity onPress={() => setShowTagPicker(false)}>
              <Text style={styles.tagPickerClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.tagPickerTitle}>Select Tags</Text>
            <View style={{ width: 30 }} />
          </View>

          <FlatList
            data={tags}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tagOption}
                onPress={() => toggleTag(item.id)}
              >
                <Text style={[
                  styles.tagOptionCheckbox,
                  { color: item.color },
                ]}
                >
                  {selectedTags.includes(item.id) ? '✓' : '○'}
                </Text>
                <Text style={styles.tagOptionName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noTagsMessage}>No tags yet. Create one in the Tags tab.</Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 100,
    paddingTop: 10,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  clearDate: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 8,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#333',
  },
  addTagButton: {
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tagPickerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tagPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tagPickerClose: {
    fontSize: 24,
    color: '#999',
    width: 30,
    textAlign: 'center',
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagOptionCheckbox: {
    fontSize: 18,
    marginRight: 12,
  },
  tagOptionName: {
    fontSize: 16,
    color: '#333',
  },
  noTagsMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
});