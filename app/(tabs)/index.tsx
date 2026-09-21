import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { LogOut, QrCode, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GuestDetails } from '@/lib/types';

export default function ScanTab() {
  const [guest, setGuest] = useState<GuestDetails | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [attendanceResult, setAttendanceResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLookup = async () => {
    const qrValue = manualValue.trim();
    if (!qrValue || loading) return;

    setLoading(true);

    try {
      const guests = await apiService.getEmployeeByBarcode(qrValue);
      console.log('guests::', guests);
      if (Array.isArray(guests) && guests[0]) {
        setGuest(guests[0]);
        setAttendanceResult(null);
        setShowDialog(true);
      } else {
        Alert.alert('Error', 'Visitor not found');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch guest data');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (type: 'IN' | 'OUT') => {
    if (!guest || !user) return;

    setLoading(true);
    try {
      const result = await apiService.createAttendanceEntry(
        {
          EventLogId: guest.eventLogId,
          QrName: guest.qrName,
          QrId: guest.qrId != null ? String(guest.qrId) : null,
        },
        type,
      );

      setAttendanceResult({
        success: result?.value !== false,
        message:
          result?.message ||
          `${guest.fullName || guest.qrName || 'Visitor'} marked as ${type} successfully`,
      });
    } catch (error: any) {
      setAttendanceResult({
        success: false,
        message: error.message || 'Failed to record attendance',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setGuest(null);
    setManualValue('');
    setAttendanceResult(null);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          console.log('Logging out user');
          logout();
          router.replace('/(auth)' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SI Events scanner</Text>
          <Text style={styles.headerSubtitle}>Enter Guest QR Value</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#0042BF" />
        </TouchableOpacity>
      </View>

      <View style={styles.manualContainer}>
        <TextInput
          style={styles.manualInput}
          placeholder="Enter QR value"
          placeholderTextColor="#888"
          value={manualValue}
          onChangeText={setManualValue}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleLookup}
        />
        <TouchableOpacity
          style={[styles.button, (!manualValue.trim() || loading) && styles.buttonDisabled]}
          onPress={handleLookup}
          disabled={!manualValue.trim() || loading}>
          <Text style={styles.buttonText}>{loading ? 'Looking up...' : 'Lookup'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {user ? `Logged in as: ${user.appUserName}` : 'Not logged in'}
        </Text>
        <Text style={styles.instructionText}>
          Paste or type the QR value and tap Lookup
        </Text>
      </View>

      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            {loading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0042BF" />
              </View>
            )}

            {attendanceResult ? (
              <View style={styles.resultContainer}>
                <View
                  style={[
                    styles.resultIconCircle,
                    attendanceResult.success
                      ? styles.resultIconSuccess
                      : styles.resultIconError,
                  ]}>
                  {attendanceResult.success ? (
                    <Check size={36} color="#fff" strokeWidth={3} />
                  ) : (
                    <X size={36} color="#fff" strokeWidth={3} />
                  )}
                </View>
                <Text style={styles.resultMessage}>{attendanceResult.message}</Text>
                <TouchableOpacity style={styles.button} onPress={closeDialog}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.dialogTitle}>Guest Details</Text>

                {guest && (
                  <View style={styles.employeeDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailText}>{guest.fullName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Registration ID:</Text>
                      <Text style={styles.detailText}>{guest.registrationId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>QR ID:</Text>
                      <Text style={styles.detailText}>{guest.qrId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <QrCode size={20} color="#1E1E1E" />
                      <Text style={styles.detailText}>{guest.qrName}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.securityButton, styles.inButton]}
                    onPress={() => handleAttendance('IN')}>
                    <Text style={styles.buttonText}>IN</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cancelButton} onPress={closeDialog}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Text style={styles.footer}>
        Design & Developed By{' '}
        <Text onPress={() => Linking.openURL('https://scriptindia.in/')}>
          SCRIPT INDIA
        </Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0042BF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#1E1E1E',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  manualContainer: {
    flex: 1,
    margin: 20,
    justifyContent: 'center',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E1E1E',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#1E1E1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  button: {
    width: '80%',
    height: 40,
    backgroundColor: '#0042BF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  employeeDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#1E1E1E',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  securityButton: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  inButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  cancelButtonText: {
    color: '#1E1E1E',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIconSuccess: {
    backgroundColor: '#28a745',
  },
  resultIconError: {
    backgroundColor: '#dc3545',
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    borderRadius: 12,
  },
  footer: {
    marginTop: 40,
    fontSize: 16,
    color: '#1E1E1E',
    textAlign: 'center',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: '#1E1E1E',
  },
});
