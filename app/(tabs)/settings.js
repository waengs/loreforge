import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Menu, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from '../../components/home/HomeHeader';
import LoreForgeLogo from '../../components/LoreForgeLogo';
import {
  getDefaultHostHint,
  getSuggestedDevHost,
  testOllamaConnection,
} from '../../services/ollama';
import { getOllamaBaseUrl } from '../../store/useSettingsStore';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useLoreStore } from '../../store/useLoreStore';
import { useSettingsStore } from '../../store/useSettingsStore';

function SectionHead({ icon, title }) {
  return (
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.goldMuted} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SettingsRow({ icon, title, description, onPress, right }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
      {onPress && !right ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const ollamaHost = useSettingsStore((s) => s.ollamaHost);
  const ollamaModel = useSettingsStore((s) => s.ollamaModel);
  const autoSave = useSettingsStore((s) => s.autoSave);
  const setOllamaHost = useSettingsStore((s) => s.setOllamaHost);
  const setOllamaModel = useSettingsStore((s) => s.setOllamaModel);
  const setAutoSave = useSettingsStore((s) => s.setAutoSave);
  const exportWorld = useLoreStore((s) => s.exportWorld);
  const importWorld = useLoreStore((s) => s.importWorld);

  const [connected, setConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [models, setModels] = useState([]);
  const [testing, setTesting] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  const suggestedIp = getSuggestedDevHost();
  const fullUrl = getOllamaBaseUrl();

  const runTest = useCallback(async () => {
    setTesting(true);
    const result = await testOllamaConnection();
    setConnected(result.ok);
    setStatusMsg(result.message);
    setModels(result.models);
    setTesting(false);
    return result;
  }, [ollamaHost, ollamaModel]);

  useEffect(() => {
    runTest();
    const t = setInterval(runTest, 15000);
    return () => clearInterval(t);
  }, [runTest]);

  const applySuggestedHost = () => {
    if (Platform.OS === 'android' && !suggestedIp) {
      setOllamaHost('10.0.2.2');
    } else if (suggestedIp) {
      setOllamaHost(suggestedIp);
    } else {
      setOllamaHost('localhost');
    }
    setTimeout(runTest, 300);
  };

  const handleExport = async () => {
    try {
      await Share.share({ message: exportWorld(), title: 'LoreForge World' });
    } catch (e) {
      Alert.alert('Export failed', e.message);
    }
  };

  const handleImport = () => {
    try {
      importWorld(importJson);
      setImportJson('');
      setShowImport(false);
      Alert.alert('Imported', 'World data restored.');
    } catch {
      Alert.alert('Invalid JSON', 'Could not parse import data.');
    }
  };

  const handleTestConnection = async () => {
    const r = await runTest();
    if (r.ok) {
      Alert.alert('Connected', r.message);
    } else {
      Alert.alert(
        'Cannot connect',
        `${r.message}\n\n${fullUrl}\n\nOn your PC:\n1. Install & open Ollama\n2. Run: ollama pull ${ollamaModel}\n3. For a phone: set host to your PC's Wi‑Fi IP\n4. Allow port 11434 in Windows Firewall`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader showBack showSettings={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHead icon="lan-connect" title="OLLAMA CONNECTION" />

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>ENDPOINT</Text>
          <Text style={styles.endpoint}>{fullUrl}</Text>

          <Text style={styles.fieldLabel}>HOST (IP OR HOSTNAME)</Text>
          <TextInput
            value={ollamaHost}
            onChangeText={setOllamaHost}
            onBlur={runTest}
            placeholder={getDefaultHostHint()}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            cursorColor={colors.gold}
            selectionColor={colors.primary}
          />

          <View style={styles.chipRow}>
            {suggestedIp ? (
              <TouchableOpacity style={styles.chip} onPress={applySuggestedHost}>
                <Text style={styles.chipText}>Use {suggestedIp}</Text>
              </TouchableOpacity>
            ) : Platform.OS === 'android' ? (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setOllamaHost('10.0.2.2');
                  setTimeout(runTest, 300);
                }}
              >
                <Text style={styles.chipText}>Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.chip}
              onPress={() => {
                setOllamaHost('localhost');
                setTimeout(runTest, 300);
              }}
            >
              <Text style={styles.chipText}>localhost</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            {testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={[styles.dot, connected && styles.dotOn]} />
            )}
            <Text style={styles.statusText}>
              {testing ? 'Checking…' : connected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          {statusMsg ? <Text style={styles.statusDetail}>{statusMsg}</Text> : null}

          <Text style={styles.fieldLabel}>MODEL</Text>
          <Menu
            visible={modelMenuOpen}
            onDismiss={() => setModelMenuOpen(false)}
            anchor={
              <View style={styles.modelRow}>
                <TextInput
                  value={ollamaModel}
                  onChangeText={setOllamaModel}
                  onBlur={runTest}
                  placeholder="llama3"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.modelInput]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={colors.gold}
                  selectionColor={colors.primary}
                />
                {models.length > 0 ? (
                  <TouchableOpacity
                    style={styles.modelMenuBtn}
                    onPress={() => setModelMenuOpen(true)}
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          >
            {models.map((m) => (
              <Menu.Item
                key={m}
                title={m}
                onPress={() => {
                  setOllamaModel(m.split(':')[0]);
                  setModelMenuOpen(false);
                  setTimeout(runTest, 300);
                }}
              />
            ))}
          </Menu>

          <TouchableOpacity
            style={[styles.primaryBtn, testing && styles.primaryBtnDisabled]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <>
                <MaterialCommunityIcons name="lan-connect" size={18} color={colors.gold} />
                <Text style={styles.primaryBtnText}>Test connection</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Web: use localhost if Ollama runs on this PC.'
              : `Phone on Wi‑Fi: host must be your PC's LAN IP (not localhost). ${getDefaultHostHint()}`}
          </Text>
        </View>

        <SectionHead icon="database-outline" title="DATA MANAGEMENT" />

        <View style={styles.card}>
          <SettingsRow
            icon="download-outline"
            title="Export World (JSON)"
            description="Share your lore as a backup file"
            onPress={handleExport}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="upload-outline"
            title="Import World (JSON)"
            description="Restore from a backup"
            onPress={() => setShowImport((v) => !v)}
          />
          {showImport ? (
            <View style={styles.importBlock}>
              <Text style={styles.fieldLabel}>PASTE JSON</Text>
              <TextInput
                value={importJson}
                onChangeText={setImportJson}
                multiline
                numberOfLines={6}
                placeholder="Paste exported world JSON here…"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.importInput]}
                cursorColor={colors.gold}
                selectionColor={colors.primary}
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleImport}>
                <Text style={styles.primaryBtnText}>Import</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <SectionHead icon="cog-outline" title="APP SETTINGS" />

        <View style={styles.card}>
          <SettingsRow
            icon="content-save-outline"
            title="Auto-save stories"
            description="Save to library after generation"
            right={
              <Switch value={autoSave} onValueChange={setAutoSave} color={colors.primary} />
            }
          />
        </View>

        <View style={styles.about}>
          <LoreForgeLogo size={64} />
          <Text style={styles.aboutTitle}>LoreForge</Text>
          <Text style={styles.aboutVer}>v{Constants.expoConfig?.version ?? '1.0.1'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  endpoint: {
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipText: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  dotOn: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  statusDetail: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modelInput: {
    flex: 1,
    marginBottom: 0,
  },
  modelMenuBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 44,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
    fontSize: 15,
  },
  rowDesc: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  rowRight: {
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  importBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  importInput: {
    minHeight: 120,
    paddingTop: spacing.sm,
  },
  about: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  aboutTitle: {
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  aboutVer: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
  },
});
