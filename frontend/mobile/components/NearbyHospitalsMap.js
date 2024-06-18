import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ImageBackground, Dimensions, Image, Modal, PermissionsAndroid } from 'react-native';
import GetLocation from 'react-native-get-location';
import axios from 'axios';
import * as Permissions from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

const styles = StyleSheet.create({
  hospitalContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 5,
    marginRight: 5,
    fontFamily: 'Blogger Sans-Bold'
  },
  hospitalDetails: {
    fontSize: 14,
    marginTop: 1,
    color: 'white',
    marginLeft: 5,
    marginRight: 5,
    fontFamily: 'Blogger Sans-Bold'
  },
  container: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'white',
    marginTop: 5
  },
  directionsButton: {
    backgroundColor: '#4544EA',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
    flex: 1
  },
  imageBackground: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const hospitalPlaceholder = require('../images/hospital.jpg'); // Import the local image
const requestCameraPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'ICare Location Permission',
        message:
          'ICare needs access to your Location ' +
          'so you can see hospitals near you.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the camera');
    } else {
      console.log('Camera permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};
const NearbyHospitalsMap = ({ navigation }) => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCyjxgCh_Q8aDAApAVUmpVfwxfoBBjYe4Q'; 
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const permissionStatus = await Permissions.request(
          Platform.select({
            ios: Permissions.PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            android: Permissions.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          })
        );
        return permissionStatus;
      } catch (error) {
        console.error('Error requesting location permission:', error);
        return null;
      }
    };

    const fetchUserLocation = async () => {
      try {
        const location = await GetLocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 60000,
        });
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        return location;
      } catch (error) {
        console.error('Error getting user location:', error);
        Alert.alert(
          'Location Error',
          'Failed to retrieve current location. Please make sure location services are enabled and try again.'
        );
        return null;
      }
    };
    const fetchNearbyHospitals = async (location) => {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=1000&type=hospital&key=${GOOGLE_MAPS_API_KEY}`
        );
        const operationalHospitals = response.data.results.filter(
          hospital => hospital.business_status === 'OPERATIONAL'
        );

        // Fetch details for each hospital to get phone number
        const hospitalsWithDetails = await Promise.all(operationalHospitals.map(async hospital => {
          const detailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&key=${GOOGLE_MAPS_API_KEY}`
          );
          return {
            ...hospital,
            phone: detailsResponse.data.result.international_phone_number || null,
          };
        }));

        setHospitals(hospitalsWithDetails);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const initialize = async () => {
      const permissionStatus = await requestLocationPermission();
      if (permissionStatus === Permissions.RESULTS.GRANTED) {
        const location = await fetchUserLocation();
        if (location) {
          await fetchNearbyHospitals(location);
        }
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby hospitals.');
        requestCameraPermission();
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  return (
    <View style={{ height: '100%', paddingBottom: 50, paddingTop: 0, backgroundColor: '#4445ea' }}>
      <View style={{ backgroundColor: '#4445EA', height: Dimensions.get('window').height * 0.065, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontFamily: 'Blogger Sans-Bold', fontSize: 18 }}>Hospitals Near You</Text>
      </View>
      <View style={styles.container}>
        {isLoading ? (
          <Modal
            transparent={true}
            animationType="fade"
            visible={isLoading}
            onRequestClose={() => {}}
          >
            <View style={styles.loadingContainer}>
              <LottieView
                source={require('../animations/loading.json')} // Path to your Lottie animation file
                autoPlay
                loop
              />
            </View>
          </Modal>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flex: 1 }}>
              {hospitals.map((hospital, index) => {
                const photoUrl = hospital.photos && hospital.photos.length > 0 
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${hospital.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                  : hospitalPlaceholder;

                return (
                  <View key={index} style={styles.hospitalContainer}>
                    <ImageBackground
                      source={typeof photoUrl === 'string' ? { uri: photoUrl } : photoUrl}
                      style={styles.imageBackground}
                    >
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.gradient}>
                        <Text style={styles.hospitalName}>{hospital.name}</Text>
                        <Text style={styles.hospitalDetails} numberOfLines={1}>
                          {`${hospital.vicinity || 'No address available'}`}
                        </Text>
                        <Text style={styles.hospitalDetails}>
                          {`Open Now: ${hospital.opening_hours ? (hospital.opening_hours.open_now ? 'Yes' : 'No') : 'No information available'}`}
                        </Text>
                        <Text style={styles.hospitalDetails}>
                          {`Phone: ${hospital.phone || 'No phone number available'}`}
                        </Text>
                      </LinearGradient>
                    </ImageBackground>
                    <View style={{ display: 'flex', flexDirection: 'row' }}>
                      <TouchableOpacity style={styles.directionsButton} onPress={() => navigation.navigate('Map', { coordinates: hospital.geometry.location }, { mylocation: userLocation })}>
                        <Text style={{ color: 'white', fontFamily: 'Blogger Sans-Medium', fontSize: 18 }}>Get Directions</Text>
                      </TouchableOpacity>
                      {hospital.phone && (
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100%', padding: 0 }}>
                          <TouchableOpacity>
                            <Image style={{ height: 20, width: 20, marginLeft: 20, tintColor: '#4445ea', marginRight: 15 }} source={require('../images/call.png')} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => navigation.navigate('Whatsapp', { phone: hospital.phone })}>
                            <Image style={{ height: 20, width: 20, marginLeft: 5, marginRight: 20, tintColor: '#4445ea' }} source={require('../images/chat.png')} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default NearbyHospitalsMap;
