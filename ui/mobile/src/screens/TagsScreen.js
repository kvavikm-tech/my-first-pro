import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TaskContext } from '../context/TaskContext';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function TagsScreen() {
  const { tags, addTag, updateTag, deleteTag, loadData } = useContext(TaskContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingTag, setEditingTag] = useState(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenCreate = () => {
    setEditingTag(null);
    setTagName('');
    setSelectedColor(COLORS[0]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setSelectedColor(tag.color);
    setShowCreateModal(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      Alert.alert('Error', 'Tag name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (editingTag) {
        await updateTag(editingTag.id, {
          ...editingTag,
          name: tagName.trim(),
          color: selectedColor,
        });
      } else {
        await addTag({
          name: tagName.trim(),
          color: selectedColor,
        });
      }
      setShowCreateModal(false);
      setTagName('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = (tag) => {
    Alert.alert(
      'Delete Tag',
      `Delete "${tag.name}"? This will remove it from all tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(tag.id);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {tags.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tags yet</Text>
          <Text style={styles.emptySubtext}>Create a tag to organize your tasks</Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tagItem}>
              <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              <View style={styles.tagInfo}>
                <Text style={styles.tagName}>{item.name}</Text>
              </View>
              <View style={styles.tagActions}>
                <TouchableOpacity
                  onPress={() => handleOpenEdit(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTag(item)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenCreate}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create/Edit Tag Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTag ? 'Edit Tag' : 'New Tag'}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.form}>
            {/* Tag Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tag Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Work, Personal, Shopping"
                placeholderTextColor="#999"
                value={tagName}
                onChangeText={setTagName}
                autoFocus
              />
            </View>

            {/* Color Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveTag}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingTag ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  listContent: {
    padding: 16,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#ffffff',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  deleteButton: {
    borderColor: '#ff6B6B',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6B6B',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
    width: 30,
    textAlign: 'center',
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
    marginBottom: 12,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  colorCheckmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
});