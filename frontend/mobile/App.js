import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, StatusBar, Image, Alert, PermissionsAndroid, Vibration } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import SplashScreen1 from './components/splash';
import { auth } from './firebaseConfig';
import Login from './components/login';
import HomeScreen from './components/home';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import HealthNewsScreen from './components/HealthNewsScreen'; 
import FullNewsScreen from './components/FullNewsScreen';
import Inbox from './components/inbox';
import Chat from './components/chat';
import Settings from './components/settings';
import LinkWhatsapp from './components/linkwhatsapp';
import TermsAndCondition from './components/tc';
import NearbyHospitalsMap from './components/NearbyHospitalsMap';
import Map from './components/map';
import Whatsapp from './components/whatsapp';
import MedicalRecord from './components/MedicalRecord';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer, Gyroscope, Barometer, Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Emergency from './components/e';
import * as Notifications from 'expo-notifications';
import EmergencyContactForm from './components/contact';
import SplashScreen from 'react-native-splash-screen';
import Cancerx from './components/cancerx';
import CalibrationScreen from './components/caliberationScreen';
import BackgroundFetch from 'react-native-background-fetch';

// Constants
const ACCELERATION_THRESHOLD = 1.8; 
const ANGULAR_VELOCITY_THRESHOLD = 0.5; 
const BAROMETER_DROP_THRESHOLD = 5; 
const FILTER_FACTOR = 0.1;
const TIME_THRESHOLD_FOR_RAPID_DROP = 0.5; 
const GOOGLE_MAPS_API_KEY = 'AIzaSyCyjxgCh_Q8aDAApAVUmpVfwxfoBBjYe4Q';
const MAGNETOMETER_THRESHOLD = 5;
const RAPID_MAGNETIC_CHANGE_THRESHOLD = 10;
const CALIBRATION_DATA_KEY = 'calibrationData';

// Sensor Data Functions
function lowPassFilter(data, previousValue = { x: 0, y: 0, z: 0 }) {
  return {
    x: previousValue.x * (1 - FILTER_FACTOR) + data.x * FILTER_FACTOR,
    y: previousValue.y * (1 - FILTER_FACTOR) + data.y * FILTER_FACTOR,
    z: previousValue.z * (1 - FILTER_FACTOR) + data.z * FILTER_FACTOR,
  };
}

function calculateAccelMagnitude(accelerometerData) {
  return Math.sqrt(
    accelerometerData.x * accelerometerData.x +
    accelerometerData.y * accelerometerData.y +
    accelerometerData.z * accelerometerData.z
  );
}

function calculateAngularVelocity(gyroscopeData) {
  return Math.sqrt(
    gyroscopeData.x * gyroscopeData.x +
    gyroscopeData.y * gyroscopeData.y +
    gyroscopeData.z * gyroscopeData.z
  );
}

function calculateMagneticFieldMagnitude(magnetometerData) {
  return Math.sqrt(
    magnetometerData.x * magnetometerData.x +
    magnetometerData.y * magnetometerData.y +
    magnetometerData.z * magnetometerData.z
  );
}

function calculateLateralAcceleration(accelerometerData) {
  return Math.sqrt(accelerometerData.x * accelerometerData.x + accelerometerData.y * accelerometerData.y); 
}

function calculateYawRate(gyroscopeData) {
  return gyroscopeData.z;
}

// Place Details Fetching
const fetchPlaceDetails = async (placeId, apiKey) => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching place details: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error_message) {
      throw new Error(`Error fetching place details: ${data.error_message}`);
    }
    
    return data.result;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
};

