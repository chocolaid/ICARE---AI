import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import LottieView from 'lottie-react-native';
import { auth } from '../firebaseConfig';
import { safetySettings } from './chat';
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultChat } from './chathistory';

const HomeScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringScaleAnim1 = useRef(new Animated.Value(1)).current;
  const ringScaleAnim2 = useRef(new Animated.Value(1)).current;
  const ringScaleAnim3 = useRef(new Animated.Value(1)).current;
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPath, setAudioPath] = useState(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const soundRef = useRef(null);
  const unikey = auth.currentUser.uid;
  const [chatHistory, setChatHistory] = useState(defaultChat);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.025,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scaleAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScaleAnim1, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [ringScaleAnim1]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScaleAnim2, {
          toValue: 1.075,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim2, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [ringScaleAnim2]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScaleAnim3, {
          toValue: 1.1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim3, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [ringScaleAnim3]);

  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        await AsyncStorage.setItem(`chatHistory-Jarvis`, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };
    saveChatHistory();
  }, [chatHistory]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(`chatHistory-Jarvis`);
        if (storedHistory) {
          setChatHistory(JSON.parse(storedHistory));
        } else {
          setChatHistory([...defaultChat]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        return granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const onStartRecord = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (!isRecording) {
      const path = `${RNFS.DocumentDirectoryPath}/hello.wav`;
      await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener((e) => console.log('recording', e));
      setIsRecording(true);
    } else {
      console.warn('Recording already in progress.');
    }
  };

  const genAI = new GoogleGenerativeAI("AIzaSyBWKs7RsQpiPXZZlyLs3WHujHak44BuH0Q");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const Answer = async (t) => {
    try {
      const newMessage = {
        id: messages.length + 1,
        date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        type: 'out',
        message: t,
        image: null,
      };
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: "user", parts: [{ text: t, date: newMessage.date, image: newMessage.image }] },
      ]);
      const validChatHistory = chatHistory.filter(item => item && item.parts);
      const chat = model.startChat({
        safetySettings,
        history: validChatHistory.map((item) => ({
          role: item.role,
          parts: item.parts.map((part) => part.fileData ? { fileData: part.fileData } : { text: part.text }),
        })),
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
      });

      const result = await chat.sendMessage([{ text: t }]);
      const response = await result.response;
      const text = await response.text();
      const jsonStart = text.indexOf('```json');
      const jsonEnd = text.lastIndexOf('```');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonText = text.substring(jsonStart + 7, jsonEnd);
        jsonText = jsonText.replace(/[\u0000-\u001F]+/g, "");
        try {
          const json = JSON.parse(jsonText);
          if (json.emergency) {
            text = json.message;
            navigation.navigate('Emergency', { lastPrompt: t, aiResponse: text });
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }

      const aiMessage = {
        id: messages.length + 2,
        date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        type: 'in',
        message: text.replace(/\*\*(.*?)\*\*/g, '#$1#'),
      };

      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: 'model', parts: [{ text, date: aiMessage.date }] },
      ]);

      const msg = text.replace(/\*\*(.*?)\*\*/g, '');
      return msg;
    } catch (error) {
      console.error('Error sending text message:', error);
      return 'Error sending message. Please try again.';
    }
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    setIsLoading(true);
  
    setTimeout(async () => {
      const filePath = result;
      const formData = new FormData();
      formData.append('audio', {
        uri: `file://${filePath}`,
        type: 'audio/wav',
        name: 'audio.wav',
      });
  
      try {
        const response = await fetch('http://icare-server.us.to/audio-receiver', {
          method: 'POST',
          body: formData,
          timeout: 60000
        });
        const data = await response.json();
  
        console.log('Audio receiver response:', data);
  
        if (data.transcript) {
          try {
            const answerText = await Answer(data.transcript);
            const ttsResponse = await fetch('http://151.80.93.105:3301/synthesize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: answerText }),
            });
  
            // Handle the TTS synthesis response
            const ttsData = await ttsResponse.json();
  
            console.log('TTS synthesis response:', ttsData);
  
            if (ttsData.audio_base64) {
              // Step 3: Save and play the synthesized audio
              const base64audio = ttsData.audio_base64;
              const localFilePath = `${RNFS.DocumentDirectoryPath}/returned.mp3`;
              await RNFS.writeFile(localFilePath, base64audio, 'base64');
              setAudioPath(localFilePath);
              setIsLoading(false);
  
              const sound = new Sound(localFilePath, '', (error) => {
                if (error) {
                  console.log('Failed to load the sound', error);
                  return;
                }
                soundRef.current = sound;
                sound.play(() => {
                  setIsPlaying(false);
                  sound.release();
                });
                setIsPlaying(true);
              });
            } else {
              console.error('Failed to get TTS audio');
              setIsLoading(false);
            }
          } catch (error) {
            console.error('Error fetching TTS data:', error);
            setIsLoading(false);
          }
        } else {
          console.error('Failed to get transcript');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
        setIsLoading(false);
      }
    }, 1000);
  };
  
  

  const onStopPlay = () => {
    if (soundRef.current) {
      soundRef.current.stop(() => setIsPlaying(false));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.titleText, {textAlign: 'left', width: '100%', marginTop: 0, marginBottom: 50, fontSize: 26}]}>ICARE</Text>
      <View style={styles.section1}>
        <Animated.View style={{ transform: [{ scale: ringScaleAnim1 }], ...styles.ring, opacity: 1}}>
          <Animated.View style={{ transform: [{ scale: ringScaleAnim2 }], ...styles.ring, opacity: 0.75 }}>
            <Animated.View style={{ transform: [{ scale: ringScaleAnim3 }], ...styles.ring, opacity: 0.5 }}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={styles.audioButton}
                  onPressIn={onStartRecord}
                  onPressOut={onStopRecord}
                >
                  {isLoading ? (
                    <LottieView source={require('../animations/processing.json')} autoPlay loop style={[styles.audioButtonImage, { height: 140 }]} />
                  ) : (
                    isPlaying ? (
                      <LottieView source={require('../animations/speaking.json')} autoPlay loop style={[styles.audioButtonImage, { height: 140 }]} />
                    ) : (
                      <Image
                        style={[styles.audioButtonImage, { height: 100 }, !isPlaying && { tintColor: 'white' }]}
                        source={require('../images/mic.png')}
                      />
                    )
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
      {!isPlaying && (<Text style={styles.titleText}>Hold the mic button and start speaking</Text>)}
      
      {isPlaying && (
        <View style={styles.stopButtonContainer}>
          <TouchableOpacity onPress={onStopPlay} style={{ width: 60, backgroundColor: '#4445ea', height: 40, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontFamily: 'Blogger Sans-Medium' }}>STOP</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        <TouchableOpacity onPress={() => navigation.navigate("NearbyHospitalsMap")}>
          <View style={styles.quickResponseButton}>
            <Text style={styles.quickResponseButtonText}>Show nearby hospitals</Text>
            
          </View>
        </TouchableOpacity>
        <View style={styles.quickResponseButton}>
          <TouchableOpacity onPress={() =>navigation.navigate("Emergency", {vibrate: false})}>
            <Text style={styles.quickResponseButtonText}>Emergency!</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    paddingTop: 20,
  },
  section1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  audioButton: {
    backgroundColor: 'rgba(68, 69, 234, 0.85)',
    borderRadius: 360,
    height: 200,
    width: 200,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    marginBottom: 20,
  },
  audioButtonImage: {
    width: 100,
    tintColor: '#4445ea',
  },
  titleText: {
    color: '#4445ea',
    fontSize: 18,
    fontFamily: 'Blogger Sans-Bold',
    marginBottom: 10,
  },
  quickResponseButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickResponseButtonText: {
    color: '#4445ea',
    fontFamily: 'Blogger Sans-Medium',
    backgroundColor: 'rgba(0,0,0, 0.1)',
    padding: 15,
    borderRadius: 10,
  },
  stopButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 150,
  },
  ring: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4.5,
    borderColor: '#4445ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
});

export default HomeScreen;
