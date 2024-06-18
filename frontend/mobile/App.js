import React, { useState, useEffect } from 'react';
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
import CustomMedMessage from './components/customMedMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer, Gyroscope, Barometer } from 'expo-sensors';
import * as Location from 'expo-location';
import OpenCage from 'opencage-api-client';
import Emergency from './components/e';
import * as Notifications from 'expo-notifications';
import EmergencyContactForm from './components/contact';
import SplashScreen from 'react-native-splash-screen';
import Cancerx from './components/cancerx';


const ACCELERATION_THRESHOLD = 1.8; 
const ANGULAR_VELOCITY_THRESHOLD = 0.5; 
const BAROMETER_DROP_THRESHOLD = 5; 
const FILTER_FACTOR = 0.1;
const TIME_THRESHOLD_FOR_RAPID_DROP = 0.5;
const OPEN_CAGE_API_KEY = '3dd85c7722814333942dc3cdbae6a00b';

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
async function isUserInVehicle(gpsData) {
  try {
    if (gpsData.speed > 10) { 
      return true;
    } else {
      const geocoding = new OpenCage({ key: OPEN_CAGE_API_KEY });
      const response = await geocoding.reverseGeocode(gpsData.latitude, gpsData.longitude);
      if (response.results.length > 0) {
        const roadType = response.results[0].road;
        if (roadType && roadType !== 'no' && roadType !== 'unknown') {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error getting GPS data or OpenCage response:', error);
    return false;
  }
}
function detectAccident(
  accelerometerData,
  gyroscopeData,
  barometerData,
  gpsData
) {
  const filteredAccel = lowPassFilter(accelerometerData);
  const filteredGyro = lowPassFilter(gyroscopeData);
  const accelMagnitude = calculateAccelMagnitude(filteredAccel);
  const angularVelocity = calculateAngularVelocity(filteredGyro);
  const isVehicle = isUserInVehicle(gpsData);
  let isAccident =
    accelMagnitude > ACCELERATION_THRESHOLD &&
    angularVelocity > ANGULAR_VELOCITY_THRESHOLD &&
    isVehicle;
  if (barometerData && barometerData.pressure) {
    const pressureDrop = Math.abs(barometerData.pressure - previousBarometerPressure);
    if (pressureDrop > BAROMETER_DROP_THRESHOLD) {
      isAccident = true; 
    }
    if (pressureDrop > 2 * BAROMETER_DROP_THRESHOLD && timeSinceLastBarometerReading < TIME_THRESHOLD_FOR_RAPID_DROP) {
      isAccident = true;
    }
  }
  if (isAccident) {
    if (previousAccident) {
      ACCELERATION_THRESHOLD *= 1.2;
      ANGULAR_VELOCITY_THRESHOLD *= 1.2;
    }
    previousAccident = true;
    return true;
  } else {
    if (previousAccident) {
      ACCELERATION_THRESHOLD /= 1.2;
      ANGULAR_VELOCITY_THRESHOLD /= 1.2;
    }
    previousAccident = false;
    return false;
  }
}

function SettingsScreen() {
  return (
    <Settings />
  )
  
}

function FullScreenComponent({ navigation }) {
  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
  }, [navigation]);

  return (
    <View style={styles.screenContainer}>
      <Text>This is a Full Screen Component!</Text>
    </View>
  );
}

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
  useEffect(() => {
    SplashScreen.hide();
}, []);
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

  useEffect(() => {
    let accelerometerSubscription = null;
    let gyroscopeSubscription = null;
    let barometerSubscription = null;
    let locationSubscription = null;

    if (isGyroscopeEnabled) {
      accelerometerSubscription = Accelerometer.addListener(
        (accelerometerData) => {
          if (gyroscopeSubscription && barometerSubscription && gpsData) {
            const isAccident = detectAccident(
              accelerometerData,
              gyroscopeData,
              barometerData,
              gpsData
            );
            if (isAccident) {
              setShowCountdownDialog(true);
              setCountdownSeconds(10);
            }
          }
        }
      );

      gyroscopeSubscription = Gyroscope.addListener(
        (gyroscopeData) => {
          if (accelerometerSubscription && barometerSubscription && gpsData) {
            const isAccident = detectAccident(
              accelerometerData,
              gyroscopeData,
              barometerData,
              gpsData
            );
            if (isAccident) {
              setShowCountdownDialog(true);
              setCountdownSeconds(10);
            }
          }
        }
      );

      barometerSubscription = Barometer.addListener(
        (barometerData) => {
          setPreviousBarometerPressure(barometerData.pressure); // Store pressure for drop detection
          setTimeSinceLastBarometerReading(0);
          if (accelerometerSubscription && gyroscopeSubscription && gpsData) {
            const isAccident = detectAccident(
              accelerometerData,
              gyroscopeData,
              barometerData,
              gpsData
            );
            if (isAccident) {
              setShowCountdownDialog(true);
              setCountdownSeconds(10);
            }
          }
        }
      );

      // Get location updates
      locationSubscription = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
        (location) => {
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
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isGyroscopeEnabled]);

  // Timer for barometer reading
  useEffect(() => {
    let interval = null;
    if (isGyroscopeEnabled) {
      interval = setInterval(() => {
        setTimeSinceLastBarometerReading((prevTime) => prevTime + 0.1);
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isGyroscopeEnabled]);

  const handleCountdown = () => {
    if (countdownSeconds > 0) {
      setCountdownSeconds(countdownSeconds - 1);
    } else {
      Vibration.vibrate(5000);
      navigation.navigate('Emergency', {lastPrompt: 'Possible Accident Detected.'});
      setShowCountdownDialog(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (showCountdownDialog) {
      interval = setInterval(handleCountdown, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showCountdownDialog, countdownSeconds]);

  useEffect(() => {
    requestPermissions();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setSplashVisible(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Get notification permission
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

  const handleNotification = async (notification) => {
    if (notification.request.content.title === 'Emergency Alert') {
      // Trigger an emergency response
      Alert.alert('Emergency Alert', 'Please seek immediate medical assistance!');
      // You can also navigate to the Emergency screen here
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(handleNotification);
    return () => subscription.remove();
  }, []);


  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('isGyroscopeEnabled', JSON.stringify(isGyroscopeEnabled));
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    } catch (error) {
      console.error('Error saving settings', error);
    }
  };

  // Save settings on change
  useEffect(() => {
    saveSettings();
  }, [isGyroscopeEnabled, notificationsEnabled]);

  // Load settings on app startup
  useEffect(() => {
    loadSettings();
  }, []);

  if (isSplashVisible) {
    return (
      <>
        <StatusBar backgroundColor="#3b3ae8" barStyle="light-content" />
        <SplashScreen1 />
      </>
    );
  }

  return (
    <NavigationContainer ref={(navigation) => { this.navigation = navigation; }}>
      <StatusBar backgroundColor="#3b3ae8" barStyle="light-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="FullScreen" component={FullScreenComponent} />
            <Stack.Screen name="FullNews" component={FullNewsScreen} />
            <Stack.Screen name="ChatScreen" component={Chat} />
            <Stack.Screen name="CanceRx" component={Cancerx} />
            <Stack.Screen name="LinkWhatsapp" component={LinkWhatsapp} />
            <Stack.Screen name="TermsAndCondition" component={TermsAndCondition} />
            <Stack.Screen name="NearbyHospitalsMap" component={NearbyHospitalsMap} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen name="Whatsapp" component={Whatsapp} />
            <Stack.Screen name="MedicalRecord" component={MedicalRecord} />
            <Stack.Screen name="customMedMessage" component={EmergencyContactForm} />
            
            <Stack.Screen name="Emergency" component={Emergency} />
          </>
        ) : (
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
      {/* Countdown Dialog */}
      {showCountdownDialog && (
        <View style={styles.countdownDialog}>
          <Text style={styles.countdownText}>Emergency in {countdownSeconds} seconds</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
