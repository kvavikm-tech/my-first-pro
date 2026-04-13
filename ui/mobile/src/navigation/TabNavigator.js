import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TaskListScreen from '../screens/TaskListScreen';
import TagsScreen from '../screens/TagsScreen';
import BackupScreen from '../screens/BackupScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#333',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="TasksTab"
        component={TaskListScreen}
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
        }}
      />
      <Tab.Screen
        name="TagsTab"
        component={TagsScreen}
        options={{
          title: 'Tags',
          tabBarLabel: 'Tags',
        }}
      />
      <Tab.Screen
        name="BackupTab"
        component={BackupScreen}
        options={{
          title: 'Backup',
          tabBarLabel: 'Backup',
        }}
      />
    </Tab.Navigator>
  );
}
