import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const CanceRx = () => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    saveMessages();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const selectImage = () => {
    launchImageLibrary({ mediaTypes: 'photo', includeBase64: true }, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const selectedImage = response.assets[0];
        setImage(selectedImage);
        await handleSend(selectedImage);
      }
    });
  };

  const handleSend = async (selectedImage = null) => {
    if (newMsg.trim() || selectedImage) {
      let newMessage = {
        id: messages.length + 1,
        date: new Date().toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        type: 'out',
        message: newMsg,
        image: selectedImage ? `data:${selectedImage.type};base64,${selectedImage.base64}` : null,
      };
  
      setMessages([...messages, newMessage]);
      setNewMsg('');
      setInputHeight(40);
      flatListRef.current?.scrollToEnd({ animated: true });
      setImage(null);
  
      if (selectedImage) {
        try {
          setLoading(true);
  
          const base64Image = selectedImage.base64;
          const response = await axios.post('https://uncommon-ladybird-amazing.ngrok-free.app/predict', base64Image, {
            headers: { 'Content-Type': 'application/octet-stream' },
          });
  
          const prediction = response.data.prediction;
  
          const responseMessage = {
            id: messages.length + 2,
            date: new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }),
            type: 'in',
            message: `${prediction}`,
          };
  
          setMessages((prevMessages) => [...prevMessages, responseMessage]);
        } catch (error) {
          console.error('Error uploading image:', error);
          setError('Error uploading image. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };


  const renderItem = ({ item }) => {
    if (item.image) {
      return (
        <View style={item.type === 'in' ? styles.responseBubble : styles.userBubble}>
          <Image source={{ uri: item.image }} style={styles.imageMessage} />
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      );
    }
    return (
      <View style={item.type === 'in' ? styles.responseBubble : styles.userBubble}>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    );
  };

  return (
    
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
        <View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 5, elevation: 1, backgroundColor: 'white', paddingBottom: 5 }}>
            <Image style={styles.chatImage} source={require('../images/ai.png')} /> 
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>CanceRx</Text>
              <Text style={styles.chatDescription}>You're chatting with an AI</Text>
            </View>
          </View>
        </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 180, height: 100, marginBottom: 10, borderRadius: 10, position: 'absolute', right: Dimensions.get('window').width * 0.25, bottom: 60 }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSend} onPress={selectImage}>
          <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'Blogger Sans-Medium' }}>Select Image</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffffff',
  },
  messagesContainer: {
    padding: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputs: {
    flex: 1,
    marginRight: 5,
  },
  btnSend: {
    backgroundColor: '#4445ea',
    padding: 10,
    borderRadius: 50,
    width: '100%'
  },
  iconSend: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  userBubble: {
    backgroundColor: '#4445ea',
    padding: 2,
    borderRadius: 10,
    marginVertical: 5,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  responseBubble: {
    backgroundColor: '#d1d1d1',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Blogger Sans-Medium',
  },
  
  chatInfo: {
    display: 'flex',
    flexDirection: 'column'
},
chatImage: {
    height: 35,
    width: 35,
    marginRight: 15
},
chatName: {
    fontSize: 20,
    fontFamily: 'Blogger Sans-Bold'
},
chatDescription: {
    fontSize: 14,
    color: '#616161',
    fontFamily: 'Blogger Sans-Medium'
},
});

export default CanceRx;
