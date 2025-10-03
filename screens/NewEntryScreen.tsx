import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export default function NewEntryScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const selectedDateFromRoute: string | undefined = route.params?.selectedDate;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);

  // Image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setVoiceUri(uri);
    setRecording(null);
  };

  // Save entry
  const saveEntry = async () => {
    const newEntry = {
      id: Date.now().toString(),
      title,
      note,
      imageUri,
      voiceUri,
      date: selectedDateFromRoute || new Date().toISOString().split('T')[0],
    };

    try {
      const existingEntries = await AsyncStorage.getItem('entries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      entries.unshift(newEntry);
      await AsyncStorage.setItem('entries', JSON.stringify(entries));

      setTitle('');
      setNote('');
      setImageUri(null);
      setVoiceUri(null);

      navigation.goBack();
    } catch (err) {
      console.error(err);
      alert('Failed to save entry.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Title:</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Entry title"
        placeholderTextColor={colors.text + '99'}
      />

      <Text style={[styles.label, { color: colors.text }]}>Note:</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
        value={note}
        onChangeText={setNote}
        placeholder="Write your diary entry..."
        placeholderTextColor={colors.text + '99'}
        multiline
      />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={pickImage}
      >
        <Text style={styles.buttonText}>Pick Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? 'Stop Recording' : 'Record Voice Note'}
        </Text>
      </TouchableOpacity>
      {voiceUri && <Text style={{ color: colors.text, marginBottom: 15 }}>🎵 Voice note ready!</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={saveEntry}
      >
        <Text style={styles.buttonText}>Save Entry</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { padding: 10, borderRadius: 10, marginBottom: 15 },
  textArea: { padding: 10, borderRadius: 10, height: 120, marginBottom: 15, textAlignVertical: 'top' },
  button: { padding: 15, borderRadius: 10, marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  image: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
});
