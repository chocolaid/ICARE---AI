import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  View,
  Text,
  Vibration,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import LottieView from "lottie-react-native";
import GetLocation from 'react-native-get-location';
import axios from 'axios';
import { styles } from "../styles/e";
import {Linking} from 'react-native'
import { modalStyles } from "../styles/login";

function Emergency({ route }) {
  const [incidentOptions, setIncidentOptions] = useState({
    sendMessageToContacts: false,
    callNearestHospitals: false,
    doNothing: false,
    messageNearestHospitals: false,
});
  const [emergencyContacts, setEmergencyContacts] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentOption, setCurrentOption] = useState(null);
  const [timer, setTimer] = useState(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const [optionQueue, setOptionQueue] = useState([]);
  const [buttonScale] = useState(new Animated.Value(1));
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCyjxgCh_Q8aDAApAVUmpVfwxfoBBjYe4Q'; 
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [hospitalContacts, setHospitalContacts] = useState(null);
  const [preferredMessagingMethod, setPreferredMessagingMethod] = useState('whatsapp'); 
  const [whatsappLinked, setWhatsappLinked] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userAddress, setUserAdress] = useState(null);
  const [addressLink, setAddressLink] = useState(null)
  const { vibrate, lastPrompt } = route.params;

  const loading = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };
  useEffect(() => {
    if (vibrate || null){
        Vibration.vibrate([0, 15000, 0]);
    }
    const fetchInitialData = async () => {
      try {
        const options = await AsyncStorage.getItem('incidentOptions');
        if (options !== null) {
          setIncidentOptions(JSON.parse(options));
        } else {
          setIncidentOptions('No data found');
        }

        const contacts = await AsyncStorage.getItem('emergencyContacts');
        if (contacts !== null) {
          setEmergencyContacts(JSON.parse(contacts));
        } else {
          setEmergencyContacts({ name: '911', number: '911' });
        }

        const messagingMethod = await AsyncStorage.getItem('defaultMessagingOption');
        setPreferredMessagingMethod(messagingMethod || 'whatsapp');

        const location = await GetLocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 60000,
        });
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (messagingMethod === 'whatsapp' || !messagingMethod) {
          const storedSessionId = await AsyncStorage.getItem('sessionId');
          if (storedSessionId) {
            setSessionId(storedSessionId);
            await checkWhatsappSession(storedSessionId);
          }
        }
      } catch (error) {
        console.error(error);
        setIncidentOptions('Error fetching data');
        setEmergencyContacts('Error fetching contacts');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (incidentOptions) {
      const initialQueue = Object.keys(incidentOptions).filter(
        (option) => incidentOptions[option] && option !== 'doNothing'
      );

      if (initialQueue.length === 0 || incidentOptions['doNothing']) {
        setCountdownActive(false);
      } else {
        setOptionQueue(initialQueue);
        setCountdownActive(true);
      }
    }
  }, [incidentOptions]);

  useEffect(() => {
    if (countdownActive) {
      const countdownInterval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(countdownInterval);
            startEmergencySequence();
          }
          return prevTimer - 1;
        });
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [countdownActive]);

  useEffect(() => {
    if (currentOption !== null) {
      handleOption(currentOption);
    }
  }, [currentOption]);

  const checkWhatsappSession = async (storedSessionId) => {
    try {
      const response = await fetch(`http://151.80.93.105:3300/check-session?sessionId=${storedSessionId}`);
      const data = await response.json();
      if (data.authenticated) {
        setWhatsappLinked(true);
        setSessionId(storedSessionId);
      } else {
        setWhatsappLinked(false);
        setSessionId(null);
        await AsyncStorage.removeItem('sessionId');
        alert('WhatsApp session expired, please re-link your account.');
      }
    } catch (error) {
      console.error('Error checking WhatsApp session:', error);
    }
  };

  const handleOption = (option) => {
    switch (option) {
      case 'sendMessageToContacts':
        loading()
        sendMessageToContacts();
        break;
      case 'callNearestHospitals':
        loading()
        callNearestHospitals();
        break;
      case 'doNothing':
        Vibration.vibrate([500, 500, 500]);
        triggerNextOption();
        break;
      case 'messageNearestHospitals':
        loading()
        messageNearestHospitals();
        break;
      default:
        break;
    }
  };



  async function fetchUserLocation() {
    try {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
      });
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      return userLocation;
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert(
        'Location Error',
        'Failed to retrieve current location. Please make sure location services are enabled and try again.'
      );
      return null;
    }
  }

  async function fetchHospitalContacts(location) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=1000&type=hospital&key=${GOOGLE_MAPS_API_KEY}`
      );
      const operationalHospitals = response.data.results.filter(
        hospital => hospital.business_status === 'OPERATIONAL'
      );
      const hospitalsWithDetails = await Promise.all(operationalHospitals.map(async hospital => {
        const detailsResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&key=${GOOGLE_MAPS_API_KEY}`
        );
        return {
          ...hospital,
          phone: detailsResponse.data.result.international_phone_number || null,
        };
      }));
      setHospitalContacts(hospitalsWithDetails);
      return hospitalsWithDetails;
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  }

