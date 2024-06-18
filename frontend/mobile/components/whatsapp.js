import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Whatsapp = ({ route }) => {
    const { phone } = route.params;
    const chatKey = phone.replace("+", "").replace(/ /g, "") + "@c.us";
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [whatsappLinked, setWhatsappLinked] = useState(false);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const storedSessionId = await AsyncStorage.getItem('sessionId');
                if (storedSessionId) {
                    setSessionId(storedSessionId);
                    await checkSession(storedSessionId);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error retrieving sessionId from storage:', error);
                setLoading(false);
            }
        };

        initializeSession();
    }, []);

    const checkSession = async (storedSessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`http://151.80.93.105:3300/check-session?sessionId=${storedSessionId}`);
            const data = await response.json();
            if (data.authenticated) {
                setWhatsappLinked(true);
                setSessionId(storedSessionId);
                fetchMessages(storedSessionId);
            } else {
                setWhatsappLinked(false);
                setSessionId(null);
                await AsyncStorage.removeItem('sessionId');
                alert('Session expired, please re-link your WhatsApp account.');
            }
        } catch (error) {
            console.error('Error checking session:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId) => {
        try {
            const response = await fetch(`http://151.80.93.105:3300/get-messages?sessionId=${sessionId}&chatId=${chatKey}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (inputMessage.trim()) {
            try {
                const response = await fetch('http://151.80.93.105:3300/send-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        number: chatKey,
                        message: inputMessage
                    }),
                });
                if (response.ok) {
                    setInputMessage('');
                    fetchMessages(sessionId);
                } else {
                    const errorData = await response.json();
                    console.error('Error sending message:', errorData.error);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.messageContainer} key={item.id || index}>
            <Text>{item.body}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : whatsappLinked ? (
                <>
                    <FlatList
                        data={messages}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        renderItem={renderItem}
                    />
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            placeholder="Type a message"
                        />
                        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                            <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <Text>Please link your WhatsApp account.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    messageContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    sendButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginLeft: 10,
    },
    sendButtonText: {
        color: '#fff',
    },
});

export default Whatsapp;
