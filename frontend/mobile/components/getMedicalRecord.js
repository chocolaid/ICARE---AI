import AsyncStorage from '@react-native-async-storage/async-storage';

async function getMedicalRecordAsString() {
  try {
    const medicalRecord = await AsyncStorage.getItem('medicalRecord');
    if (medicalRecord !== null) {
      const parsedRecord = JSON.parse(medicalRecord);
      return formatMedicalRecordAsString(parsedRecord); 
    } else {
      return "No medical record found.";
    }
  } catch (error) {
    console.error("Error retrieving medical record", error);
    return "Error retrieving medical record.";
  }
}

function formatMedicalRecordAsString(record) {
  let formattedRecord = "";

  formattedRecord += "**Personal Information:**\n";
  formattedRecord += `Full Name: ${record.fullName}\n`;
  formattedRecord += `Date of Birth: ${record.dob}\n`;
  formattedRecord += `Blood Type: ${record.bloodType}\n\n`;

  formattedRecord += "**Allergies:**\n";
  if (record.allergies.length > 0) {
    record.allergies.forEach((allergy, index) => {
      formattedRecord += `${index + 1}. ${allergy}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Medications:**\n";
  if (record.medications.length > 0) {
    record.medications.forEach((medication, index) => {
      formattedRecord += `${index + 1}. ${medication}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Medical History:**\n";
  if (record.history.length > 0) {
    record.history.forEach((historyItem, index) => {
      formattedRecord += `${index + 1}. ${historyItem}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Past Medical History:**\n";
  if (record.pastMedicalHistory.length > 0) {
    record.pastMedicalHistory.forEach((pastHistoryItem, index) => {
      formattedRecord += `${index + 1}. ${pastHistoryItem}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Family History:**\n";
  if (record.familyHistory.length > 0) {
    record.familyHistory.forEach((familyHistoryItem, index) => {
      formattedRecord += `${index + 1}. ${familyHistoryItem}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Social History:**\n";
  formattedRecord += `${record.socialHistory}\n\n`;

  formattedRecord += "**Physical Examination:**\n";
  for (const key in record.physicalExam) {
    if (record.physicalExam[key] !== '') {
      formattedRecord += `${key}: ${record.physicalExam[key]}\n`;
    }
  }
  formattedRecord += "\n";

  formattedRecord += "**Treatment Notes:**\n";
  if (record.treatmentNotes.length > 0) {
    record.treatmentNotes.forEach((treatmentNote, index) => {
      formattedRecord += `${index + 1}. ${treatmentNote}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Lab Results:**\n";
  if (record.labResults.length > 0) {
    record.labResults.forEach((labResult, index) => {
      formattedRecord += `${index + 1}. ${labResult}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Imaging Studies:**\n";
  if (record.imagingStudies.length > 0) {
    record.imagingStudies.forEach((imagingStudy, index) => {
      formattedRecord += `${index + 1}. ${imagingStudy}\n`;
    });
  } else {
    formattedRecord += "None\n\n";
  }

  formattedRecord += "**Emergency Contact:**\n";
  formattedRecord += `Name: ${record.emergencyContactName}\n`;
  formattedRecord += `Number: ${record.emergencyContactNumber}\n`;

  return formattedRecord;
}

export default getMedicalRecordAsString; 