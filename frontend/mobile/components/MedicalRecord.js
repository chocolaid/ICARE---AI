import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, Animated, Easing, Modal, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker'; 
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const MedicalRecord = () => {
    const navigation = useNavigation(); // Get navigation object
    const [medicalRecord, setMedicalRecord] = useState({
        fullName: '',
        dob: '',
        bloodType: '',
        allergies: [],
        medications: [],
        emergencyContactName: '',
        emergencyContactNumber: '',
        history: [],
        pastMedicalHistory: [],
        familyHistory: [],
        socialHistory: '',
        physicalExam: {
            height: '',
            weight: '',
            bloodPressure: '',
            pulse: '',
            temperature: '',
            respiration: '',
            generalAppearance: '',
            headAndNeck: '',
            respiratory: '',
            cardiovascular: '',
            gastrointestinal: '',
            musculoskeletal: '',
            neurological: '',
            skin: ''
        },
        treatmentNotes: [],
        labResults: [],
        imagingStudies: []
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [animations, setAnimations] = useState({
        allergies: new Animated.Value(0),
        medications: new Animated.Value(0),
        history: new Animated.Value(0),
        pastMedicalHistory: new Animated.Value(0),
        familyHistory: new Animated.Value(0),
        treatmentNotes: new Animated.Value(0),
        labResults: new Animated.Value(0),
        imagingStudies: new Animated.Value(0)
    });
    const [showBloodTypePicker, setShowBloodTypePicker] = useState(false);
    const [selectedBloodType, setSelectedBloodType] = useState('');
    const [showEditModal, setShowEditModal] = useState(false); // Modal for editing a record
    const [editingField, setEditingField] = useState(''); // Field being edited
    const [editingIndex, setEditingIndex] = useState(null); // Index of the field being edited
    const [editingValue, setEditingValue] = useState(''); // Current value of the field being edited
    const [recordSaved, setRecordSaved] = useState(false); // Flag to indicate if record is saved
    const scrollRef = useRef(null); // Ref to access the ScrollView

    useEffect(() => {
        const loadMedicalRecord = async () => {
            try {
                const record = await AsyncStorage.getItem('medicalRecord');
                if (record !== null) {
                    const parsedRecord = JSON.parse(record);
                    setMedicalRecord(parsedRecord);
                    initializeAnimations(parsedRecord);
                    setSelectedBloodType(parsedRecord.bloodType);
                    setRecordSaved(true); // Record loaded successfully
                }
            } catch (error) {
                console.error("Error loading medical record", error);
            }
        };

        loadMedicalRecord();
    }, []);

    const initializeAnimations = (record) => {
        const newAnimations = { ...animations };
        Object.keys(record).forEach(field => {
            if (Array.isArray(record[field]) && record[field].length > 0) {
                newAnimations[field] = new Animated.Value(1);
            }
        });
        setAnimations(newAnimations);
    };

    const handleChange = (name, value) => {
        setMedicalRecord({
            ...medicalRecord,
            [name]: value
        });
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            handleChange('dob', formattedDate);
        }
    };

    const handleSubmit = async () => {
        try {
            await AsyncStorage.setItem('medicalRecord', JSON.stringify(medicalRecord));
            Alert.alert("Success", "Medical record saved successfully!");
            setRecordSaved(true); // Record saved successfully
        } catch (error) {
            console.error("Error saving medical record", error);
        }
    };

    const addField = (field) => {
        const newRecord = { ...medicalRecord };
        newRecord[field].push('');
        setMedicalRecord(newRecord);

        Animated.timing(animations[field], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.bounce
        }).start();
    };

    const removeField = (field, index) => {
        const newRecord = { ...medicalRecord };
        newRecord[field].splice(index, 1);
        setMedicalRecord(newRecord);

        Animated.timing(animations[field], {
            toValue: newRecord[field].length > 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.bounce
        }).start();
    };

    const renderFieldInputs = (field) => {
        return medicalRecord[field].map((item, index) => (
            <Animated.View key={index} style={[styles.animatedContainer, { opacity: animations[field] }]}>
                <View style={styles.fieldRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={`Enter ${field} ${index + 1}`}
                        value={item}
                        onChangeText={(text) => {
                            const newRecord = { ...medicalRecord };
                            newRecord[field][index] = text;
                            setMedicalRecord(newRecord);
                        }}
                    />
                    <TouchableOpacity onPress={() => removeField(field, index)}>
                        <Ionicons name="remove-circle-outline" size={24} color="#ff5c5c" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        setEditingField(field);
                        setEditingIndex(index);
                        setEditingValue(item);
                        setShowEditModal(true);
                    }}>
                        <Ionicons name="create-outline" size={24} color="#4544EA" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        ));
    };

    // Function to render sections with a title and a field input
    const renderSection = (title, field, addLabel, addAction) => {
        return (
            <View style={styles.card}>
                <Text style={styles.cardHeader}>{title}</Text>
                {renderFieldInputs(field)}
                <TouchableOpacity style={styles.addFieldButton} onPress={addAction}>
                    <Ionicons name="add-circle-outline" size={24} color="#4544EA" />
                    <Text style={styles.addFieldButtonText}>{addLabel}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Function to render physical exam details
    const renderPhysicalExam = () => {
        const examFields = Object.keys(medicalRecord.physicalExam);
        return (
            <View style={styles.card}>
                <Text style={styles.cardHeader}>Physical Examination</Text>
                {examFields.map((field) => (
                    <View style={styles.inputContainer} key={field}>
                        <Text style={styles.label}>{field}</Text>
                        <TextInput
                            style={[styles.input, { height: 50 }]} 
                            placeholder={`Enter ${field}`}
                            value={medicalRecord.physicalExam[field]}
                            onChangeText={(text) => handleChange(`physicalExam.${field}`, text)}
                            multiline={true} 
                            numberOfLines={3} 
                        />
                    </View>
                ))}
            </View>
        );
    };

    // Function to render the blood type picker
    const renderBloodTypePicker = () => {
        return (
            <Picker
                selectedValue={selectedBloodType}
                onValueChange={(itemValue) => {
                    setSelectedBloodType(itemValue);
                    handleChange('bloodType', itemValue);
                }}
                style={styles.picker}
            >
                <Picker.Item label="Select Blood Type" value="" />
                <Picker.Item label="A+" value="A+" />
                <Picker.Item label="A-" value="A-" />
                <Picker.Item label="B+" value="B+" />
                <Picker.Item label="B-" value="B-" />
                <Picker.Item label="AB+" value="AB+" />
                <Picker.Item label="AB-" value="AB-" />
                <Picker.Item label="O+" value="O+" />
                <Picker.Item label="O-" value="O-" />
            </Picker>
        );
    };

    // Function to handle editing a field
    const handleEditField = () => {
        const newRecord = { ...medicalRecord };
        newRecord[editingField][editingIndex] = editingValue;
        setMedicalRecord(newRecord);
        setShowEditModal(false);
    };

    // Function to navigate to another screen
    const navigateToAnotherScreen = () => {
        navigation.navigate('OtherScreen');
    };

    return (
        <LinearGradient colors={['#e0eafc', '#cfdef3']} style={styles.gradient}>
            <ScrollView contentContainerStyle={styles.container} ref={scrollRef}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Medical Record</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Personal Information</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Full Name"
                            value={medicalRecord.fullName}
                            onChangeText={(text) => handleChange('fullName', text)}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                            <Text style={styles.dateText}>{medicalRecord.dob || "Select Date"}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Blood Type</Text>
                        <TouchableOpacity onPress={() => setShowBloodTypePicker(!showBloodTypePicker)} style={styles.dateInput}>
                            <Text style={styles.dateText}>{selectedBloodType || "Select Blood Type"}</Text>
                        </TouchableOpacity>
                        {showBloodTypePicker && renderBloodTypePicker()}
                    </View>
                </View>
                {renderSection("Allergies", 'allergies', "Add Allergy", () => addField('allergies'))}
                {renderSection("Medications", 'medications', "Add Medication", () => addField('medications'))}
                {renderSection("Medical History", 'history', "Add Medical History", () => addField('history'))}
                {renderSection("Past Medical History", 'pastMedicalHistory', "Add Past Medical History", () => addField('pastMedicalHistory'))}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Family History</Text>
                    {renderFieldInputs('familyHistory')}
                    <TouchableOpacity style={styles.addFieldButton} onPress={() => addField('familyHistory')}>
                        <Ionicons name="add-circle-outline" size={24} color="#4544EA" />
                        <Text style={styles.addFieldButtonText}>Add Family History</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Social History</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Social History</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            placeholder="Enter Social History (e.g., Occupation, Lifestyle, Habits)"
                            value={medicalRecord.socialHistory}
                            onChangeText={(text) => handleChange('socialHistory', text)}
                            multiline={true}
                            numberOfLines={5}
                        />
                    </View>
                </View>
                {renderPhysicalExam()}
                {renderSection("Treatment Notes", 'treatmentNotes', "Add Treatment Notes", () => addField('treatmentNotes'))}
                {renderSection("Lab Results", 'labResults', "Add Lab Results", () => addField('labResults'))}
                {renderSection("Imaging Studies", 'imagingStudies', "Add Imaging Studies", () => addField('imagingStudies'))}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Emergency Contact</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contact Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Emergency Contact Name"
                            value={medicalRecord.emergencyContactName}
                            onChangeText={(text) => handleChange('emergencyContactName', text)}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contact Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Emergency Contact Number"
                            value={medicalRecord.emergencyContactNumber}
                            onChangeText={(text) => handleChange('emergencyContactNumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                {/* Modal for editing a field */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showEditModal}
                    onRequestClose={() => setShowEditModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Field</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder={`Edit ${editingField}`}
                                value={editingValue}
                                onChangeText={(text) => setEditingValue(text)}
                                multiline={true}
                                numberOfLines={3}
                            />
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalButton}>
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleEditField} style={styles.modalButton}>
                                    <Text style={styles.modalButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Align elements to opposite ends
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4544EA',
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4544EA',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    input: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        backgroundColor: '#fff',
    },
    dateInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        justifyContent: 'center',
        paddingLeft: 10,
        backgroundColor: '#fff',
    },
    dateText: {
        color: '#333',
    },
    button: {
        backgroundColor: '#4544EA',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addFieldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    addFieldButtonText: {
        color: '#4544EA',
        fontSize: 16,
        marginLeft: 5,
    },
    animatedContainer: {
        overflow: 'hidden',
        marginBottom: 10,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between' // Align elements to opposite ends
    },
    picker: {
        height: 50,
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        backgroundColor: '#fff',
        marginBottom: 15
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        backgroundColor: '#fff',
        marginBottom: 15,
        textAlignVertical: 'top'
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    modalButton: {
        backgroundColor: '#4544EA',
        padding: 10,
        borderRadius: 5,
        width: '40%',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
    navButton: {
        backgroundColor: '#4544EA',
        padding: 10,
        borderRadius: 5,
    },
    navButtonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
    savedMessage: {
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
    },
    savedText: {
        color: 'green',
        fontSize: 16,
    },
});

export default MedicalRecord;