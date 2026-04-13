import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TaskContext } from '../context/TaskContext';
import { TaskAdapter } from '../utils/taskAdapter';

export default function BackupScreen() {
  const { exportTasks, importTasks, loadData } = useContext(TaskContext);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupsList, setBackupsList] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadBackupInfo();
    }, [])
  );

  const loadBackupInfo = async () => {
    try {
      const status = await TaskAdapter.getBackupStatus();
      setBackupStatus(status);

      const backups = await TaskAdapter.getBackupsList();
      setBackupsList(backups.backups || []);
    } catch (err) {
      console.error('Error loading backup info:', err);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const jsonData = await exportTasks();
      const timestamp = new Date().toISOString().substring(0, 10);
      const fileName = `tasks-export-${timestamp}.json`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, jsonData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Tasks',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Success', `Tasks exported to ${fileName}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to export tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupFileName) => {
    Alert.alert(
      'Restore Backup',
      `Restore from ${backupFileName}? Your current tasks will be overwritten.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await TaskAdapter.restoreFromBackup(backupFileName);
              await loadData();
              setShowRestoreModal(false);
              loadBackupInfo();
              Alert.alert('Success', 'Tasks restored from backup');
            } catch (err) {
              Alert.alert('Error', 'Failed to restore: ' + err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Backup Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup Status</Text>
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>✓</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Auto-backup Enabled</Text>
              <Text style={styles.statusDescription}>
                {backupStatus?.status || 'Loading...'}
              </Text>
              {backupStatus?.lastBackup && (
                <Text style={styles.statusLastBackup}>
                  Last backup: {backupStatus.lastBackup}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.statusNote}>
            Every task change is automatically backed up to device storage.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExport}
            disabled={loading}
          >
            <Text style={styles.actionButtonIcon}>📤</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Export Tasks</Text>
              <Text style={styles.actionButtonDescription}>
                Save as JSON file
              </Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowRestoreModal(true)}
            disabled={loading || backupsList.length === 0}
          >
            <Text style={styles.actionButtonIcon}>📥</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Restore Backup</Text>
              <Text style={styles.actionButtonDescription}>
                {backupsList.length > 0
                  ? `${backupsList.length} backups available`
                  : 'No backups to restore'}
              </Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Backups */}
        {backupsList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Backups</Text>
            {backupsList.slice(0, 5).map((backup, index) => (
              <View key={backup} style={styles.backupItem}>
                <View style={styles.backupInfo}>
                  <Text style={styles.backupName}>{backup}</Text>
                  <Text style={styles.backupDate}>
                    {index === 0 ? 'Most recent' : `${index} backup(s) ago`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={() => handleRestore(backup)}
                >
                  <Text style={styles.restoreButtonText}>Restore</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Settings Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>App Storage Directory:</Text>
            <Text style={styles.infoValue}>
              {FileSystem.documentDirectory}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Backup Intervals:</Text>
            <Text style={styles.infoValue}>
              Automatic after every task change
            </Text>
          </View>
        </View>

        {/* Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Auto-backups are created after every task action (add, edit, complete, delete)
            </Text>
            <Text style={styles.infoItem}>
              • Backups are stored locally on your device for privacy
            </Text>
            <Text style={styles.infoItem}>
              • You can export your tasks as JSON anytime to share or backup offline
            </Text>
            <Text style={styles.infoItem}>
              • Restore feature allows you to recover from any recent backup
            </Text>
          </View>
        </View>
      </View>

      {/* Restore Modal */}
      <Modal visible={showRestoreModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRestoreModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choose Backup</Text>
            <View style={{ width: 30 }} />
          </View>

          <FlatList
            data={backupsList}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.backupListItem}
                onPress={() => handleRestore(item)}
              >
                <View style={styles.backupListInfo}>
                  <Text style={styles.backupListName}>{item}</Text>
                  <Text style={styles.backupListDate}>
                    {index === 0 ? 'Most recent' : `${index} backup(s) ago`}
                  </Text>
                </View>
                <Text style={styles.backupListArrow}>›</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.backupListContent}
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statusBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statusLastBackup: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButtonArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  backupItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Courier New',
  },
  backupDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  restoreButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  restoreButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Courier New',
  },
  infoList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
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
  backupListContent: {
    padding: 16,
  },
  backupListItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  backupListInfo: {
    flex: 1,
  },
  backupListName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Courier New',
  },
  backupListDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  backupListArrow: {
    fontSize: 20,
    color: '#ccc',
  },
});