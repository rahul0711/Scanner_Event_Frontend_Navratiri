// screens/EntriesTab.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";

import { LogIn, LogOut, Calendar, Clock, User, QrCode } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { InOutEntry } from "@/lib/types";
import { apiService } from "@/services/api";
import { formatDate, formatTime } from "@/lib/date";
import { useRouter } from "expo-router";

type Tab = "IN" | "OUT";

export default function EntriesTab() {
  const [entries, setEntries] = useState<InOutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("IN");
  const [inCount, setInCount] = useState<number>(0);
  const [outCount, setOutCount] = useState<number>(0);
  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const flagForTab = (t: Tab) => (t === "IN" ? 1 : 2);


  const fetchCounts = async () => {
    if (!user) return;
    try {
      const [i, o] = await Promise.all([
        apiService.getInOutCount(1),
        apiService.getInOutCount(2),
      ]);
      setInCount(i);
      setOutCount(o);
    } catch (err) {
      console.warn("Failed to fetch counts", err);
    }
  };


  const fetchEntries = async (isRefreshing = false) => {
    if (!user) return;

    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await apiService.getTodayEntries();
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCounts();
      fetchEntries();
    }, [user, tab])
  );



  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          console.log('Logging out user');
          logout();
          router.replace("/(auth)" as any);
        },
      },
    ]);
  };





  const renderEntry = ({ item }: { item: InOutEntry }) => {
    const isIn = tab === "IN";
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.employeeInfo}>
            <QrCode size={20} color="#1E1E1E" />
            <Text style={styles.employeeName}>QR ID: {item.qrId}</Text>
          </View>
          <View style={[styles.badge, isIn ? styles.inBadge : styles.outBadge]}>
            {isIn ? <LogIn size={16} color="#fff" /> : <LogOut size={16} color="#fff" />}
            <Text style={styles.badgeText}>{tab}</Text>
          </View>
        </View>

        <View style={styles.entryDetails}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#888" />
            <Text style={styles.detailText}>
              {formatDate(item.logDate)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#888" />
            <Text style={styles.detailText}>{formatTime(item.logDate)}</Text>
          </View>
        </View>

        {/* <View style={styles.entryFooter}>
          <Text style={styles.footerText}>Registration Id: {item.registrationId || item.childRegistrationId}</Text>
        </View> */}
      </View>
    );
  };

  const keyExtractor = (item: InOutEntry, index: number) =>
    `${item.registrationId || item.childRegistrationId}-${item.logDate}-${index}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>

        <Header tab={tab} setTab={setTab} count={entries.length} inCount={inCount} outCount={outCount} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0042BF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SI Events scanner</Text>
          <Text style={styles.headerSubtitle}>Guest Entries</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#0042BF" />
        </TouchableOpacity>
      </View>
      <Header tab={tab} setTab={setTab} count={entries.length} inCount={inCount} outCount={outCount} />

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {tab} entries found</Text>
          <Text style={styles.emptySubtext}>
            Pull to refresh or switch tabs to see other entries.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchEntries(true)}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchEntries(true)}
              colors={["#0042BF"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

/** Top header with tabs */
function Header({
  tab,
  setTab,
  count,
  inCount,
  outCount,
}: {
  tab: "IN" | "OUT";
  setTab: (t: "IN" | "OUT") => void;
  count: number;
  inCount?: number;
  outCount?: number;
}) {

  return (
    <>

      <View style={styles.tabsRow}>
        <TabButton
          label="IN"
          badge={inCount}
          active={tab === "IN"}
          icon={<LogIn size={16} color={tab === "IN" ? "#fff" : "#0042BF"} />}
          onPress={() => setTab("IN")}
        />
        {/* <TabButton
          label="OUT"
          badge={outCount}
          active={tab === "OUT"}
          icon={<LogOut size={16} color={tab === "OUT" ? "#fff" : "#0042BF"} />}
          onPress={() => setTab("OUT")}
        /> */}
      </View>
    </>
  );
}

function TabButton({
  label,
  active,
  icon,
  onPress,
  badge,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, active ? styles.tabBtnActive : styles.tabBtnIdle]}
    >
      {icon}
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {/* small badge */}
      <View style={styles.tabBadge}>
        <Text style={styles.tabBadgeText}>{badge ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#D9D9D9",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#0042BF" },
  headerSubtitle: { fontSize: 14, color: "#1E1E1E", marginTop: 4 },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },

  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    marginTop: 10,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabBtnActive: {
    backgroundColor: "#0042BF",
    borderColor: "#0042BF",
  },
  tabBtnIdle: {
    backgroundColor: "#fff",
    borderColor: "#0042BF",
  },
  tabText: { marginLeft: 6, fontWeight: "700", color: "#0042BF" },
  tabTextActive: { color: "#fff" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 20 },

  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  employeeName: { fontSize: 18, fontWeight: "700", color: "#1E1E1E", marginLeft: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inBadge: { backgroundColor: "#28a745" },
  outBadge: { backgroundColor: "#dc3545" },
  badgeText: { color: "#fff", fontSize: 14, fontWeight: "bold", marginLeft: 4 },
  entryDetails: { flexDirection: "row", marginBottom: 8 },
  detailItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  detailText: { fontSize: 14, color: "#888", marginLeft: 6 },
  entryFooter: { paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f5f5f5" },
  footerText: { fontSize: 12, color: "#888" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#1E1E1E", marginBottom: 8, textAlign: "center" },
  emptySubtext: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 20 },
  refreshButton: { backgroundColor: "#0042BF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  refreshButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  tabBadge: {
    marginLeft: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#0042BF",
  },
  tabBadgeText: {
    color: "#0042BF",
    fontWeight: "700",
    fontSize: 12,
  },
});
