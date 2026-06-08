import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddStoryChoiceModal from '../../components/library/AddStoryChoiceModal';
import HomeHeader from '../../components/home/HomeHeader';
import StoryGenerationCard from '../../components/home/StoryGenerationCard';
import StoryDetailModal from '../../components/library/StoryDetailModal';
import ManualStoryModal from '../../components/library/ManualStoryModal';
import WorldSwitcher from '../../components/WorldSwitcher';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useGenerateDraftStore } from '../../store/useGenerateDraftStore';
import { useLoreStore } from '../../store/useLoreStore';
import {
  selectCharacters,
  selectPlotSeeds,
  selectStoryHistory,
  selectWorldRules,
} from '../../store/selectors';

export default function LibraryScreen() {
  const router = useRouter();
  const characters = useLoreStore(selectCharacters);
  const plotSeeds = useLoreStore(selectPlotSeeds);
  const worldRules = useLoreStore(selectWorldRules);
  const storyHistory = useLoreStore(selectStoryHistory);
  const saveStory = useLoreStore((s) => s.saveStory);
  const setGenerateDraft = useGenerateDraftStore((s) => s.setDraft);
  const requestFreshGenerate = useGenerateDraftStore((s) => s.requestFreshGenerate);
  const updateStory = useLoreStore((s) => s.updateStory);
  const deleteStory = useLoreStore((s) => s.deleteStory);
  const [selectedStory, setSelectedStory] = useState(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const getPlot = (plotId) => plotSeeds.find((p) => p.id === plotId);

  const handleSave = (data) => {
    if (!selectedStory) return;
    updateStory(selectedStory.id, data);
    setSelectedStory((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const handleDelete = () => {
    if (!selectedStory) return;
    deleteStory(selectedStory.id);
    setSelectedStory(null);
  };

  const handleManualSave = ({
    title,
    content,
    tags,
    characterIds,
    plotId,
    manual,
    enabledRuleIds,
  }) => {
    const story = saveStory(title, content, {
      tags,
      characterIds,
      plotId,
      manual,
      enabledRuleIds,
    });
    setManualOpen(false);
    setSelectedStory(story);
  };

  const handleContinueWithAi = (draft) => {
    setGenerateDraft({ ...draft, manual: true });
    setManualOpen(false);
    router.push('/generate');
  };

  const handleAi = () => {
    setChoiceOpen(false);
    requestFreshGenerate();
    router.push('/generate');
  };

  const handleManual = () => {
    setChoiceOpen(false);
    setManualOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader />
      <WorldSwitcher />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <View style={styles.sectionHead}>
            <MaterialCommunityIcons name="bookshelf" size={16} color={colors.goldMuted} />
            <Text style={styles.sectionTitle}>PAST STORIES</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setChoiceOpen(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.gold} />
            <Text style={styles.addBtnText}>add story</Text>
          </TouchableOpacity>
        </View>

        {storyHistory.length === 0 ? (
          <Text style={styles.empty}>
            No stories yet, tap add story to write one or generate with AI.
          </Text>
        ) : (
          storyHistory.map((story) => (
            <StoryGenerationCard
              key={story.id}
              story={story}
              characters={characters}
              plot={getPlot(story.plotId)}
              onPress={() => setSelectedStory(story)}
              compact
            />
          ))
        )}
      </ScrollView>

      <AddStoryChoiceModal
        visible={choiceOpen}
        onDismiss={() => setChoiceOpen(false)}
        onAi={handleAi}
        onManual={handleManual}
      />

      <ManualStoryModal
        visible={manualOpen}
        characters={characters}
        plotSeeds={plotSeeds}
        worldRules={worldRules}
        onDismiss={() => setManualOpen(false)}
        onSave={handleManualSave}
        onContinueWithAi={handleContinueWithAi}
      />

      <StoryDetailModal
        visible={!!selectedStory}
        story={selectedStory}
        characters={characters}
        plot={selectedStory ? getPlot(selectedStory.plotId) : null}
        plotSeeds={plotSeeds}
        worldRules={worldRules}
        onDismiss={() => setSelectedStory(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        onContinueGenerating={(story) => {
          setGenerateDraft({
            storyId: story.id,
            title: story.title,
            content: story.content || '',
            tags: story.tags || [],
            characterIds: story.characterIds || [],
            plotId: story.plotId || '',
            enabledRuleIds: story.enabledRuleIds || [],
            manual: story.manual,
          });
          setSelectedStory(null);
          router.push('/generate');
        }}
      />
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    fontFamily: fonts.bodySemi,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
