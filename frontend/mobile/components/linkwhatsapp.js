import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Clipboard, Linking, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, set, onValue, update } from 'firebase/database';
import { auth } from '../firebaseConfig';
import LottieView from 'lottie-react-native';
import { modalStyles } from '../styles/login'; // Make sure you have your modal styles defined

export default function LinkWhatsapp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [whatsappLinked, setWhatsappLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  const handlePress = () => {
    Linking.openURL('http://icare-server.us.to/tc?whatsapp');
  };

  const createSession = async () => {
    if (phoneNumber.trim() === '') {
      Alert.alert('Error', 'Phone number cannot be empty');
      return;
    }

    try {
      setIsLoading(true); 
      const response = await fetch('http://151.80.93.105:3300/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phonenumber: phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        setSessionId(data.sessionId);
        setCode(data.code);
        await AsyncStorage.setItem('sessionId', data.sessionId);
        const db = getDatabase();
        const userRef = ref(db, 'users/' + auth.currentUser.uid);
        update(userRef, {
            phone: phoneNumber,
        });
      } else {
        console.error('Failed to create session:', data.error);
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(code);
  };

  const checkSession = async (storedSessionId) => {
    try {
      setIsLoading(true); 
      const response = await fetch(`http://151.80.93.105:3300/check-session?sessionId=${storedSessionId}`);
      const data = await response.json();
      if (data.authenticated) {
        setWhatsappLinked(true);
        setSessionId(storedSessionId);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  const deleteSession = async () => {
    try {
      setIsLoading(true);
      const storedSessionId = await AsyncStorage.getItem('sessionId');
      if (storedSessionId) {
        const response = await fetch('http://151.80.93.105:3300/delete-session', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: storedSessionId }),
        });

        if (response.ok) {
          await AsyncStorage.removeItem('sessionId');
          setWhatsappLinked(false);
          setShowForm(true);
          Alert.alert('Success', 'WhatsApp session deleted!');
        } else {
          const errorData = await response.json();
          console.error('Failed to delete session:', errorData.error);
          Alert.alert('Error', 'Failed to delete session.');
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert('Error', 'Failed to delete session.');
    } finally {
      setIsLoading(false); 
    }
  };

  // useEffect for initial loading
  useEffect(() => {
    const retrieveSessionId = async () => {
      try {
        const storedSessionId = await AsyncStorage.getItem('sessionId');
        if (storedSessionId) {
          setSessionId(storedSessionId);
        }
      } catch (error) {
        console.error('Error retrieving sessionId from storage:', error);
      } finally {
        setIsLoading(false); 
      }
    };

    retrieveSessionId(); 
  }, []);

  // useEffect for checking session validity
  useEffect(() => {
    if (sessionId) { 
      checkSession(sessionId); 
    }
  }, [sessionId]); 

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.description}>
          Our team at I-CARE has developed an application interface (API) that integrates the web version of WhatsApp on our server, enabling a bot to perform essential actions seamlessly.
        </Text>
        <Text style={styles.description}>
          By linking your WhatsApp account to the I-CARE app, you agree to our
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.link}> Terms and Conditions.</Text>
          </TouchableOpacity>
        </Text>
      </View>

      {/* Conditionally render form based on 'showForm' state */}
      {showForm && ( 
        <View style={styles.form}>
          <Text style={styles.title}>Link your WhatsApp account to ICARE</Text>
          <Text>Input your WhatsApp number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholderTextColor="#757575"
              inputMode="tel"
              style={styles.input}
              placeholder="+2348000000000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
          <TouchableOpacity style={styles.linkButton} onPress={createSession}>
            <Text style={styles.linkButtonText}>Link</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WhatsApp Linked Message */}
      {whatsappLinked && ( 
        <View style={styles.linkedMessage}>
          <Text style={styles.linkedText}>WhatsApp linked successfully!</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteSession}>
            <Text style={styles.deleteButtonText}>Delete Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Conditionally render code container based on 'code' state */}
      {code && ( 
        <>
        <View style={styles.innerContainer}>
        <Text style={styles.description}>After linking please remain in the whatsapp app till you get a message from yourself confirming a successful link</Text>
      </View>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>Your code: {code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Text style={styles.copyButtonText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
        </>
        
      )}

      {/* Loading Modal */}
      <Modal animationType="slide" transparent visible={isLoading}> 
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <LottieView 
              source={require('../animations/loading.json')} 
              autoPlay 
              loop 
              style={modalStyles.lottie} 
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  description: {
    fontSize: 12,
    marginBottom: 10,
    color: '#333',
  },
  link: {
    color: '#4544EA',
    fontWeight: 'bold',
    fontSize: 12,
  },
  form: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Blogger Sans-Bold',
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 10,
  },
  inputContainer: {
    width: '90%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
  },
  linkButton: {
    backgroundColor: '#6464ed',
    paddingHorizontal: 80,
    paddingVertical: 15,
    borderRadius: 12,
  },
  linkButtonText: {
    color: 'white',
    fontFamily: 'Blogger Sans-Bold',
    fontSize: 16,
  },
  codeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  codeText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#6464ed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  copyButtonText: {
    color: 'white',
    fontFamily: 'Blogger Sans-Bold',
    fontSize: 16,
  },
  linkedMessage: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#e0f2f7',
    padding: 15,
    borderRadius: 10,
  },
  linkedText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: 'Blogger Sans-Bold',
    fontSize: 16,
  },
});
