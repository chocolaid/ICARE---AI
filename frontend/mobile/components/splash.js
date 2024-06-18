import React from "react";
import {View, ActivityIndicator, Text } from "react-native";
import { styles } from "../styles/styles";


function SplashScreen1({ navigation }) {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        navigation.replace('Tabs');
      }, 6000);
      return () => clearTimeout(timer);
    }, [navigation]);
  
    return (
      <View style={styles.splashContainer}>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: 'white', fontSize: 70, marginBottom: 20, textAlign: 'center', fontFamily: 'Blogger Sans-Medium'}}>ICARE</Text>
        </View>
        <View>
        <Text style={{color: 'white', fontSize: 16, textAlign: 'center', fontFamily: 'Blogger Sans-Medium', marginBottom: 20}}>OECAPPS | SPECTRA </Text>
        </View>
      </View>

    );
  }

export default SplashScreen1;
