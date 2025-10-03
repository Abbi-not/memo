import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths } from 'date-fns';

interface CustomCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  markedDates?: Record<string, { marked: boolean; count?: number }>;
}

const screenWidth = Dimensions.get('window').width;
const DAY_SIZE = screenWidth / 7 - 6; // 6px for margin spacing

export default function CustomCalendar({
  selectedDate,
  onDateSelect,
  markedDates = {},
}: CustomCalendarProps) {
  const { colors, dark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const blanks = Array(getDay(monthStart)).fill(null);
  const days = [...blanks, ...allDays];

  // Get max count for month
  const maxCount = useMemo(() => {
    let max = 0;
    allDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = markedDates[dateStr]?.count || 0;
      if (count > max) max = count;
    });
    return max;
  }, [currentMonth, markedDates]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return colors.card;
    const intensity = Math.min(count / maxCount, 1);

    const interpolate = (start: number, end: number) => Math.round(start + (end - start) * intensity);

    if (!dark) {
      // light green gradient
      const r = interpolate(214, 51);
      const g = interpolate(245, 153);
      const b = interpolate(214, 51);
      return `rgb(${r},${g},${b})`;
    } else {
      // dark green gradient
      const r = interpolate(38, 13);
      const g = interpolate(77, 25);
      const b = interpolate(38, 13);
      return `rgb(${r},${g},${b})`;
    }
  };

  const renderDay = ({ item }: { item: Date | null }) => {
    if (!item) {
      return <View style={{ width: DAY_SIZE, height: DAY_SIZE, margin: 3 }} />;
    }

    const dateStr = format(item, 'yyyy-MM-dd');
    const isSelected = dateStr === selectedDate;
    const count = markedDates[dateStr]?.count || 0;

    return (
      <TouchableOpacity onPress={() => onDateSelect(dateStr)} style={{ margin: 3 }}>
        <View
          style={{
            width: DAY_SIZE,
            height: DAY_SIZE,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isSelected ? colors.primary : getHeatmapColor(count),
          }}
        >
          <Text style={{ color: isSelected ? colors.card : colors.text }}>{item.getDate()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ backgroundColor: colors.background, paddingBottom: 10 }}>
      {/* Month Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
        }}
      >
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ padding: 5 }}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>

        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: 5 }}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Weekdays */}
      <View style={{ flexDirection: 'row' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <View key={d} style={{ width: DAY_SIZE, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <FlatList
        data={days}
        renderItem={renderDay}
        keyExtractor={(_, index) => index.toString()}
        numColumns={7}
        scrollEnabled={false}
        contentContainerStyle={{ backgroundColor: colors.background }}
      />
    </View>
  );
}
