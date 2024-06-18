import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Switch, Alert, Modal, Button} from "react-native";
import { auth } from '../firebaseConfig';
import CheckBox from '@react-native-community/checkbox';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { useNavigation } from "@react-navigation/native";
import Emergency from "./e"

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;
const formatText = (text) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, (c) => c.toUpperCase());
  };

export default function Settings() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGyroscopeEnabled, setIsGyroscopeEnabled] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [defaultMessageModalVisible, setDefaultMessageModalVisible] = useState(false);
    const [defaultMessagingOption, setDefaultMessagingOption] = useState(null);
    const [incidentOptions, setIncidentOptions] = useState({
        sendMessageToContacts: false,
        callNearestHospitals: false,
        doNothing: false,
        messageNearestHospitals: false,
    });
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const database = getDatabase();
                const userRef = ref(database, "users/" + user.uid);
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    setUserData(data);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        const loadSettings = async () => {
            try {
                const gyroValue = await AsyncStorage.getItem('isGyroscopeEnabled');
                if (gyroValue !== null) {
                    setIsGyroscopeEnabled(JSON.parse(gyroValue));
                }
                const notifValue = await AsyncStorage.getItem('notificationsEnabled');
                if (notifValue !== null) {
                    setNotificationsEnabled(JSON.parse(notifValue));
                }
                const incidentOptionsValue = await AsyncStorage.getItem('incidentOptions');
                if (incidentOptionsValue !== null) {
                    setIncidentOptions(JSON.parse(incidentOptionsValue));
                }
                const defaultMessageValue = await AsyncStorage.getItem('defaultMessagingOption');
                if (defaultMessageValue !== null) {
                    setDefaultMessagingOption(defaultMessageValue);
                }
            } catch (error) {
                console.error("Error loading settings", error);
            }
        };

        loadSettings();

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem('isGyroscopeEnabled', JSON.stringify(isGyroscopeEnabled));
            } catch (error) {
                console.error("Error saving settings", error);
            }
        };

        saveSettings();
        let subscription;
        return () => subscription && subscription.remove();
    }, [isGyroscopeEnabled]);

    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
            } catch (error) {
                console.error("Error saving settings", error);
            }
        };

        saveSettings();
    }, [notificationsEnabled]);

    useEffect(() => {
        const saveIncidentOptions = async () => {
            try {
                await AsyncStorage.setItem('incidentOptions', JSON.stringify(incidentOptions));
            } catch (error) {
                console.error("Error saving incident options", error);
            }
        };

        saveIncidentOptions();
    }, [incidentOptions]);

    const toggleGyro = () => setIsGyroscopeEnabled(previousState => !previousState);
    const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigation.navigate('Login'); // navigate to login screen after logout
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const handleDeleteData = async () => {
        try {
            // Delete user data from Firebase Realtime Database
            const database = getDatabase();
            const user = auth.currentUser;
            if (user) {
                const userRef = ref(database, "users/" + user.uid);

                // Optionally, delete user authentication data
                try {
                    await user.delete();
                    await remove(userRef);
                } catch (error) {
                    Alert.alert("Error deleting account", 'Please re-login to delete ');

                    navigation.navigate('Login');
                }
            }
        } catch (error) {
            console.error("Error deleting data", error);
        }
    };

    const handleIncidentOptionChange = (option) => {
        setIncidentOptions((prevOptions) => {
            if (option === 'doNothing') {
                return {
                    sendMessageToContacts: false,
                    callNearestHospitals: false,
                    doNothing: !prevOptions.doNothing,
                    messageNearestHospitals: false,
                };
            } else {
                return {
                    ...prevOptions,
                    [option]: !prevOptions[option],
                    doNothing: false,
                };
            }
        });
    };
    const handleDefaultMessageOptionChange = async (option) => {
        setDefaultMessagingOption(option);
        await AsyncStorage.setItem('defaultMessagingOption', option);
        setDefaultMessageModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.userInfoBg}>
                <Text style={{ width: '100%', textAlign: 'center', marginBottom: 15, fontSize: 20, color: 'white', fontFamily: 'Blogger Sans-Bold' }}>Settings</Text>
                <Text style={{ color: 'white', fontSize: 18, fontFamily: 'BloggerSans', marginBottom: 5 }}>{loading ? 'Loading...' : userData ? userData.fullName : 'Guest'}</Text>
                <Text style={{ color: 'white', fontSize: 18, fontFamily: 'BloggerSans', marginBottom: 5 }}>{loading ? 'Loading...' : userData ? userData.email : 'Guest.email@icare.com.ng'}</Text>
                <Text style={{ color: 'white', fontSize: 18, fontFamily: 'BloggerSans' }}>{loading ? 'Loading...' : userData ? userData.phone || '' : 'No number added'}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => navigation.navigate('LinkWhatsapp')}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={styles.optionIcon} source={require('../images/whatsapp.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={styles.optionText}>Link Whatsapp Account</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Add to the messaging options.</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <View style={[styles.sectionOption, { flexDirection: 'row', width: '100%' }]}>
                        <Image style={styles.optionIcon} source={require('../images/gyroscope.png')} />
                        <View style={{ display: 'flex', flexDirection: 'column', width: '95%' }}>
                            <View style={{ display: 'flex', flexDirection: 'row' }}>
                                <Text style={[styles.optionText, { flex: 1 }]}>Accident Detection (Not Perfect Yet).</Text>
                                <Switch style={{ marginRight: 20 }}
                                    trackColor={{ false: "#d6d6d6", true: "#4445ea" }}
                                    thumbColor={isGyroscopeEnabled ? "#ffffff" : "#ffffff"}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={toggleGyro}
                                    value={isGyroscopeEnabled}
                                />
                            </View>
                            <View>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Advisable to turn on while driving.</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    <View style={[styles.sectionOption, { flexDirection: 'row', width: '100%' }]}>
                        <Image style={styles.optionIcon} source={require('../images/notification.png')} />
                        <View style={{ display: 'flex', flexDirection: 'column', width: '95%' }}>
                            <View style={{ display: 'flex', flexDirection: 'row' }}>
                                <Text style={[styles.optionText, { flex: 1 }]}>Enable Notifications</Text>
                                <Switch style={{ marginRight: 20 }}
                                    trackColor={{ false: "#d6d6d6", true: "#4445ea" }}
                                    thumbColor={notificationsEnabled ? "#ffffff" : "#ffffff"}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={toggleNotifications}
                                    value={notificationsEnabled}
                                />
                            </View>
                            <View>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Receive notifications for important updates.</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={styles.optionIcon} source={require('../images/incident.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={styles.optionText}>Incident Options</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Tell us what to do when there's an Emergency.</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                <TouchableOpacity onPress={() => navigation.navigate('MedicalRecord')}>
                    <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                        <Image style={styles.optionIcon} source={require('../images/health-record.png')} />
                        <View style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text style={styles.optionText}>Medical Record</Text>
                            <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Add or edit your medical record.</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => navigation.navigate('customMedMessage')}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={styles.optionIcon} source={require('../images/contact.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={styles.optionText}>Emergency Contacts</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Add or Modify your Emergency Contacts</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setDefaultMessageModalVisible(true)}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={styles.optionIcon} source={require('../images/messageOPT.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={styles.optionText}>Default Messaging Option</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Choose between Whatsapp and SMS. Whatsapp messages go through our servers</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity onPress={handleLogout}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={[styles.optionIcon, { tintColor: 'red' }]} source={require('../images/logout.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={[styles.optionText, { color: 'red' }]}>Logout</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Sign out of your account.</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity onPress={handleDeleteData}>
                        <View style={[styles.sectionOption, { alignItems: 'center' }]}>
                            <Image style={[styles.optionIcon, { tintColor: 'red' }]} source={require('../images/delete.png')} />
                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={[styles.optionText, { color: 'red' }]}>Delete Data</Text>
                                <Text lineBreakMode="tail" style={{ marginLeft: 5, color: '#616161', fontSize: 14, fontFamily: 'BloggerSans' }}>Delete your account and data.</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Incident Options</Text>
                        <ScrollView>
                            {Object.keys(incidentOptions).map((option) => (
                                <TouchableOpacity key={option} onPress={() => handleIncidentOptionChange(option)} style={styles.checkboxContainer}>
                                    <CheckBox
                                        value={incidentOptions[option]}
                                        onValueChange={() => handleIncidentOptionChange(option)}
                                        style={styles.checkbox}
                                    />
                                    <Text style={styles.checkboxLabel}>{formatText(option)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button title="Close" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
            <Modal
    animationType="slide"
    transparent={true}
    visible={defaultMessageModalVisible}
    onRequestClose={() => {
        setDefaultMessageModalVisible(!defaultMessageModalVisible);
    }}
>
    <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Default Messaging Option</Text>
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleDefaultMessageOptionChange('whatsapp')}>
                <CheckBox
                    value={defaultMessagingOption === 'whatsapp'}
                    onValueChange={() => handleDefaultMessageOptionChange('whatsapp')}
                />
                <Text style={styles.checkboxLabel}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleDefaultMessageOptionChange('sms')}>
                <CheckBox
                    value={defaultMessagingOption === 'sms'}
                    onValueChange={() => handleDefaultMessageOptionChange('sms')}
                />
                <Text style={styles.checkboxLabel}>SMS</Text>
            </TouchableOpacity>
            <Button title="Close" onPress={() => setDefaultMessageModalVisible(false)} />
        </View>
    </View>
</Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        backgroundColor: '#e0e0e0',
    },
    userInfoBg: {
        backgroundColor: '#4544EA',
        height: height / 4.7,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: height / 30,
        paddingLeft: width * 0.04
    },
    section: {
        backgroundColor: 'white',
        marginVertical: 2,
        marginBottom: 1,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    sectionOption: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    optionIcon: {
        height: 30,
        width: 30,
        marginHorizontal: 3.5,
        tintColor: '#000000'
    },
    optionText: {
        color: '#000000',
        fontSize: 16,
        margin: 5,
        fontFamily: 'Blogger Sans-Medium',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'Blogger Sans-Bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        margin: 8,
        fontFamily: 'BloggerSans',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontFamily: 'BloggerSans-Bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        marginRight: 10,
    },
    checkboxLabel: {
        fontSize: 16,
        fontFamily: 'BloggerSans',
    },
});
