import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Image, useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import GetLocation from 'react-native-get-location';
import axios from 'axios';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCyjxgCh_Q8aDAApAVUmpVfwxfoBBjYe4Q';

export default function Map({ route }) {
  const { coordinates } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const locationSubscription = setInterval(() => {
      GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
        .then(location => {
          const userLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          setCurrentLocation(userLocation);
          setMapRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.005,  // Adjust these values to set your desired zoom level
            longitudeDelta: 0.005,
          });
          fetchDirections(userLocation, coordinates);
        })
        .catch(error => {
          console.error('Error getting location:', error);
        });
    }, 5000);

    return () => clearInterval(locationSubscription);
  }, [coordinates]);

  const fetchDirections = async (origin, destination) => {
    if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.lat || !destination.lng) {
      console.error('Invalid coordinates for fetching directions');
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.lat},${destination.lng}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
      );

      const points = response.data.routes.map(route => decodePolyline(route.overview_polyline.points));
      setRouteCoordinates(points);

      const leg = response.data.routes[0].legs[0];
      setRouteInfo({
        distance: leg.distance.text,
        duration: leg.duration.text,
        start_address: leg.start_address,
        end_address: leg.end_address,
        traffic: response.data.routes[0].summary,
      });
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const decodePolyline = (t, e = 5) => {
    let points = [];
    for (let step = 0, lat = 0, lng = 0, length = t.length; step < length; ) {
      let shift = 0, result = 0;
      do {
        var b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;
      shift = result = 0;
      do {
        b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  if (!currentLocation || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
}

return (
  <View style={styles.container}>
    <MapView
      style={styles.map}
      region={mapRegion}
      customMapStyle={colorScheme === 'dark' ? darkMapStyle : []}
    >
      {currentLocation && (
        <Marker coordinate={currentLocation} title="Me">
          <LottieView 
            source={require('../animations/location.json')} 
            autoPlay 
            loop 
            style={styles.markerIcon} 
          />
          <Callout>
            <Text>Me</Text>
          </Callout>
        </Marker>
      )}
      {coordinates && (
        <Marker coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }} title="Destination">
          <LottieView 
            source={require('../animations/destination.json')} 
            autoPlay 
            loop 
            style={styles.markerIcon} 
          />
          <Callout>
            <Text style={{width: 75}}>Destination</Text>
          </Callout>
        </Marker>
      )}
      {routeCoordinates.length > 0 &&
        routeCoordinates.map((route, index) => (
          <Polyline 
            key={index}
            coordinates={route} 
            strokeWidth={4} 
            strokeColor={index === 0 ? "#1E90FF" : "#FF6347"} 
          />
        ))}
    </MapView>
    {routeInfo && (
      <Animatable.View style={styles.routeInfo} animation="fadeInUp" duration={600}>
        <Text style={styles.infoText}>Distance: {routeInfo.distance}</Text>
        <Text style={styles.infoText}>Duration: {routeInfo.duration}</Text>
        <Text style={styles.infoText}>From: {routeInfo.start_address}</Text>
        <Text style={styles.infoText}>To: {routeInfo.end_address}</Text>
        <Text style={styles.infoText}>Traffic: {routeInfo.traffic}</Text>
      </Animatable.View>
    )}
  </View>
);
}

const darkMapStyle = [
{ elementType: 'geometry', stylers: [{ color: '#212121' }] },
{ elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
{ elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
{ elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
{ featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
{ featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
{ featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
{ featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
{ featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
{ featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
{ featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
{ featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
{ featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
{ featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
{ featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
{ featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
{ featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
{ featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
{ featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
{ featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
{ featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
{ featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
];

const styles = StyleSheet.create({
container: {
  flex: 1,
},
map: {
  flex: 1,
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
markerIcon: {
  width: 20,
  height: 20,
  tintColor: '#4445ea'
},
markerIcon2: {
    width: 20,
    height: 20,
  },
routeInfo: {
  position: 'absolute',
  bottom: 20,
  left: 10,
  right: 10,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  padding: 15,
  borderRadius: 10,
},
infoText: {
  fontSize: 16,
  color: 'white',
  marginVertical: 2,
},
});