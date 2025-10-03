import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, PanResponder, Animated } from 'react-native';
import { useRoute, useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function EntryDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { entry } = route.params;

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const progressWidth = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(0);

  // PanResponder for dragging the progress handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (sound) sound.pauseAsync();
      },
      onPanResponderMove: (_, gestureState) => {
        const newProgress = Math.min(Math.max(gestureState.dx / progressBarWidth.current + progress, 0), 1);
        progressWidth.setValue(newProgress * progressBarWidth.current);
        setProgress(newProgress);
      },
      onPanResponderRelease: async () => {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.setPositionAsync(progress * status.durationMillis);
            if (isPlaying) await sound.playAsync();
          }
        }
      },
    })
  ).current;

  const deleteEntry = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('entries');
      if (!storedEntries) return;
      const entries = JSON.parse(storedEntries).filter((e: any) => e.id !== entry.id);
      await AsyncStorage.setItem('entries', JSON.stringify(entries));
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  const playPauseVoice = async () => {
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: entry.voiceUri });
        setSound(newSound);
        setIsPlaying(true);
        await newSound.playAsync();
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setProgress(status.positionMillis / status.durationMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setProgress(0);
            }
          }
        });
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{entry.title}</Text>
      <Text style={[styles.date, { color: colors.text }]}>{entry.date}</Text>
      <Text style={[styles.note, { color: colors.text }]}>{entry.note}</Text>
      {entry.imageUri && <Image source={{ uri: entry.imageUri }} style={styles.image} />}

      {entry.voiceUri && (
        <View style={[styles.audioPlayer, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={playPauseVoice} style={styles.playPauseButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>

          <View
            style={styles.progressContainer}
            onLayout={(e) => {
              progressBarWidth.current = e.nativeEvent.layout.width;
            }}
          >
            <View style={[styles.progressBarBackground, { backgroundColor: '#555' }]} />
            <Animated.View
              style={[
                styles.progressBarForeground,
                { width: progress * progressBarWidth.current, backgroundColor: colors.primary },
              ]}
            />
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.progressHandle,
                { left: progress * progressBarWidth.current - 12, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={deleteEntry}
      >
        <Text style={styles.buttonText}>Delete Entry</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  date: { fontSize: 14, marginBottom: 15 },
  note: { fontSize: 16, marginBottom: 15 },
  image: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  button: { padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },

  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
  },
  playPauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  progressBarForeground: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  progressHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
