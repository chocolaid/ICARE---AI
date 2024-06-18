import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, ImageBackground, Dimensions } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { auth } from '../firebaseConfig';
import { styles } from '../styles/chat';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Buffer } from 'buffer';
import axios from 'axios';
import { defaultChat } from './chathistory';
import getMedicalRecordAsString from './getMedicalRecord';
import { useNavigation } from '@react-navigation/native';
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const MEDICAL_RECORD_INDEX = 13;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
export default function Chat({ route }) {
  const { chatKey } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState(defaultChat); 
  const flatListRef = useRef(null);
  const [isNewChat, setIsNewChat] = useState(true); 
  const [image, setImage] = useState(null); 
  const [error, setError] = useState(null); 
  const navigation = useNavigation();

  

  const genAI = new GoogleGenerativeAI("AIzaSyBWKs7RsQpiPXZZlyLs3WHujHak44BuH0Q");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async function GetImageResponse(image, message) {
    function fileToGenerativePart(img, mimeType) {
      return {
        inlineData: {
          data: img,
          mimeType,
        },
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    const prompt = message;
    const imageParts = [fileToGenerativePart(image.base64, image.type)];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text().length > 0 ? response.text() : "Hmm.. I didn't get that.";
  }

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(`chatHistory-${chatKey}`);
        if (storedHistory) {
          try {
            let parsedHistory = JSON.parse(storedHistory);
            const medicalRecordString = await getMedicalRecordAsString();
            
            // Insert or update the medical record at the specified index
            parsedHistory = insertOrUpdateMedicalRecord(parsedHistory, medicalRecordString);

            const messagesFromHistory = parsedHistory.slice(14).map((item, index) => ({
              id: index + 1,
              date: item.parts[0].date,
              type: item.role === 'user' ? 'out' : 'in',
              message: item.parts[0].text,
              image: item.parts[0].image ? item.parts[0].image : null,
            }));

            setChatHistory(parsedHistory);
            setMessages(messagesFromHistory);
          } catch (parseError) {
            console.error('Error parsing chat history:', parseError);
            setError('Error loading chat history. Please try again.');
          }
        } else {
          setChatHistory([...defaultChat]);
        }
      } catch (storageError) {
        console.error('Error loading chat history from storage:', storageError);
        setError('Error loading chat history. Please try again.');
      }
    };

    loadChatHistory();
  }, [chatKey]);

 insertOrUpdateMedicalRecord = (history, medicalRecordString) => {
    const medicalRecord = {
      role: 'user',
      parts: [{ text: `this is my medical record please ignore if no medical record found.${medicalRecordString}` }],
    };
    if (history[MEDICAL_RECORD_INDEX] && history[MEDICAL_RECORD_INDEX].role === 'user' && 
        history[MEDICAL_RECORD_INDEX].parts[0].text.startsWith('this is my medical record')) {
      history[MEDICAL_RECORD_INDEX] = medicalRecord;
    } else {
      history.splice(MEDICAL_RECORD_INDEX, 0, medicalRecord);
    }

    return history;
  };

  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        await AsyncStorage.setItem(`chatHistory-${chatKey}`, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Error saving chat history:', error);
        setError('Error saving chat history. Please try again.');
      }
    };

    saveChatHistory(); 
  }, [chatHistory]);

  async function handleSend() {
    if (newMsg.trim() || image) {
      let newMessage;
      if (image) {
        try {
          setIsTyping(true);
          const formData = new FormData();
          formData.append('image', {
            uri: image.uri,
            type: image.type,
            name: image.fileName,
          });
  
          const uploadResponse = await axios.post('http://151.80.93.105:3001/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          const { uri, mimeType, pic } = uploadResponse.data;
          newMessage = {
            id: messages.length + 1,
            date: new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }),
            type: 'out',
            message: newMsg,
            image: pic ? pic : null,
          };
  
          setMessages([...messages, newMessage]);
          setNewMsg('');
          setIsTyping(false);
          setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: "user", parts: [{ text: newMsg, date: newMessage.date, image: newMessage.image, fileData: { mimeType: mimeType, fileUri: uri } }] }
          ]);
          setInputHeight(40);
          setImage(null);
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Error sending image. Please try again.');
        }
      } else {
        newMessage = {
          id: messages.length + 1,
          date: new Date().toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }),
          type: 'out',
          message: newMsg,
          image: image ? image.uri : null,
        };
  
        setMessages([...messages, newMessage]);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: "user", parts: [{ text: newMsg, date: newMessage.date, image: newMessage.image }] }
        ]);
        setNewMsg('');
        setInputHeight(40);
        flatListRef.current?.scrollToEnd({ animated: true });
      }

      if (chatKey === 'Jarvis') {
        try {
          setIsTyping(true);
          const validChatHistory = chatHistory.filter(item => item && item.parts);
          const chat = model.startChat({
            safetySettings,
            history: validChatHistory.map((item) => ({
              role: item.role,
              parts: item.parts.map((part) => {
                if (part.fileData) {
                  return { fileData: part.fileData };
                } else {
                  return { text: part.text };
                }
              }),
            })),
            generationConfig: {
              temperature: 1,
              topP: 0.95,
              topK: 64,
              maxOutputTokens: 8192,
            },
          });
      
          const result = await chat.sendMessage([{ text: newMsg }]);
          const response = await result.response;
          let text = response.text();
          const jsonStart = text.indexOf('```json');
          const jsonEnd = text.lastIndexOf('```');
      
          if (jsonStart !== -1 && jsonEnd !== -1) {
            let jsonText = text.substring(jsonStart + 7, jsonEnd);
            jsonText =  jsonText.replace(/[\u0000-\u001F]+/g, "");
            try {

              const json = JSON.parse(jsonText);
              if (json.emergency) {
                console.log('This is a huge emergency trigger some shit bro lol fuck it')
                navigation.navigate('Emergency', {lastPrompt: newMsg});
                text = json.message;
              }
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
          const aiMessage = {
            id: messages.length + 2,
            date: new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }),
            type: 'in',
            message: text.replace(/\*\*(.*?)\*\*/g, '#$1#'),
          };
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
          setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: 'model', parts: [{ text, date: aiMessage.date }] }
          ]);
          setIsTyping(false);
          setIsNewChat(false);
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.error('Error sending text message:', error);
          setError('Error sending message. Please try again.');
        }
      }
    }
  }
  

  const renderDate = (date, type) => {
    const timeStyle = type === 'in' ? styles.timeIn : styles.timeOut;
    return <Text style={[timeStyle, {position: 'absolute', right: 5, bottom: 5, marginLeft: 20, marginTop: 10}]}>{date}</Text>;
  };

  const openImageLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaTypes: 'photo', 
        allowsEditing: true,
        includeBase64: true,
        aspect: [4, 3], 
        quality: 1,        
      });

      if (result.assets) {
        setImage(result.assets[0]); 
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setInputHeight(40);
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
    >
      <View style={styles.container}>
        <View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 5, elevation: 1, backgroundColor: 'white', paddingBottom: 5 }}>
            <Image style={styles.chatImage} source={require('../images/ai.png')} /> 
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Jarvis</Text>
              <Text style={styles.chatDescription}>You're chatting with an AI</Text>
            </View>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 10 }}
          data={isTyping ? [...messages, { id: 'typing', type: 'in', message: 'Typing...' }] : messages} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            
            let inMessage = item.type === 'in';
            let itemStyle = inMessage ? styles.itemIn : styles.itemOut; // Define itemStyle here

            if (item.image) {
              return (
                <View style={[styles.item, itemStyle]}> 
                  <View style={[styles.balloon, {padding: 2}]}>
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: 200, height: 200, resizeMode: 'cover', borderRadius: 18 }}
                    />
                  </View>
                  {renderDate(item.date, item.type)}
                </View>
              );
            }
            if (item.id === 'typing') {
              return (
                <View style={[styles.item, styles.itemIn]}>
                  <View style={styles.balloon}>
                    <ActivityIndicator size="small" color="#616161" />
                  </View>
                  
                </View>
              );
            }
            return (
              <View style={[styles.item, itemStyle]}>
                <View style={[styles.balloon]}>
                  {item.message.split(/(\#|\*\*)(.*?)(\#|\*\*)/g).map((part, index) => {
                    if (index % 4 === 0) {
                      return (
                        <Text key={index} style={{ color: inMessage ? '#616161' : 'white', fontFamily: 'Blogger Sans-Medium' }}>{part}</Text>
                      );
                    } else if (index % 4 === 2) {
                      return (
                        <Text key={index} style={{ fontWeight: '900', color: inMessage ? '#616161' : 'white', fontFamily: 'BloggerSans' }}>{part}</Text>
                      );
                    } else {
                      return null;
                    }
                  })}
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {image && (
            <Image
              source={{ uri: image.uri }}
              style={{ width: 180, height: 100, marginBottom: 10, borderRadius: 10, position: 'absolute', right: Dimensions.get('window').width * 0.25, bottom: 60 }}
            />
          )}
        <View style={styles.footer}>
          
          <View style={[styles.inputContainer, { height: Math.min(inputHeight, 150) }]}>
            <TextInput
              style={[styles.inputs, { height: Math.min(inputHeight, 150) }]}
              placeholder="Write a message..."
              underlineColorAndroid="transparent"
              value={newMsg}
              multiline={true}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              onChangeText={(msg) => setNewMsg(msg)}
            />
            <TouchableOpacity onPress={openImageLibrary}>
              <Image style={{ height: 25, width: 25, tintColor: '#4544EA', marginRight: 5 }} source={require('../images/upload_image.png')} /> 
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnSend} onPress={handleSend}>
            <Image
              resizeMode="cover"
              source={require('../images/send.png')} 
              style={styles.iconSend}
            />
          </TouchableOpacity>
        </View>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );

}
export {safetySettings}