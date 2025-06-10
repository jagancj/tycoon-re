import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TransactionModal = ({ isVisible, status, details, onClose, onConfirm }) => {

  const renderContent = () => {
    switch (status) {
      case 'confirm':
        return (
          <>
            <Ionicons name="help-circle-outline" size={60} color="#ffae42" />
            <Text style={styles.title}>Confirm Purchase</Text>
            <View style={styles.summaryCard}>
              <View style={styles.row}><Text style={styles.label}>Offer Price:</Text><Text style={styles.value}>${details.itemPrice?.toLocaleString()}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Acquisition Fee:</Text><Text style={styles.value}>+ ${details.fee?.toLocaleString()}</Text></View>
              <View style={styles.separator} />
              <View style={styles.row}><Text style={styles.labelTotal}>Total Cost:</Text><Text style={styles.valueTotal}>${details.totalCost?.toLocaleString()}</Text></View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}><Text style={styles.buttonText}>Confirm</Text></TouchableOpacity>
            </View>
          </>
        );
      case 'success':
        return (
          <>
            <Ionicons name="checkmark-circle-outline" size={60} color="#43e97b" />
            <Text style={styles.title}>Purchase Complete!</Text>
            <Text style={styles.subtitle}>{details.itemName} has been added to your portfolio.</Text>
            
            {/* --- DEBUGGING STYLES APPLIED HERE --- */}
            <TouchableOpacity 
              style={[
                styles.singleButton, 
              ]} 
              onPress={onClose}
            >
                <Text 
                  style={[
                    styles.buttonText, 
                  ]}
                >
                  Awesome!
                </Text>
            </TouchableOpacity>
          </>
        );
      case 'insufficient_funds':
        return (
          <>
            <Ionicons name="close-circle-outline" size={60} color="#e63946" />
            <Text style={styles.title}>Insufficient Funds</Text>
            <Text style={styles.subtitle}>You need ${details.totalCost?.toLocaleString()} but only have ${details.playerMoney?.toLocaleString()}.</Text>
            <TouchableOpacity style={[styles.singleButton, {backgroundColor: '#555'}]} onPress={onClose}>
                <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient colors={['#434343', '#000000']} style={styles.modalContainer}>
          {renderContent()}
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Styles remain the same as the last version
const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', padding: 25, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 15, marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 20 },
    summaryCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, width: '100%', marginBottom: 25 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    label: { color: '#ccc', fontSize: 16 },
    value: { color: '#fff', fontSize: 16, fontWeight: '600' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
    labelTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    valueTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    button: { paddingVertical: 15, borderRadius: 10, alignItems: 'center', flex: 1 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    confirmButton: { backgroundColor: '#3a7bd5', marginLeft: 5 },
    cancelButton: { backgroundColor: '#555', marginRight: 5 },
    singleButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#3a7bd5',
    },
});

export default TransactionModal;