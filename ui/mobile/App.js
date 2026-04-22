import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider } from './src/context/TaskContext';
import TabNavigator from './src/navigation/TabNavigator';
import CreateTaskScreen from './src/screens/CreateTaskScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TaskProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                cardStyle: { backgroundColor: '#ffffff' },
              }}
            >
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="CreateTask"
                component={CreateTaskScreen}
                options={{
                  title: 'New Task',
                  presentation: 'modal',
                  headerStyle: {
                    backgroundColor: '#ffffff',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                  },
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </TaskProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}