// Vehicle Detection
async function isUserInVehicle(gpsData) {
  try {
    if (gpsData.speed > 10) { 
      return true;
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted.');
        return false;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const placeId = location.placeId;
      const placeDetails = await fetchPlaceDetails(placeId, GOOGLE_MAPS_API_KEY);
      
      if (placeDetails && placeDetails.types && placeDetails.types.includes('route')) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error getting location or Place Details:', error);
    return false;
  }
}

// Default Calibration Data
const DEFAULT_CALIBRATION_DATA = {
  avgAccel: 1.0,
  avgGyro: 0.1,
  avgBaro: 1013.25, 
  avgMag: 50,
  location: { latitude: 0, longitude: 0 }, 
};

// Accident Detection
function detectAccident(
  previousBarometerPressure,
  timeSinceLastBarometerReading,
  previousAccident,
  previousMagneticField,
  timeSinceLastMagneticReading,
  magneticFieldChangeThreshold,
  gpsData,
  previousGpsData,
  calibrationData
) {
  let isAccident = false;
  let adjustedAccelerationThreshold = ACCELERATION_THRESHOLD;
  let adjustedAngularVelocityThreshold = ANGULAR_VELOCITY_THRESHOLD;
  let adjustedBarometerDropThreshold = BAROMETER_DROP_THRESHOLD;
  let adjustedMagneticFieldChangeThreshold = magneticFieldChangeThreshold;

  if (previousAccident) {
    adjustedAccelerationThreshold *= 1.2;
    adjustedAngularVelocityThreshold *= 1.2;
  } else {
    adjustedAccelerationThreshold = ACCELERATION_THRESHOLD;
    adjustedAngularVelocityThreshold = ANGULAR_VELOCITY_THRESHOLD;
  }
  if (calibrationData) {
    adjustedAccelerationThreshold -= (calibrationData.avgAccel * 0.1); 
    adjustedAngularVelocityThreshold -= (calibrationData.avgGyro * 0.05);
    adjustedBarometerDropThreshold -= (calibrationData.avgBaro * 0.01);
    adjustedMagneticFieldChangeThreshold -= (calibrationData.avgMag * 0.02);
  }
  if (accelerometerData && gyroscopeData) {
    const accelMagnitude = calculateAccelMagnitude(accelerometerData);
    const angularVelocity = calculateAngularVelocity(gyroscopeData);
    const isVehicle = isUserInVehicle(gpsData);
    const lateralAcceleration = calculateLateralAcceleration(accelerometerData);
    const yawRate = calculateYawRate(gyroscopeData);
    if (gpsData.speed > 30) {
      adjustedAccelerationThreshold *= 0.8;
      adjustedAngularVelocityThreshold *= 0.8;
    }
    if (
      accelMagnitude > adjustedAccelerationThreshold &&
      angularVelocity > adjustedAngularVelocityThreshold &&
      isVehicle &&
      timeSinceLastBarometerReading < 0.2
    ) {
      isAccident = true;
    }
    if (lateralAcceleration > 2) {
      isAccident = true;
    }
    if (Math.abs(yawRate) > 1) {
      isAccident = true;
    } 
  }

  // Barometer Check (Improved)
  if (barometerData && barometerData.pressure) {
    const pressureDrop = Math.abs(barometerData.pressure - previousBarometerPressure);

    // Check for sudden pressure drop
    if (pressureDrop > adjustedBarometerDropThreshold * 2 && timeSinceLastBarometerReading < TIME_THRESHOLD_FOR_RAPID_DROP) {
      isAccident = true; 
    } else if (pressureDrop > adjustedBarometerDropThreshold) {
      isAccident = true; 
    }
  }

  // Magnetometer Check (Improved)
  if (previousMagneticField) {
    const magneticFieldChange = Math.abs(
      calculateMagneticFieldMagnitude(magnetometerData) - previousMagneticField
    );
    if (magneticFieldChange > adjustedMagneticFieldChangeThreshold) {
      // Check if the magnetic field change occurred rapidly
      if (timeSinceLastMagneticReading < 0.2) {
        isAccident = true; 
      } else {
        // Magnetic field change was gradual, might not be an accident
      }
    }
  }

  // Calculate Speed Change
  if (previousGpsData && gpsData) {
    const speedChange = Math.abs(gpsData.speed - previousGpsData.speed);

    // Check for significant speed change (sudden braking)
    if (speedChange > 5) { 
      isAccident = true; 

      // Adjust thresholds for other sensors based on speed change
      if (speedChange > 10) { 
        adjustedAccelerationThreshold *= 0.7; 
        adjustedAngularVelocityThreshold *= 0.7;
      } else if (speedChange > 5) {
        adjustedAccelerationThreshold *= 0.8;
        adjustedAngularVelocityThreshold *= 0.8;
      }
    }
  }

  if (isAccident) {
    previousAccident = true; 
    ACCELERATION_THRESHOLD *= 1.2; 
    magneticFieldChangeThreshold = RAPID_MAGNETIC_CHANGE_THRESHOLD;
  } else {
    previousAccident = false; 
    ACCELERATION_THRESHOLD /= 1.2; 
    magneticFieldChangeThreshold = MAGNETOMETER_THRESHOLD; 
  }

  return isAccident;
}

// Settings Screen Component
function SettingsScreen() {
  return (
    <Settings />
  );
}

// Tab Navigator Component
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#4544EA',
      tabBarInactiveTintColor: '#b3b2b7',
      tabBarStyle: {
        backgroundColor: '#ffffff'
      },
      tabBarHideOnKeyboard: true
    }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image resizeMethod='cover' style={{height: size, width: size, tintColor: color}} source={require('./images/heart.png')}
            onError={(e) => console.log('Image Load Error:', e.nativeEvent.error)}
            />
          ),
        }} 
      />
      
      <Tab.Screen 
        name="Inbox" 
        component={Inbox} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image style={{height: size, width: size, tintColor: color}} source={require('./images/chat.png')}/>
          ),
        }} 
      />
      
      <Tab.Screen 
        name="HealthNews" 
        component={HealthNewsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="newspaper-o" color={color} size={size} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image style={{height: size, width: size, tintColor: color}} source={require('./images/settings.png')}/>
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

// App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [isGyroscopeEnabled, setIsGyroscopeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationToken, setNotificationToken] = useState(null);
  const [showCountdownDialog, setShowCountdownDialog] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [previousBarometerPressure, setPreviousBarometerPressure] = useState(null);
  const [timeSinceLastBarometerReading, setTimeSinceLastBarometerReading] = useState(0);
  const [gpsData, setGpsData] = useState(null);
  const [previousAccident, setPreviousAccident] = useState(false);
  const [previousMagneticField, setPreviousMagneticField] = useState(null);
  const [timeSinceLastMagneticReading, setTimeSinceLastMagneticReading] = useState(0);
  const [magneticFieldChangeThreshold, setMagneticFieldChangeThreshold] = useState(MAGNETOMETER_THRESHOLD);
  const [previousGpsData, setPreviousGpsData] = useState(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const countdownIntervalRef = useRef(null);
  const [calibrationData, setCalibrationData] = useState(DEFAULT_CALIBRATION_DATA);
  const [accelerometerData, setAccelerometerData] = useState(null);
  const [gyroscopeData, setGyroscopeData] = useState(null);
  const [barometerData, setBarometerData] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState(null); 

  // Load Calibration Data from AsyncStorage
  useEffect(() => {
    const loadCalibrationData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(CALIBRATION_DATA_KEY);
        if (storedData) {
          setCalibrationData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error loading calibration data:', error);
      }
    };
    loadCalibrationData();
  }, []);

  // Request Location Permissions
  async function requestPermissions() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to show nearby hospitals.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  // Load Settings from AsyncStorage
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
    } catch (error) {
      console.error('Error loading settings', error);
    }
  };

  // Handle Countdown Logic
  const handleCountdown = () => {
    if (countdownSeconds > 0) {
      setCountdownSeconds(countdownSeconds - 1);
    } else {
      Vibration.vibrate(5000);
      navigation.navigate('Emergency', {lastPrompt: 'Possible Accident Detected.', vibrate: true});
      setShowCountdownDialog(false);
      setCountdownStarted(false);
      clearInterval(countdownIntervalRef.current); 
    }
  };

  // Manage Sensor Subscriptions and Location Updates
  useEffect(() => {
    let accelerometerSubscription = null;
    let gyroscopeSubscription = null;
    let barometerSubscription = null;
    let magnetometerSubscription = null;
    let locationSubscription = null;

    if (isGyroscopeEnabled) {
      accelerometerSubscription = Accelerometer.addListener(
        (accelerometerData) => {
          setAccelerometerData(accelerometerData); 
          if (gyroscopeSubscription && barometerSubscription && magnetometerSubscription && gpsData) {
            const isAccident = detectAccident(
              previousBarometerPressure,
              timeSinceLastBarometerReading,
              previousAccident,
              previousMagneticField,
              timeSinceLastMagneticReading,
              magneticFieldChangeThreshold,
              gpsData,
              previousGpsData,
              calibrationData 
            );
            if (isAccident) {
              setShowConfirmationDialog(true); 
            }
          }
        }
      );

      gyroscopeSubscription = Gyroscope.addListener(
        (gyroscopeData) => {
          setGyroscopeData(gyroscopeData);
          if (accelerometerSubscription && barometerSubscription && magnetometerSubscription && gpsData) {
            const isAccident = detectAccident(
              previousBarometerPressure,
              timeSinceLastBarometerReading,
              previousAccident,
              previousMagneticField,
              timeSinceLastMagneticReading,
              magneticFieldChangeThreshold,
              gpsData,
              previousGpsData,
              calibrationData 
            );
            if (isAccident) {
              setShowConfirmationDialog(true);
            }
          }
        }
      );

      barometerSubscription = Barometer.addListener(
        (barometerData) => {
          setBarometerData(barometerData); 
          setPreviousBarometerPressure(barometerData.pressure);
          setTimeSinceLastBarometerReading(0);
          if (accelerometerSubscription && gyroscopeSubscription && magnetometerSubscription && gpsData) {
            const isAccident = detectAccident(
              previousBarometerPressure,
              timeSinceLastBarometerReading,
              previousAccident,
              previousMagneticField,
              timeSinceLastMagneticReading,
              magneticFieldChangeThreshold,
              gpsData,
              previousGpsData,
              calibrationData 
            );
            if (isAccident) {
              setShowConfirmationDialog(true); 
            }
          }
        }
      );

      magnetometerSubscription = Magnetometer.addListener(
        (magnetometerData) => {
          setMagnetometerData(magnetometerData); 
          setPreviousMagneticField(magnetometerData);
          setTimeSinceLastMagneticReading(0);
          if (accelerometerSubscription && gyroscopeSubscription && barometerSubscription && gpsData) {
            const isAccident = detectAccident(
              previousBarometerPressure,
              timeSinceLastBarometerReading,
              previousAccident,
              previousMagneticField,
              timeSinceLastMagneticReading,
              magneticFieldChangeThreshold,
              gpsData,
              previousGpsData,
              calibrationData 
            );
            if (isAccident) {
              setShowConfirmationDialog(true); 
            }
          }
        }
      );

      locationSubscription = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
        (location) => {
          setPreviousGpsData(gpsData); 
          setGpsData(location.coords);
        }
      );
    }

    return () => {
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
      if (gyroscopeSubscription) {
        gyroscopeSubscription.remove();
      }
      if (barometerSubscription) {
        barometerSubscription.remove();
      }
      if (magnetometerSubscription) {
        magnetometerSubscription.remove();
      }
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isGyroscopeEnabled]);

  useEffect(() => {
    let interval = null;
    if (isGyroscopeEnabled) {
      interval = setInterval(() => {
        setTimeSinceLastBarometerReading((prevTime) => prevTime + 0.1);
        setTimeSinceLastMagneticReading((prevTime) => prevTime + 0.1); 
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isGyroscopeEnabled]);

  // Countdown Timer
  useEffect(() => {
    let interval = null;
    if (showCountdownDialog) {
      interval = setInterval(handleCountdown, 1000);
      countdownIntervalRef.current = interval; 
    } else {
      clearInterval(interval);
      countdownIntervalRef.current = null;
    }
    return () => clearInterval(interval);
  }, [showCountdownDialog, countdownSeconds]);

  // Authentication and Splash Screen
  useEffect(() => {
    requestPermissions();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setSplashVisible(false);
    });
    return () => unsubscribe();
  }, []);

  // Get Notification Permissions
  useEffect(() => {
    const { status: existingStatus } = Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permission not granted to get push token for push notification!');
      return;
    }else{
      console.log('Permission granted');
      Notifications.getExpoPushTokenAsync().then((token) => {
        setNotificationToken(token);
      });
    }
  }, []);

  // Handle Received Notifications
  const handleNotification = async (notification) => {
    if (notification.request.content.title === 'Emergency Alert') {
      Alert.alert('Emergency Alert', 'Please seek immediate medical assistance!');
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(handleNotification);
    return () => subscription.remove();
  }, []);

  // Background Fetch Task Logic
  const backgroundFetchTask = async () => {
    try {
      // Update sensor readings
      const { x, y, z } = await Accelerometer.getCurrentAccelerometerAsync();
      setAccelerometerData({ x, y, z });

      const { x: gyroX, y: gyroY, z: gyroZ } = await Gyroscope.getCurrentGyroscopeAsync();
      setGyroscopeData({ x: gyroX, y: gyroY, z: gyroZ });

      const { pressure } = await Barometer.getCurrentBarometerAsync();
      setBarometerData({ pressure });

      const { x: magX, y: magY, z: magZ } = await Magnetometer.getCurrentMagnetometerAsync();
      setMagnetometerData({ x: magX, y: magY, z: magZ });

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setPreviousGpsData(gpsData);
      setGpsData(location.coords);

      // Call detectAccident with updated sensor data
      const isAccident = detectAccident(
        previousBarometerPressure,
        timeSinceLastBarometerReading,
        previousAccident,
        previousMagneticField,
        timeSinceLastMagneticReading,
        magneticFieldChangeThreshold,
        gpsData,
        previousGpsData,
        calibrationData
      );

      // Handle accident detection result
      if (isAccident) {
        setShowConfirmationDialog(true); 
      }
    } catch (error) {
      console.error('Error in background fetch task:', error);
    }

    // Tell the OS that we're done.
    BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
  };

  // Initialize Background Fetch
  useEffect(() => {
    BackgroundFetch.configure({
      minimumFetchInterval: 15, 
      stopOnTerminate: false, 
      startOnBoot: true, 
      forceReload: false, 
      enableHeadless: true,  
      requiresCharging: false, 
      requiresNetwork: false, 
      requiresBatteryNotLow: false, 
      stopOnNetworkStateChange: false 
    }, (taskId) => {
      console.log('[BackgroundFetch] Received background fetch event: taskId', taskId);
      backgroundFetchTask(); 
    }, (error) => {
      console.log('[BackgroundFetch] BackgroundFetch.configure error:', error);
    });

    // Start Background Fetch 
    if (isGyroscopeEnabled) {
      BackgroundFetch.start().then(() => console.log('Background Fetch started!'));
    }

    // Stop Background Fetch on component unmount
    return () => {
      if (isGyroscopeEnabled) {
        BackgroundFetch.stop().then(() => console.log('Background Fetch stopped!'));
      }
    };
  }, [isGyroscopeEnabled]);

  // Send Emergency Notification (This is commented out as it was incomplete in the original code)
  // const sendEmergencyNotification = async () => {
  //   try {
  //     if (notificationToken) {
  //       await Notifications.sendNotificationAsync({
  //         to: notificationToken,
  //         title: 'Emergency Alert',
  //         body: 'Possible accident detected. Please check on the user.',
  //         data: { emergency: true
  //         },
  //       });
  //     } else {
  //       console.warn('No notification token available.');
  //     }
  //   } catch (error) {
  //     console.error('Error sending emergency notification:', error);
  //   }
  // };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('isGyroscopeEnabled', JSON.stringify(isGyroscopeEnabled));
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    } catch (error) {
      console.error('Error saving settings', error);
    }
  };
  useEffect(() => {
    saveSettings();
  }, [isGyroscopeEnabled, notificationsEnabled]);
  useEffect(() => {
    loadSettings();
  }, []);

  if (isSplashVisible) {
    return (
      <>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <SplashScreen1 />
      </>
    );
  }

  return (
    <NavigationContainer ref={(navigation) => { this.navigation = navigation; }}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="FullNews" component={FullNewsScreen} />
            <Stack.Screen name="ChatScreen" component={Chat} />
            <Stack.Screen name="CanceRx" component={Cancerx} />
            <Stack.Screen name="LinkWhatsapp" component={LinkWhatsapp} />
            <Stack.Screen name="TermsAndCondition" component={TermsAndCondition} />
            <Stack.Screen name="NearbyHospitalsMap" component={NearbyHospitalsMap} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen name="Whatsapp" component={Whatsapp} />
            <Stack.Screen name="CaliberateSensors" component={CalibrationScreen} />
            <Stack.Screen name="MedicalRecord" component={MedicalRecord} />
            <Stack.Screen name="customMedMessage" component={EmergencyContactForm} />
            <Stack.Screen name="Emergency" component={Emergency} />
          </>
        ) : (
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
      {showCountdownDialog && (
        <View style={styles.countdownDialog}>
          <Text style={styles.countdownText}>Emergency in {countdownSeconds} seconds</Text>
        </View>
      )}
      {showConfirmationDialog && (
        <View style={styles.confirmationDialog}>
          <Text style={styles.confirmationText}>Possible Accident Detected. Confirm?</Text>
          <Button title="Yes" onPress={() => {
            setShowConfirmationDialog(false);
            setShowCountdownDialog(true);
            setCountdownStarted(true);
          }} />
          <Button title="No" onPress={() => setShowConfirmationDialog(false)} />
          {showCountdownDialog && (
            <View>
              <Text style={styles.countdownText}>Emergency in {countdownSeconds} seconds</Text>
            </View>
          )}
        </View>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownDialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  confirmationDialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
});