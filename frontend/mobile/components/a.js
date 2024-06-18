import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { styles } from '../styles/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { defaultChat } from './chathistory';
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

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

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(`chatHistory-${chatKey}`);
        if (storedHistory) {
          setChatHistory(JSON.parse(storedHistory));
          const messagesFromHistory = JSON.parse(storedHistory).slice(8).map((item, index) => ({
            id: index + 1,
            date: item.parts[0].date,
            type: item.role === 'user' ? 'out' : 'in',
            message: item.parts[0].text,
            image: item.parts[0].image ? item.parts[0].image : null,
          }));
          setMessages(messagesFromHistory);
        } else {
          setChatHistory([...chatHistory]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [chatKey]);

  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        await AsyncStorage.setItem(`chatHistory-${chatKey}`, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };

    saveChatHistory();
  }, [chatHistory]);

  const handleSend = async () => {
    if (newMsg.trim() || image) {
      if (image) {
        try {
          setIsTyping(true);

          // Upload the image to the server
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

          const { uri, mimeType } = uploadResponse.data;

          // Generate response using the uploaded image URL
          const result = await model.generateContent([
            {
              fileData: {
                mimeType,
                fileUri: uri
              }
            },
            { text: newMsg || "Describe the image with a creative description." },
          ]);

          const response = result.response.text();

          const aiMessage = {
            id: messages.length + 1,
            date: new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }),
            type: 'in',
            message: response,
            image: uri,  // Store the image URL in the message object
          };

          setMessages((prevMessages) => [...prevMessages, aiMessage]);
          setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: 'model', parts: [{ text: response, date: aiMessage.date, image: uri }] },
          ]);

          setIsTyping(false);
          setImage(null);
        } catch (error) {
          console.error('Error processing image:', error);
          setIsTyping(false);
        }
      } else {
        // Handle text messages
        const newMessage = {
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
        setChatHistory([...chatHistory, { role: "user", parts: [{ text: newMsg, date: newMessage.date, image: newMessage.image }] }]);
        setNewMsg('');
        setInputHeight(40);
        flatListRef.current?.scrollToEnd({ animated: true });

        if (chatKey === 'Jarvis') {
          try {
            setIsTyping(true);

            const chat = model.startChat({
              safetySettings,
              history: chatHistory.map((item) => ({
                role: item.role,
                parts: item.parts.map((part) => ({
                  text: part.text,
                })),
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
            const text = response.text();

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
            setChatHistory((prevHistory) => [...prevHistory, { role: 'model', parts: [{ text, date: aiMessage.date }] }]);
            setIsTyping(false);
            setIsNewChat(false);
            flatListRef.current?.scrollToEnd({ animated: true });
          } catch (error) {
            console.error('Error sending text message:', error);
            setIsTyping(false);
          }
        }
      }
    }
  };

  const renderDate = (date, type) => {
    const timeStyle = type === 'in' ? styles.timeIn : styles.timeOut;
    return <Text style={timeStyle}>{date}</Text>;
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
      Keyboard.dismiss();
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
        data={messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.type === 'in' ? styles.messageIn : styles.messageOut]}>
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <Text style={styles.messageText}>{item.message}</Text>
            {renderDate(item.date, item.type)}
          </View>
        )}
      />
      {isTyping && <ActivityIndicator size="large" color="#0000ff" />}
      <View style={styles.footer}>
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={{ width: 100, height: 100, marginBottom: 10, borderRadius: 10 }}
            />
          )}
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
      </View>
    </KeyboardAvoidingView>
  );
}
