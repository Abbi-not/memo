import React, { createContext, useState, useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import NewEntryScreen from './screens/NewEntryScreen';
import EntryDetailsScreen from './screens/EntryDetailsScreen';
import CalendarScreen from './screens/CalendarScreen';

export type RootStackParamList = {
  Home: undefined;
  NewEntry: undefined;
  EntryDetails: undefined;
  Calendar: undefined;
};

// Theme Context
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({
  theme: DefaultTheme,
  toggleTheme: () => {},
});

// Theme Provider
export const ThemeProvider = ({ children }: any) => {
  const [theme, setTheme] = useState<Theme>(DefaultTheme);

  const toggleTheme = () => {
    setTheme((t) => (t.dark ? DefaultTheme : DarkTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainNavigator() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const headerButton = () => (
    <TouchableOpacity
      onPress={toggleTheme}
      style={styles.headerButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 }}>
        {theme.dark ? '🌙' : '☀️'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.primary,
          headerRight: headerButton,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Diary' }} />
        <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: 'New Entry' }} />
        <Stack.Screen name="EntryDetails" component={EntryDetailsScreen} options={{ title: 'Entry Details' }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 10,
    padding: 10, // larger touch area
  },
});
