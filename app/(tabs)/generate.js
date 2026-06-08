import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import CharacterAvatar from '../../components/CharacterAvatar';
import HomeHeader from '../../components/home/HomeHeader';
import TagListInput from '../../components/shared/TagListInput';
import WorldRuleToggleList, {
  enabledRuleIdsFromToggle,
  toggleStateFromRuleIds,
} from '../../components/world/WorldRuleToggleList';
import WorldSwitcher from '../../components/WorldSwitcher';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { checkOllamaHealth, generateStory } from '../../services/ollama';
import { useGenerateDraftStore } from '../../store/useGenerateDraftStore';
import { useLoreStore } from '../../store/useLoreStore';
import {
  selectCharacters,
  selectPlotSeeds,
  selectWorldRules,
} from '../../store/selectors';
import { useSettingsStore } from '../../store/useSettingsStore';
import { normalizeStoryTags } from '../../utils/storyTags';

function emptyFormState() {
  return {
    selectedCharIds: [],
    selectedPlotId: '',
    storyTags: [],
    enabledRules: {},
    existingContent: '',
    storyTitle: '',
    continuingStoryId: null,
    story: '',
  };
}

export default function GenerateScreen() {
  const router = useRouter();
  const characters = useLoreStore(selectCharacters);
  const plotSeeds = useLoreStore(selectPlotSeeds);
  const worldRules = useLoreStore(selectWorldRules);
  const getRelationshipsForCharacters = useLoreStore(
    (s) => s.getRelationshipsForCharacters
  );
  const saveStory = useLoreStore((s) => s.saveStory);
  const updateStory = useLoreStore((s) => s.updateStory);
  const autoSave = useSettingsStore((s) => s.autoSave);
  const draft = useGenerateDraftStore((s) => s.draft);
  const clearDraft = useGenerateDraftStore((s) => s.clearDraft);
  const freshSession = useGenerateDraftStore((s) => s.freshSession);
  const consumeFreshSession = useGenerateDraftStore((s) => s.consumeFreshSession);

  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [storyTags, setStoryTags] = useState([]);
  const [enabledRules, setEnabledRules] = useState({});
  const [existingContent, setExistingContent] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [continuingStoryId, setContinuingStoryId] = useState(null);
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');
  const [ollamaOk, setOllamaOk] = useState(null);

  const applyFormState = useCallback((state) => {
    setSelectedCharIds(state.selectedCharIds);
    setSelectedPlotId(state.selectedPlotId);
    setStoryTags(state.storyTags);
    setEnabledRules(state.enabledRules);
    setExistingContent(state.existingContent);
    setStoryTitle(state.storyTitle);
    setContinuingStoryId(state.continuingStoryId);
    setStory(state.story);
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkOllamaHealth().then(setOllamaOk);

      if (freshSession) {
        applyFormState(emptyFormState());
        consumeFreshSession();
        return;
      }

      if (!draft) return;

      applyFormState({
        selectedCharIds: draft.characterIds || [],
        selectedPlotId: draft.plotId || '',
        storyTags: normalizeStoryTags(draft.tags),
        enabledRules: toggleStateFromRuleIds(draft.enabledRuleIds),
        existingContent: draft.content || '',
        storyTitle: draft.title || '',
        continuingStoryId: draft.storyId || null,
        story: '',
      });
      clearDraft();
    }, [freshSession, draft, applyFormState, consumeFreshSession, clearDraft])
  );

  const isContinuation = !!existingContent.trim();

  const toggleChar = (id) => {
    setSelectedCharIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) {
        Alert.alert('Character limit', 'Pick up to 4 characters for this story.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleRule = (id) => {
    setEnabledRules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeRules = () => {
    const enabled = worldRules.filter((w) => enabledRules[w.id]);
    return enabled.length > 0 ? enabled : worldRules;
  };

  const handleGenerate = async () => {
    const plot = plotSeeds.find((p) => p.id === selectedPlotId);
    if (!plot) {
      Alert.alert('Select a plot', 'Choose a plot seed.');
      return;
    }
    if (selectedCharIds.length === 0) {
      Alert.alert('Select characters', 'Pick at least one character.');
      return;
    }

    const chars = characters.filter((c) => selectedCharIds.includes(c.id));
    const rels = getRelationshipsForCharacters(selectedCharIds);
    const title = storyTitle.trim() || plot.title;

    setLoading(true);
    try {
      const result = await generateStory(
        chars,
        rels,
        plot,
        activeRules(),
        storyTags,
        existingContent
      );
      const merged = existingContent.trim()
        ? `${existingContent.trim()}\n\n${result}`
        : result;
      setStory(merged);
      if (autoSave && result) {
        const meta = {
          characterIds: selectedCharIds,
          plotId: selectedPlotId,
          tags: storyTags,
          enabledRuleIds: enabledRuleIdsFromToggle(worldRules, enabledRules),
          manual: false,
        };
        if (continuingStoryId) {
          updateStory(continuingStoryId, {
            title,
            content: merged,
            ...meta,
          });
        } else {
          saveStory(title, merged, meta);
        }
      }
    } catch (e) {
      Alert.alert('Generation failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!story) return;
    await Clipboard.setStringAsync(story);
    setSnack('Copied to clipboard');
  };

  const handleSave = () => {
    const plot = plotSeeds.find((p) => p.id === selectedPlotId);
    if (!story.trim()) return;
    const title = storyTitle.trim() || plot?.title || 'Untitled';
    const meta = {
      characterIds: selectedCharIds,
      plotId: selectedPlotId,
      tags: storyTags,
      enabledRuleIds: enabledRuleIdsFromToggle(worldRules, enabledRules),
      manual: false,
    };
    if (continuingStoryId) {
      updateStory(continuingStoryId, {
        title,
        content: story,
        ...meta,
      });
    } else {
      saveStory(title, story, meta);
    }
    setSnack('Saved to library');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader showBack showSettings={false} />
      <WorldSwitcher />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {ollamaOk === false ? (
          <TouchableOpacity
            style={styles.connBanner}
            onPress={() => router.push('/settings')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="lan-disconnect" size={20} color={colors.gold} />
            <Text style={styles.connText}>
              Ollama not connected, tap to open Settings
            </Text>
          </TouchableOpacity>
        ) : null}

        {isContinuation ? (
          <View style={styles.continueBanner}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={18}
              color={colors.gold}
            />
            <Text style={styles.continueBannerText}>
              Continuing your story, AI will pick up where you left off
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORY TITLE</Text>
          <TextInput
            value={storyTitle}
            onChangeText={setStoryTitle}
            placeholder="Name your story..."
            placeholderTextColor={colors.textMuted}
            style={styles.titleInput}
            cursorColor={colors.gold}
            selectionColor={colors.primary}
          />
        </View>

        {characters.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CHARACTERS (UP TO 4)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castRow}
            >
              {characters.map((c) => {
                const selected = selectedCharIds.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.castItem, selected && styles.castItemActive]}
                    onPress={() => toggleChar(c.id)}
                    activeOpacity={0.85}
                  >
                    <CharacterAvatar name={c.name} imageUri={c.imageUri} size={48} />
                    <Text
                      style={[styles.castName, selected && styles.castNameActive]}
                      numberOfLines={1}
                    >
                      {c.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {plotSeeds.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PLOT SEED</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plotRow}
            >
              {plotSeeds.map((p) => {
                const selected = selectedPlotId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.plotPill, selected && styles.plotPillActive]}
                    onPress={() => setSelectedPlotId(p.id)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.plotPillText, selected && styles.plotPillTextActive]}
                      numberOfLines={1}
                    >
                      {p.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <TagListInput
            tags={storyTags}
            onChange={setStoryTags}
            hint="Optional, add any that fit"
          />
        </View>

        {worldRules.length > 0 ? (
          <View style={styles.section}>
            <WorldRuleToggleList
              rules={worldRules}
              enabledRules={enabledRules}
              onToggle={toggleRule}
            />
          </View>
        ) : null}

        {isContinuation && existingContent.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR STORY SO FAR</Text>
            <View style={styles.storySoFarCard}>
              <ScrollView
                style={styles.storySoFarScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text style={styles.storySoFarText}>{existingContent.trim()}</Text>
              </ScrollView>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="auto-fix" size={18} color={colors.background} />
              <Text style={styles.generateBtnText}>
                {isContinuation ? 'Continue Story' : 'Generate Story'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.loadingText}>Writing your scene…</Text>
        ) : null}

        {story ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OUTPUT</Text>
            <View style={styles.outputCard}>
              <ScrollView style={styles.outputScroll} nestedScrollEnabled>
                <Text style={styles.outputText}>{story}</Text>
              </ScrollView>
              <View style={styles.outputActions}>
                <TouchableOpacity style={styles.outlineBtn} onPress={handleCopy} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.gold} />
                  <Text style={styles.outlineBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="bookmark-outline" size={18} color={colors.background} />
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack('')}
        duration={2500}
        style={styles.snackbar}
      >
        <Text style={styles.snackbarText}>{snack}</Text>
      </Snackbar>
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
    paddingBottom: 120,
  },
  connBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  connText: {
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 13,
    flex: 1,
  },
  continueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  continueBannerText: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  titleInput: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.serifBold,
    fontSize: 17,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  castRow: {
    gap: spacing.md,
  },
  castItem: {
    alignItems: 'center',
    width: 64,
    opacity: 0.65,
  },
  castItemActive: {
    opacity: 1,
  },
  castName: {
    fontFamily: fonts.serif,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  castNameActive: {
    color: colors.gold,
  },
  plotRow: {
    gap: spacing.sm,
  },
  plotPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 180,
  },
  plotPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.borderLight,
  },
  plotPillText: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  plotPillTextActive: {
    color: colors.text,
  },
  storySoFarCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    maxHeight: 200,
  },
  storySoFarScroll: {
    maxHeight: 168,
  },
  storySoFarText: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    fontFamily: fonts.serifBold,
    color: colors.background,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  loadingText: {
    fontFamily: fonts.bodyItalic,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  outputCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  outputScroll: {
    maxHeight: 280,
  },
  outputText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  outputActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    backgroundColor: colors.surfaceInset,
  },
  outlineBtnText: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontFamily: fonts.serifBold,
    color: colors.background,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  snackbar: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.md,
  },
  snackbarText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
});