const linkShortener = async (link)  => {
    try {
        const response = await fetch('https://smolurl.com/api/links', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: link })
        });
  
        if (!response.ok) {
          console.error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        const nl = data.data.short_url
        return nl
      } catch (error) {
        console.error(error.message);
      }
}
  useEffect(()=>{
    const getAddressFromCoordinates = async (lat, lng, apiKey) => {
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        
        try {
          const response = await fetch(geocodingUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.status !== "OK") {
            throw new Error(`Geocoding error! Status: ${data.status}`);
          }
      
          const address = data.results[0]?.formatted_address;
          const locationLink = await linkShortener(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      
          return {
            address,
            locationLink
          };
        } catch (error) {
          console.error('Error fetching address:', error);
          return null;
        }
      };

      getAddressFromCoordinates(userLocation.latitude, userLocation.longitude, GOOGLE_MAPS_API_KEY).then(result => {
        if (result) {
            setUserAdress(result.address)
            setAddressLink(result.locationLink)
          console.log('Address:', result.address);
          console.log('Location Link:', result.locationLink);
        } else {
          console.log('Failed to get address.');
        }
      });
    
  }, [userLocation])
const Emessage = `Emergency: Please send help to ${userAddress}.\n Details: Message From Icare App.\n Location: ${userAddress}.\n Additional Information: ${lastPrompt? lastPrompt : "Emergency mode Triggered"}.\n Location Link: ${addressLink}.\n What's this?\nIcare is an Emergency service app.`
  const sendMessageToContacts = async (loop) => {
    hideModal()
    try {
      if (preferredMessagingMethod === 'whatsapp' && whatsappLinked) {
        for (const contact of emergencyContacts) {
          await sendWhatsappMessage(contact.number, Emessage);
        }
        Alert.alert("Message sent to contacts via WhatsApp.");
      } else {
        for (const contact of emergencyContacts) {
          await sendSMS(contact.number, Emessage);
                
        }
        Alert.alert("Message sent to contacts via SMS.");
      }
    } catch (error) {
      console.error('Error sending message to contacts:', error);
      Alert.alert("Error sending message. Please try again later.");
    } finally {
      triggerNextOption(loop);
    }
  };

  const callNearestHospitals = async (loop) => {
    const userLocation = await fetchUserLocation();
    hideModal()
    if (userLocation) {
        const hospitals = await fetchHospitalContacts(userLocation); // Fetch hospitals
        console.log(hospitals);
        if (hospitals && hospitals.length > 0) {
            
            for (const hospital of hospitals) {
                if (hospital.phone) {
                    await Linking.openURL(`tel:${hospital.phone}`);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay

                    const userResponse = await new Promise((resolve) => {
                        Alert.alert(
                            "Call Next Hospital",
                            "Do you want to call the next hospital?",
                            [
                                { text: "No", onPress: () => resolve(false) },
                                { text: "Yes", onPress: () => resolve(true) }
                            ],
                            { cancelable: false }
                        );
                    });

                    if (!userResponse) {
                        break; // Exit the loop if the user does not want to continue
                    }
                }
            }
        }
    }

    triggerNextOption(loop);
};


  const messageNearestHospitals = async (loop) => {
    try {
        hideModal()
      const userLocation = await fetchUserLocation(); // Get user location

      console.log(`User location: ${userLocation.longitude} ${userLocation.latitude}`)

      if (userLocation) {
        const hospitals = await fetchHospitalContacts(userLocation); // Fetch hospitals
        console.log(hospitals)

    if (hospitals && hospitals.length > 0) {

        if (preferredMessagingMethod === 'whatsapp' && whatsappLinked) {
            for (const hospital of hospitals) {
                if (hospital.phone) {
                    await sendWhatsappMessage(hospital.phone, Emessage);
                }
            }
        } else {
            const phoneNumbers = hospitals
                .filter(hospital => hospital.phone)
                .map(hospital => hospital.phone.replace(/\s+/g, ''))
                .join(',');

            if (phoneNumbers) {
                await sendSMS(phoneNumbers, `
                Emergency Alert...
                Emergency: Please send help to ${userAddress}.
                Details: Message From Icare,
                Location: ${userAddress}
                Additional Information: ${lastPrompt? lastPrompt : "Emergency mode Triggered"}
                Location Link: ${addressLink}
                What's this? Icare is an Emergency response provider.
                `);
            }
        }

        Alert.alert("Message sent to nearest hospitals.");
    } else {
        Alert.alert("No operational hospitals found nearby.");
    }

      }
    } catch (error) {
      console.error('Error sending messages to hospitals:', error);
      Alert.alert("Error sending messages to hospitals. Please try again later.");
    } finally {
      triggerNextOption(loop);
    }
  };

  const sendWhatsappMessage = async (phoneNumber, message) => {
    try {
      const response = await fetch('http://151.80.93.105:3300/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          number: phoneNumber.replace("+", "").replace(/ /g, "") + "@c.us",
          message: message
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error sending WhatsApp message:', errorData.error);
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const sendSMS = async (phoneNumber, message) => {
    try {
      const response = await fetch('http://151.80.93.105:3301/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          body: message,
          from: 'IcareNG',
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('SMS sent successfully:', data);
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert("Error sending SMS. Please try again later.");
    }
  };
  

  const doNothing = () => {};

  const triggerNextOption = (loop) => {
    if (loop && optionQueue.length > 0) {
      setCurrentOption(optionQueue.shift());
    } else {
      setCurrentOption(null);
      setCountdownActive(false);
    }
  };

  const startEmergencySequence = () => {
    if (optionQueue.length > 0) {
      setCurrentOption(optionQueue.shift());
    } else {
      doNothing();
    }
  };

  const cancelEmergencySequence = () => {
    setCountdownActive(false);
    setTimer(10);
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOptionPress = (option) => {
    handleButtonPress();
    console.log(option)
    if(option == 'messageNearestHospitals'){
        console.log('Messaging Nearby Hospitals')
        messageNearestHospitals(false);
    }
    if(option == 'sendMessageToContacts'){
        console.log('Messaging Nearby Hospitals')
        sendMessageToContacts(false);
    }
    if(option == 'callNearestHospitals'){
        console.log('Messaging Nearby Hospitals')
        callNearestHospitals(false);
    }
    if (countdownActive) {
      setCurrentOption(option);
      cancelEmergencySequence();
    }
  };
  const formatText = (text) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <>
      <StatusBar backgroundColor="rgba(100, 0, 20, 1)" />
      <View style={styles.container}>
  {incidentOptions === null && !countdownActive ? (
    <Text style={styles.loadingText}>Loading...</Text>
  ) : (
    <>
      {!countdownActive && ( // Only show buttons when countdown is inactive
        <View style={[styles.optionsContainer, { width: '100%' }]}>
          {Object.keys(incidentOptions)
            .filter((option) => option !== 'doNothing') // Filter out 'doNothing'
            .map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, { alignItems: 'center', width: '80%' }]}
                onPress={() => handleOptionPress(option)}
              >
                <Text
                  style={[
                    styles.OptionsText,
                    {
                      color: 'black',
                      fontFamily: 'Blogger Sans-Medium',
                      width: '100%',
                      textAlign: 'center',
                      marginTop: 8,
                    },
                  ]}
                >
                  {formatText(option)}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
      {countdownActive && (
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownTimer, {fontFamily: 'Blogger Sans-Medium'}]}>Emergency sequence starting in:</Text>
          <Text style={styles.countdownTitle}>{timer}</Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 15,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
            onPress={cancelEmergencySequence}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {!countdownActive && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownTitle}>No options selected.</Text>
        </View>
      )}
    </>
  )}
  <Modal animationType='slide' transparent visible={isModalVisible} onRequestClose={hideModal}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <LottieView source={require('../animations/loading.json')} autoPlay loop style={modalStyles.lottie} />
          </View>
        </View>
      </Modal>
</View>
    </>
  );
}
export default Emergency;