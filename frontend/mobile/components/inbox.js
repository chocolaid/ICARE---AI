import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Dimensions, TextInput, Image, TouchableOpacity, FlatList } from "react-native";
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from "firebase/auth";
import { useNavigation } from '@react-navigation/native';

const Inbox = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const db = getDatabase();
                const userId = getAuth().currentUser.uid; // Assuming you're using Firebase Authentication
                const messagesRef = ref(db, `chats/${userId}`);
                onValue(messagesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const messagesArray = Object.keys(data).map(key => ({
                            id: key,
                            ...data[key]
                        }));
                        setMessages(messagesArray);
                        setFilteredMessages(messagesArray);
                    } else {
                        console.log("No data available");
                    }
                });
            } catch (error) {
                console.error("Error fetching messages: ", error);
            }
        };

        fetchMessages();

        // Cleanup function to remove listeners
        return () => {
            // Detach listeners or perform any necessary cleanup
        };
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            setFilteredMessages(messages.filter(message => 
                message.name.toLowerCase().includes(query.toLowerCase()) ||
                message.description.toLowerCase().includes(query.toLowerCase())
            ));
        } else {
            setFilteredMessages(messages); // Reset to all messages when search is cleared
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                {/* <View style={styles.searchInputContainer}>
                    <TextInput 
                        placeholder="Search messages" 
                        style={styles.searchInput} 
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View> */}
                <Text style={[styles.title, {textAlign: 'left', width: '100%', marginTop: 0, marginBottom: 0, fontSize: 26}]}>Inbox</Text>
            </View>

            <View style={styles.chatListContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatScreen', { chatKey: 'Jarvis' })}>
                    <View style={styles.chatContainer}>
                        <Image style={[styles.chatImage, {height: 45, width: 45}]} source={require('../images/ai.png')} />
                        <View style={styles.chatInfo}>
                            <Text style={styles.chatName}>Jarvis</Text>
                            <Text style={styles.chatDescription}>Chat with Jarvis, a medical assistant.</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CanceRx', { chatKey: 'Jarvis' })}>
                    <View style={styles.chatContainer}>
                        <Image style={[styles.chatImage, {height: 45, width: 45}]} source={require('../images/ai.png')} />
                        <View style={styles.chatInfo}>
                            <Text style={styles.chatName}>CanceRx</Text>
                            <Text style={styles.chatDescription}>Your AI Partner in Cancer Detection.</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <FlatList
                    data={filteredMessages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('ChatScreen', { chatKey: item.key })}>
                            <View style={styles.chatContainer}>
                                <Image style={styles.chatImage} source={{ uri: item.image }} /> {/* Assuming image is stored as a URL in Firebase */}
                                <View style={styles.chatInfo}>
                                    <Text style={styles.chatName}>{item.name}</Text>
                                    <Text style={styles.chatDescription}>{item.description}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
};

export default Inbox;


const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    searchBar: {
        justifyContent: "center",
        alignItems: 'center',
        marginHorizontal: 10,
        marginVertical: 20,
    },
    title: {
        color: '#4445ea',
        fontSize: 18,
        fontFamily: 'Blogger Sans-Bold',
    },
    searchInputContainer: {
        backgroundColor: 'white',
        width: Dimensions.get('window').width / 1.05,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        borderRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        paddingVertical: 10,
        paddingHorizontal: 20,
        
    },
    searchInput: {
        padding: 2,
    },
    chatListContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    chatContainer: {
        display: 'flex', 
        flexDirection: 'row', 
        padding: 10, 
        alignItems: 'center'
    },
    chatInfo:{
        display: 'flex',
        flexDirection: 'column'
    },
    chatImage:{
        height: 50,
        width: 50,
        marginRight: 15
    },
    chatName:{
        fontSize: 18,
        fontFamily: 'Blogger Sans-Bold'
    },
    chatDescription:{
        fontSize: 14,
        color: '#616161',
        fontFamily: 'Blogger Sans-Medium'
    }
});