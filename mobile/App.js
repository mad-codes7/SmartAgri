/**
 * SmartAgri AI Mobile - Main App (Bottom Tab Navigation)
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ChatbotFAB from './src/components/ChatbotFAB';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import MarketScreen from './src/screens/MarketScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import CropsScreen from './src/screens/CropsScreen';
import SchemesScreen from './src/screens/SchemesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import DiseaseDetectionScreen from './src/screens/DiseaseDetectionScreen';
import FarmMapScreen from './src/screens/FarmMapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MoreScreen from './src/screens/MoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.green800,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
};

// Inner stack for "More" section screens
function MoreStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ title: '☰ More' }} />
      <Stack.Screen name="Crops" component={CropsScreen} options={{ title: '🌾 Crop Library' }} />
      <Stack.Screen name="Schemes" component={SchemesScreen} options={{ title: '🏛️ Schemes' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: '📋 History' }} />
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} options={{ title: '🔬 Disease Detection' }} />
      <Stack.Screen name="FarmMap" component={FarmMapScreen} options={{ title: '🗺️ Farm Map' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '👤 Profile' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          ...headerStyle,
          tabBarActiveTintColor: COLORS.green600,
          tabBarInactiveTintColor: COLORS.gray400,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.borderSubtle,
            paddingBottom: 6,
            paddingTop: 6,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text> }}
        />
        <Tab.Screen
          name="Recommend"
          component={RecommendScreen}
          options={{ title: 'Advisory', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌱</Text> }}
        />
        <Tab.Screen
          name="Market"
          component={MarketScreen}
          options={{ title: 'Market', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📈</Text> }}
        />
        <Tab.Screen
          name="Weather"
          component={WeatherScreen}
          options={{ title: 'Weather', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌤️</Text> }}
        />
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{ headerShown: false, title: 'More', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>☰</Text> }}
        />
      </Tab.Navigator>
      <ChatbotFAB />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.green600} />
        <Text style={{ marginTop: 12, color: COLORS.gray500, fontSize: 14 }}>Loading SmartAgri AI...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </LanguageProvider>
  );
}
