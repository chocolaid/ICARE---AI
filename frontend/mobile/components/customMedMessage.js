import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Alert, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomMedMessage = ({ navigation }) => {
    const [inputMessage, setInputMessage] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadMessage = async () => {
            try {
                const savedMessage = await AsyncStorage.getItem('emergencyMessage');
                if (savedMessage !== null) {
                    setInputMessage(savedMessage);
                }
            } catch (error) {
                console.error("Error loading message", error);
            } finally {
                fadeIn();
            }
        };

        loadMessage();
    }, []);

    const saveMessage = async () => {
        try {
            await AsyncStorage.setItem('emergencyMessage', inputMessage);
            Alert.alert("Success", "Emergency message saved successfully!");
        } catch (error) {
            console.error("Error saving message", error);
            Alert.alert("Error", "Failed to save the emergency message.");
        }
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
                        <Text style={{ fontFamily: 'Blogger Sans-Medium', fontSize: 18, color: 'white', width: '100%', textAlign: 'center', marginTop: 20, marginBottom: 20 }}>Custom Emergency Message</Text>
                    </View>
                    <View style={{ flex: 1, height: '100%', position: 'relative' }}>
                        <View style={{ backgroundColor: '#d3d3f2', marginHorizontal: 10, marginVertical: 10, borderRadius: 10, padding: 10 }}>
                            <Text style={{ fontFamily: 'Blogger Sans-Bold', fontSize: 16, color: '#4445ea' }}>What's this?</Text>
                            <Text style={{ color: '#616161' }}>The message you input here will be sent to your Emergency Contacts whenever an Emergency mode is triggered.</Text>
                        </View>
                        <View style={{ justifyContent: 'center', marginHorizontal: 10, elevation: 2, marginVertical: 10, backgroundColor: 'white', borderRadius: 10, position: 'relative', paddingVertical: 10 }}>
                                <View style={{ padding: 10, marginTop: 10 }}>
                                <Text style={{ fontFamily: 'Blogger Sans-Bold', fontSize: 16, color: '#4445ea', marginBottom: 10 }}>Message</Text>
                                <TextInput
                                    style={{ padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }}
                                    value={inputMessage}
                                    onChangeText={setInputMessage}
                                    placeholder="what would you like to say to your emergency contacts?"
                                    multiline
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={saveMessage}>
                                <Text style={styles.buttonText}>Save Message</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

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
});

export default CustomMedMessage;
