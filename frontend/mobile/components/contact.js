import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Alert, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome for minus icon

const EmergencyContactForm = () => {
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [newContactName, setNewContactName] = useState('');
    const [newContactNumber, setNewContactNumber] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const storedContacts = await AsyncStorage.getItem('emergencyContacts');
                if (storedContacts !== null) {
                    setEmergencyContacts(JSON.parse(storedContacts));
                }
            } catch (error) {
                console.error("Error loading contacts", error);
            } finally {
                fadeIn();
            }
        };

        loadContacts();
    }, []);

    const saveContacts = async () => {
        try {
            await AsyncStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
            Alert.alert("Success", "Emergency contacts saved successfully!");
        } catch (error) {
            console.error("Error saving contacts", error);
            Alert.alert("Error", "Failed to save the emergency contacts.");
        }
    };

    const addContact = () => {
        if (newContactName.trim() === '' || newContactNumber.trim() === '') {
            Alert.alert("Incomplete Information", "Please enter both name and phone number.");
            return;
        }

        const newContact = { name: newContactName, number: newContactNumber };
        setEmergencyContacts([...emergencyContacts, newContact]);
        setNewContactName('');
        setNewContactNumber('');
    };

    const removeContact = (index) => {
        const updatedContacts = [...emergencyContacts];
        updatedContacts.splice(index, 1);
        setEmergencyContacts(updatedContacts);
    };

    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <Animated.View style={{ backgroundColor: 'white', display: 'flex', flexDirection: 'column', height: '100%', opacity: fadeAnim }}>
                    <View style={{ backgroundColor: '#4445ea' }}>
                        <Text style={{ fontFamily: 'Blogger Sans-Medium', fontSize: 18, color: 'white', width: '100%', textAlign: 'center', marginTop: 20, marginBottom: 20 }}>Emergency Contacts</Text>
                    </View>
                    <View style={{ flex: 1, height: '100%', position: 'relative' }}>
                        <View style={{ backgroundColor: '#d3d3f2', marginHorizontal: 10, marginVertical: 10, borderRadius: 10, padding: 10 }}>
                            <Text style={{ fontFamily: 'Blogger Sans-Bold', fontSize: 16, color: '#4445ea' }}>What's this?</Text>
                            <Text style={{ color: '#616161' }}>Add your emergency contacts here. They'll receive a message when an emergency mode is triggered.</Text>
                        </View>
                        <View style={{ justifyContent: 'center', marginHorizontal: 10, elevation: 2, marginVertical: 10, backgroundColor: 'white', borderRadius: 10, position: 'relative', paddingVertical: 10 }}>
                            <View style={{ padding: 10, marginTop: 10 }}>
                                <Text style={{ fontFamily: 'Blogger Sans-Bold', fontSize: 16, color: '#4445ea', marginBottom: 10 }}>Add a New Contact</Text>
                                <View style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
                                    <TextInput
                                        style={{ flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '100%' }}
                                        value={newContactName}
                                        onChangeText={setNewContactName}
                                        placeholder="Name"
                                    />
                                    <TextInput
                                        style={{ flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '100%' }}
                                        value={newContactNumber}
                                        onChangeText={setNewContactNumber}
                                        placeholder="Phone Number (e.g., +2348027329153)"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <TouchableOpacity style={styles.addContactButton} onPress={addContact}>
                                    <Text style={styles.addContactButtonText}>Add Contact</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 10, marginTop: 10 }}>
                                <Text style={{ fontFamily: 'Blogger Sans-Bold', fontSize: 16, color: '#4445ea', marginBottom: 10 }}>Your Emergency Contacts</Text>
                                {emergencyContacts.map((contact, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16 }}>{contact.name} - {contact.number}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeContact(index)}>
                                            <FontAwesome name="minus-circle" size={25} color="#ff0000" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.button} onPress={saveContacts}>
                                <Text style={styles.buttonText}>Save Contacts</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4445ea',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        marginHorizontal: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    addContactButton: {
        backgroundColor: '#4445ea', 
        padding: 10, 
        borderRadius: 5, 
        alignItems: 'center', 
        justifyContent: 'center' // Center text within the button
    },
    addContactButtonText: {
        color: 'white', 
        fontSize: 16, 
        fontWeight: 'bold' 
    }
});

export default EmergencyContactForm;