import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useTheme } from '@react-navigation/native';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<any>({});

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem('entries');
      const allEntries = stored ? JSON.parse(stored) : [];
      setEntries(allEntries);

      // Mark calendar dates with entries
      const marks: any = {};
      allEntries.forEach((e: any) => {
        marks[e.date] = { marked: true, dotColor: colors.primary };
      });
      setMarkedDates(marks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadEntries);
    return unsubscribe;
  }, [navigation]);

  // Filter entries by selected date
  const entriesForDate = entries.filter((e) => e.date === selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{ ...markedDates, [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: colors.primary } }}
        theme={{
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
        }}
      />

      {entriesForDate.length === 0 ? (
        <Text style={{ color: colors.text, marginTop: 20, textAlign: 'center' }}>
          No entries for this day
        </Text>
      ) : (
        <FlatList
          data={entriesForDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('EntryDetails', { entry: item })}>
              <View style={[styles.entry, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  entry: { padding: 15, margin: 10, borderRadius: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
});
