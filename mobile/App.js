/**
 * SmartAgri AI Mobile - Main App
 * RootStack ➜ Auth screens OR MainStack
 * MainStack ➜ HomeTabs + all secondary screens at the same level.
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ChatbotFAB from './src/components/ChatbotFAB';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
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
import ExpensesScreen from './src/screens/ExpensesScreen';
import FertilizerScreen from './src/screens/FertilizerScreen';
import DistrictScreen from './src/screens/DistrictScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CropCalendarScreen from './src/screens/CropCalendarScreen';

// IMPORTANT: separate navigator instances to avoid conflicts
const RootStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── App name shown on header right ────────────────────────
const AppNameHeader = () => (
  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.green700, marginRight: 14, letterSpacing: 0.3 }}>
    SmartAgri AI
  </Text>
);

const headerStyle = {
  headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.green800,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerRight: () => <AppNameHeader />,
};

// ── Bottom tabs (5 tabs) ─────────────────────────────────
function HomeTabs({ chatbotOpen, setChatbotOpen }) {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerStyle,
        tabBarActiveTintColor: COLORS.green600,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderSubtle,
          paddingBottom: 16,
          paddingTop: 8,
          height: 72,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setChatbotOpen(true)}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: COLORS.green50, alignItems: 'center', justifyContent: 'center',
                  marginRight: 8, borderWidth: 1, borderColor: COLORS.green200,
                }}
              >
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </TouchableOpacity>
              <AppNameHeader />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Recommend"
        component={RecommendScreen}
        options={{ title: 'Advisory', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🌱</Text> }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{ title: 'Market', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📈</Text> }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: 'Expenses', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text> }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{ title: 'More', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>☰</Text> }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <AppStack.Navigator screenOptions={headerStyle}>
        {/* Tabs as home */}
        <AppStack.Screen name="HomeTabs" options={{ headerShown: false }}>
          {() => <HomeTabs chatbotOpen={chatbotOpen} setChatbotOpen={setChatbotOpen} />}
        </AppStack.Screen>

        {/* All secondary screens — accessible from any screen */}
        <AppStack.Screen name="Crops" component={CropsScreen} options={{ title: '🌾 Crop Library' }} />
        <AppStack.Screen name="Schemes" component={SchemesScreen} options={{ title: '🏛️ Schemes' }} />
        <AppStack.Screen name="History" component={HistoryScreen} options={{ title: '📋 History' }} />
        <AppStack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} options={{ title: '🔬 Disease Detection' }} />
        <AppStack.Screen name="FarmMap" component={FarmMapScreen} options={{ title: '🗺️ Farm Map' }} />
        <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: '👤 Profile' }} />
        <AppStack.Screen name="District" component={DistrictScreen} options={{ title: '🗺️ District Profile' }} />
        <AppStack.Screen name="Weather" component={WeatherScreen} options={{ title: '🌤️ Weather' }} />
        <AppStack.Screen name="Community" component={CommunityScreen} options={{ title: '🤝 Community' }} />
        <AppStack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: '✏️ New Post' }} />
        <AppStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '💬 Post' }} />
        <AppStack.Screen name="Fertilizer" component={FertilizerScreen} options={{ title: '🧪 Fertilizer & Pesticide' }} />
        <AppStack.Screen name="CropCalendar" component={CropCalendarScreen} options={{ title: '📅 Crop Calendar' }} />
      </AppStack.Navigator>
      <ChatbotFAB visible={chatbotOpen} onClose={() => setChatbotOpen(false)} />
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
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </RootStack.Navigator>
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
