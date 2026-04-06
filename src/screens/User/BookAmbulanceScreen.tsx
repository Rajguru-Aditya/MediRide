import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin, Sparkles, Heart, Car, Flame, Bone,
  Wind, Baby, Droplet, Zap, AlertCircle, Activity,
  Ambulance, ChevronRight, X,
} from 'lucide-react-native';
import { Input } from '../../components/Input';
import { getCurrentLocation } from '../../utils/location';

// ─── Ambulance types ──────────────────────────────────────────────
const AMBULANCE_TYPES = [
  {
    id: 'bls',
    name: 'BLS Ambulance',
    full: 'Basic Life Support',
    desc: 'Oxygen, stretcher, basic first aid. For stable/moderate cases.',
    color: '#34C759',
  },
  {
    id: 'als',
    name: 'ALS Ambulance',
    full: 'Advanced Life Support',
    desc: 'Cardiac monitor, defibrillator, IV medications. For critical cases.',
    color: '#FFB800',
  },
  {
    id: 'icu',
    name: 'ICU Ambulance',
    full: 'Mobile Intensive Care',
    desc: 'Full ICU setup with ventilator. For life-threatening conditions.',
    color: '#FF3B30',
  },
  {
    id: 'transport',
    name: 'Patient Transport',
    full: 'Non-Emergency Transfer',
    desc: 'Planned hospital transfers, routine appointments.',
    color: '#8A8FA8',
  },
];

// ─── Auto-suggest logic ───────────────────────────────────────────
// Returns ambulance type id based on condition + severity
const suggestAmbulance = (
  condition: string,
  severity: 'critical' | 'moderate' | 'stable'
): string => {
  // ICU: life-threatening conditions that are critical
  if (
    severity === 'critical' &&
    ['heart', 'stroke', 'breathing', 'drowning', 'seizure'].includes(condition)
  ) return 'icu';

  // ALS: serious conditions or critical severity
  if (
    severity === 'critical' ||
    ['heart', 'stroke', 'breathing', 'chest', 'seizure', 'poisoning'].includes(condition)
  ) return 'als';

  // BLS: moderate/stable or injury-type conditions
  if (
    ['accident', 'fire', 'fracture', 'pregnancy', 'drowning', 'other'].includes(condition)
  ) return 'bls';

  // Default fallback
  return severity === 'stable' ? 'bls' : 'als';
};

const BookAmbulanceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [patientName, setPatientName]           = useState('');
  const [patientAge, setPatientAge]             = useState('');
  const [severity, setSeverity]                 = useState<'critical' | 'moderate' | 'stable'>('critical');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [pickupLabel, setPickupLabel]           = useState('');
  const [coords, setCoords]                     = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading]   = useState(true);

  // Ambulance suggestion state
  const [ambulanceId, setAmbulanceId]           = useState('als'); // default
  const [showAmbulanceSheet, setShowAmbulanceSheet] = useState(false);

  // ─── Re-suggest whenever condition or severity changes ───────────
  useEffect(() => {
    if (selectedCondition) {
      const suggested = suggestAmbulance(selectedCondition, severity);
      setAmbulanceId(suggested);
    }
  }, [selectedCondition, severity]);

  // ─── Location ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLocationLoading(true);
        const position: any = await getCurrentLocation();
        setCoords(position);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json`,
          { headers: { 'User-Agent': 'RapidAid/1.0 (college project)', 'Accept': 'application/json' } }
        );
        const data = JSON.parse(await res.text());
        setPickupLabel(
          data?.address?.residential ||
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.city_district ||
          data?.address?.city ||
          'Current Location'
        );
      } catch (err) {
        console.log('Location error:', err);
        setPickupLabel('Unable to fetch location');
      } finally {
        setLocationLoading(false);
      }
    };
    fetchLocation();
  }, []);

  const emergencyConditions = [
    { id: 'accident',  icon: Car,         label: 'Accident' },
    { id: 'heart',     icon: Heart,       label: 'Heart Attack' },
    { id: 'stroke',    icon: Activity,    label: 'Stroke' },
    { id: 'fire',      icon: Flame,       label: 'Fire Injury' },
    { id: 'fracture',  icon: Bone,        label: 'Fracture' },
    { id: 'breathing', icon: Wind,        label: 'Breathing Issue' },
    { id: 'pregnancy', icon: Baby,        label: 'Pregnancy' },
    { id: 'poisoning', icon: Droplet,     label: 'Poisoning' },
    { id: 'drowning',  icon: Droplet,     label: 'Drowning' },
    { id: 'seizure',   icon: Zap,         label: 'Seizure' },
    { id: 'chest',     icon: Heart,       label: 'Chest Pain' },
    { id: 'other',     icon: AlertCircle, label: 'Other' },
  ];

  const selectedAmbulance = AMBULANCE_TYPES.find(a => a.id === ambulanceId)!;

  const handleNext = () => {
    if (!patientName.trim()) return Alert.alert('Missing Info', 'Please enter the patient name.');
    if (!patientAge.trim())  return Alert.alert('Missing Info', 'Please enter the patient age.');
    if (!selectedCondition)  return Alert.alert('Missing Info', 'Please select an emergency condition.');

    navigation.navigate('HospitalSelection', {
      patientName:   patientName.trim(),
      patientAge:    patientAge.trim(),
      severity,
      condition:     selectedCondition,
      ambulanceType: ambulanceId,          // ← passed to hospital + confirmation
      pickupLabel,
      coords,
    });
  };

  function renderSeverity(type: 'critical' | 'moderate' | 'stable', label: string, color: string) {
    const active = severity === type;
    return (
      <Pressable
        key={type}
        onPress={() => setSeverity(type)}
        style={[styles.severityBtn, active && { backgroundColor: color }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[
            { width: active ? 8 : 6, height: active ? 8 : 6, borderRadius: 3, backgroundColor: color },
            active && { borderWidth: 1, borderColor: '#fff' },
          ]} />
          <Text style={{ color: active ? '#fff' : '#9CA3AF' }}>{label}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />
      <View style={[styles.container, { paddingTop: insets.top }]}>

        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Book Ambulance</Text>
          <Text style={styles.subtitle}>Fill emergency details</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
          {['Details', 'Hospital', 'Confirm'].map((step, index) => (
            <React.Fragment key={index}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, index === 0 && styles.activeStep]}>
                  <Text style={{ color: '#fff' }}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, index === 0 && { color: '#fff' }]}>{step}</Text>
              </View>
              {index !== 2 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Patient Name"
            placeholder="Enter patient name"
            value={patientName}
            onChangeText={setPatientName}
          />
          <Input
            label="Patient Age"
            placeholder="Enter age"
            keyboardType="numeric"
            value={patientAge}
            onChangeText={setPatientAge}
          />

          <Text style={styles.label}>Emergency Severity</Text>
          <View style={styles.severityRow}>
            {renderSeverity('critical', 'Critical', '#FF3B30')}
            {renderSeverity('moderate', 'Moderate', '#FFB800')}
            {renderSeverity('stable',   'Stable',   '#34C759')}
          </View>

          <Text style={styles.label}>Emergency Condition</Text>
          <View style={styles.grid}>
            {emergencyConditions.map((c) => {
              const Icon = c.icon;
              const active = selectedCondition === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCondition(c.id)}
                  style={[styles.conditionCard, active && styles.conditionActive]}
                >
                  <Icon color={active ? '#fff' : '#9CA3AF'} size={20} />
                  <Text style={[styles.conditionText, active && { color: '#fff' }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Ambulance suggestion — appears after condition selected ── */}
          {selectedCondition ? (
            <>
              <Text style={styles.label}>Recommended Ambulance</Text>
              <Pressable
                style={styles.ambulanceCard}
                onPress={() => setShowAmbulanceSheet(true)}
              >
                <View style={styles.ambulanceLeft}>
                  {/* Colored dot indicating urgency level */}
                  <View style={[styles.ambulanceDot, { backgroundColor: selectedAmbulance.color }]} />
                  <View>
                    <View style={styles.ambulanceNameRow}>
                      <Text style={styles.ambulanceName}>{selectedAmbulance.name}</Text>
                      <View style={styles.suggestedBadge}>
                        <Sparkles size={10} color="#FFB800" />
                        <Text style={styles.suggestedText}>Suggested</Text>
                      </View>
                    </View>
                    <Text style={styles.ambulanceFull}>{selectedAmbulance.full}</Text>
                  </View>
                </View>
                <View style={styles.ambulanceRight}>
                  <Text style={styles.changeText}>Change</Text>
                  <ChevronRight size={14} color="#8A8FA8" />
                </View>
              </Pressable>
            </>
          ) : (
            // Placeholder before condition is picked
            <>
              <Text style={styles.label}>Recommended Ambulance</Text>
              <View style={[styles.ambulanceCard, { opacity: 0.4 }]}>
                <Ambulance size={18} color="#8A8FA8" />
                <Text style={[styles.ambulanceFull, { marginLeft: 10 }]}>
                  Select a condition above to get a suggestion
                </Text>
              </View>
            </>
          )}

          <Text style={styles.label}>Pickup Location</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={18} color="#FF3B30" />
            {locationLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FF3B30" />
                <Text style={styles.loadingText}>Fetching your location...</Text>
              </View>
            ) : (
              <Text style={styles.inputText} numberOfLines={1}>{pickupLabel}</Text>
            )}
          </View>

          <Text style={styles.label}>Destination Hospital</Text>
          <View style={styles.inputWithIcon}>
            <Sparkles size={18} color="#FFB800" />
            <Text style={styles.inputText}>AI Recommended — select on next step</Text>
          </View>
          <Text style={styles.helperText}>
            AI selected based on distance, availability & patient condition
          </Text>

          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Find Available Ambulances</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ── Ambulance Override Bottom Sheet ── */}
      <Modal
        visible={showAmbulanceSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAmbulanceSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAmbulanceSheet(false)}
        >
          {/* Stop touches from closing when tapping inside sheet */}
          <Pressable style={styles.sheet} onPress={() => {}}>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Ambulance Type</Text>
              <Pressable onPress={() => setShowAmbulanceSheet(false)}>
                <X size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text style={styles.sheetSub}>
              {selectedAmbulance.name} is recommended for your condition.
              You can change it if needed.
            </Text>

            {AMBULANCE_TYPES.map((type) => {
              const active = ambulanceId === type.id;
              const isSuggested = type.id === suggestAmbulance(selectedCondition, severity);
              return (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    setAmbulanceId(type.id);
                    setShowAmbulanceSheet(false);
                  }}
                  style={[styles.sheetOption, active && styles.sheetOptionActive]}
                >
                  <View style={[styles.sheetDot, { backgroundColor: type.color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.sheetOptionNameRow}>
                      <Text style={styles.sheetOptionName}>{type.name}</Text>
                      {isSuggested && (
                        <View style={styles.suggestedBadge}>
                          <Sparkles size={10} color="#FFB800" />
                          <Text style={styles.suggestedText}>Suggested</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sheetOptionDesc}>{type.desc}</Text>
                  </View>
                  {active && (
                    <View style={styles.checkCircle}>
                      <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
};

export default BookAmbulanceScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginBottom: 20 },
  back: { color: '#9CA3AF', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', marginTop: 4 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#141929', justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#FF3B30' },
  stepText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 6, marginBottom: 20 },
  label: { color: '#D1D5DB', marginBottom: 6 },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  severityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#141929', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  conditionCard: { width: '30%', backgroundColor: '#141929', borderRadius: 10, padding: 10, alignItems: 'center' },
  conditionActive: { backgroundColor: '#FF3B30' },
  conditionText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  // ── Ambulance suggestion card ──
  ambulanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141929',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E2540',
  },
  ambulanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ambulanceDot: { width: 10, height: 10, borderRadius: 5 },
  ambulanceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ambulanceName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ambulanceFull: { color: '#8A8FA8', fontSize: 12, marginTop: 2 },
  ambulanceRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },

  // Suggested badge
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,184,0,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestedText: { color: '#FFB800', fontSize: 10, fontWeight: '600' },

  inputWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141929', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1E2540' },
  inputText: { color: '#fff', flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  loadingText: { color: '#8A8FA8', fontSize: 13 },
  helperText: { color: '#9CA3AF', fontSize: 11, marginBottom: 20 },
  button: { backgroundColor: '#FF3B30', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 30 },
  buttonText: { color: '#fff', fontWeight: '600' },

  // ── Bottom sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sheetTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  sheetSub: { color: '#8A8FA8', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#0A0F2C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sheetOptionActive: { borderColor: '#FF3B30' },
  sheetDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  sheetOptionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sheetOptionName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sheetOptionDesc: { color: '#8A8FA8', fontSize: 12, lineHeight: 17 },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
});