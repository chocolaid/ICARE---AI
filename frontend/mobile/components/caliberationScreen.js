import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALIBRATION_DATA_KEY = '@calibration_data';
const FILTER_FACTOR = 0.1;

const CALIBRATION_STAGES = {
  accelerometer: [
    { title: 'Accelerometer Calibration', instructions: 'Place the device on a flat surface.' },
  ],
  gyroscope: [
    { title: 'Gyroscope Calibration', instructions: 'Rotate the device slowly.' },
  ],
  barometer: [
    { title: 'Barometer Calibration', instructions: 'Keep the device steady.' },
  ],
  magnetometer: [
    { title: 'Magnetometer Calibration', instructions: 'Rotate the device in a figure-8 pattern.' },
  ],
};

const CalibrationScreen = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState('accelerometer'); // Default to "accelerometer"
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sensorData, setSensorData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const calibrationIntervalRef = useRef(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadCalibrationData();
  }, []);

  useEffect(() => {
    if (isCalibrating) {
      setAlertVisible(true);
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownInterval);
            setAlertVisible(false);
            startSensorCalibration();
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isCalibrating]);

  useEffect(() => {
    if (isCalibrating) {
      Animated.timing(progressAnimation, {
        toValue: calibrationProgress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [calibrationProgress, isCalibrating]);

  const loadCalibrationData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(CALIBRATION_DATA_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setCompletedStages(parsedData);
      }
    } catch (error) {
      console.error('Error loading calibration data:', error);
    }
  };

  const startSensorCalibration = () => {
    const stage = CALIBRATION_STAGES[selectedSensor][currentStageIndex];
    let progress = 0;
    let readings = [];

    calibrationIntervalRef.current = setInterval(() => {
      // Simulate sensor data
      const simulatedReading = {
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
      };

      readings.push(simulatedReading);
      setSensorData(lowPassFilter(simulatedReading));
      progress += 1;
      setCalibrationProgress(progress);

      if (progress >= 100) {
        clearInterval(calibrationIntervalRef.current);
        completeCurrentStage(stage.title, readings);
      }
    }, 100);
  };

  const completeCurrentStage = (stageTitle, readings) => {
    const updatedCompletedStages = { ...completedStages, [selectedSensor]: [...(completedStages[selectedSensor] || []), currentStageIndex] };
    setCompletedStages(updatedCompletedStages);

    let avgReadings;
    switch (selectedSensor) {
      case 'barometer':
        avgReadings = calculateAvgValue(readings.map((r) => r.x)); // Assuming x represents pressure for barometer
        break;
      case 'magnetometer':
        avgReadings = calculateAvgMagnitude(readings);
        break;
      default:
        avgReadings = readings.map(calculateAccelMagnitude); // For accelerometer and gyroscope
        break;
    }

    storeCalibrationData(stageTitle, avgReadings, updatedCompletedStages);
    nextStage();
  };

  const storeCalibrationData = async (stageTitle, sensorReadings, updatedCompletedStages) => {
    try {
      const data = {
        stageTitle,
        sensor: selectedSensor,
        readings: sensorReadings,
        details: {
          accelerometer: selectedSensor === 'accelerometer' ? sensorReadings : null,
          gyroscope: selectedSensor === 'gyroscope' ? sensorReadings : null,
          barometer: selectedSensor === 'barometer' ? sensorReadings : null,
          magnetometer: selectedSensor === 'magnetometer' ? sensorReadings : null,
          location: locationData,
          timestamp: new Date().toISOString(),
        },
      };

      const calibrationData = JSON.parse(await AsyncStorage.getItem(CALIBRATION_DATA_KEY)) || {};
      calibrationData[selectedSensor] = updatedCompletedStages[selectedSensor];
      await AsyncStorage.setItem(CALIBRATION_DATA_KEY, JSON.stringify(calibrationData));
      setCompletedStages(updatedCompletedStages);
    } catch (error) {
      console.error('Error saving calibration data:', error);
    }
  };

  const calculateAvgValue = (readings) => {
    const total = readings.reduce((acc, curr) => acc + curr, 0);
    return total / readings.length;
  };

  const calculateAvgMagnitude = (readings) => {
    const total = readings.reduce((acc, curr) => acc + Math.sqrt(curr.x * curr.x + curr.y * curr.y + curr.z * curr.z), 0);
    return total / readings.length;
  };

  const lowPassFilter = (data) => {
    if (!sensorData) return data;
    return {
      x: sensorData.x + FILTER_FACTOR * (data.x - sensorData.x),
      y: sensorData.y + FILTER_FACTOR * (data.y - sensorData.y),
      z: sensorData.z + FILTER_FACTOR * (data.z - sensorData.z),
    };
  };

  const calculateAccelMagnitude = (data) => Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);

  const nextStage = () => {
    clearInterval(calibrationIntervalRef.current);
    if (currentStageIndex < CALIBRATION_STAGES[selectedSensor].length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
      setCalibrationProgress(0);
    } else {
      setIsCalibrating(false);
      setCalibrationProgress(0);
    }
  };

  const renderStageInstructions = () => {
    const stage = CALIBRATION_STAGES[selectedSensor][currentStageIndex];
    return (
      <View style={[styles.stageContainer, completedStages[selectedSensor]?.includes(currentStageIndex) && styles.completedStageContainer]}>
        <Text style={styles.stageTitle}>{stage.title}</Text>
        <Text style={styles.stageInstructions}>{stage.instructions}</Text>
        {isCalibrating && <Text style={styles.calibrationProgress}>Calibrating...</Text>}
        {completedStages[selectedSensor]?.includes(currentStageIndex) && <Text style={styles.completedStageText}>Completed</Text>}
      </View>
    );
  };

  const handleSensorSelection = (sensor) => {
    setSelectedSensor(sensor);
    setCurrentStageIndex(0); // Reset to the first stage
    setCalibrationProgress(0); // Reset calibration progress
  };

  const renderSensorSelection = () => (
    <View style={styles.sensorSelectionContainer}>
      <Text style={styles.sensorSelectionTitle}>Select a Sensor to Calibrate:</Text>
      <View style={styles.sensorSelectionButtons}>
        {Object.keys(CALIBRATION_STAGES).map((sensor) => (
          <TouchableOpacity
            key={sensor}
            style={[
              styles.sensorButton,
              selectedSensor === sensor && styles.selectedSensorButton,
            ]}
            onPress={() => handleSensorSelection(sensor)}
          >
            <Text style={styles.sensorButtonText}>{sensor}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressBar = () => {
    const width = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, windowWidth - 40],
    });

    return (
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Sensor Calibration</Text>
      {renderSensorSelection()}
      {selectedSensor && renderStageInstructions()}
      {isCalibrating && renderProgressBar()}
      <TouchableOpacity
        style={[
          styles.startButton,
          isCalibrating || !selectedSensor ? styles.disabledButton : null,
        ]}
        onPress={() => setIsCalibrating(true)}
        disabled={isCalibrating || !selectedSensor}
      >
        <Text style={styles.startButtonText}>Start Calibration</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="fade"
        visible={alertVisible}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertContainer}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Get Ready</Text>
            <Text style={styles.alertCountdown}>{countdown}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  stageContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  completedStageContainer: {
    backgroundColor: '#d4edda',
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stageInstructions: {
    fontSize: 14,
    color: '#555',
  },
  calibrationProgress: {
    fontSize: 14,
    color: '#007bff',
  },
  completedStageText: {
    fontSize: 14,
    color: '#28a745',
  },
  sensorSelectionContainer: {
    marginBottom: 20,
  },
  sensorSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  sensorSelectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sensorButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  selectedSensorButton: {
    backgroundColor: '#0056b3',
  },
  sensorButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  startButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    width: 200,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertCountdown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
});

export default CalibrationScreen;
