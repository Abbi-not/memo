import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';
import CustomCalendar from '../components/CustomCalendar';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 10;
const CARD_WIDTH = (SCREEN_WIDTH / 2) - (CARD_MARGIN * 3);
const CARD_HEIGHT = 150;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: boolean; count: number }>>({});
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem('entries');
      const allEntries = stored ? JSON.parse(stored) : [];
      setEntries(allEntries);

      // Build markedDates object with counts
      const marks: Record<string, { marked: boolean; count: number }> = {};
      allEntries.forEach((e: any) => {
        if (marks[e.date]) {
          marks[e.date].count += 1;
        } else {
          marks[e.date] = { marked: true, count: 1 };
        }
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

  // Play voice note
  const playVoice = async (entryId: string, uri: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
        if (playingId === entryId) return; // toggle same entry
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setPlayingId(entryId);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          setSound(null);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const entriesForDate = entries.filter((e) => e.date === selectedDate);

  const renderEntry = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EntryDetails', { entry: item })}
      style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
    >
      {item.imageUri ? (
        <ImageBackground
          source={{ uri: item.imageUri }}
          style={styles.imageBackground}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={styles.overlay}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.note && (
              <Text style={styles.content} numberOfLines={2}>
                {item.note}
              </Text>
            )}
            {item.voiceUri && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playVoice(item.id, item.voiceUri)}
              >
                <Ionicons
                  name={playingId === item.id ? 'pause' : 'play'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.noImageCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          {item.note && (
            <Text style={[styles.content, { color: colors.text }]} numberOfLines={2}>
              {item.note}
            </Text>
          )}
          {item.voiceUri && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => playVoice(item.id, item.voiceUri)}
            >
              <Ionicons
                name={playingId === item.id ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomCalendar
        selectedDate={selectedDate}
        onDateSelect={(date) => setSelectedDate(date)}
        markedDates={markedDates} // <-- pass markedDates here
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('NewEntry', { selectedDate })}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.buttonText}>+ New Entry</Text>
      </TouchableOpacity>

      {entriesForDate.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>
          No entries for this day
        </Text>
      ) : (
        <FlatList
          data={entriesForDate}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          numColumns={2}
          key={'numColumns-2'}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: CARD_MARGIN }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: CARD_MARGIN }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: { padding: 15, borderRadius: 10, margin: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },

  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'relative',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { color: '#fff', fontSize: 14, marginTop: 2 },
  noImageCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  playButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
