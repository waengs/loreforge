import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from '../../components/home/HomeHeader';
import QuickActionRow from '../../components/home/QuickActionRow';
import StoryGenerationCard from '../../components/home/StoryGenerationCard';
import StoryDetailModal from '../../components/library/StoryDetailModal';
import WorldSwitcher from '../../components/WorldSwitcher';
import { pickGreeting } from '../../constants/greetings';
import { colors, fonts, spacing } from '../../constants/theme';
import { useGenerateDraftStore } from '../../store/useGenerateDraftStore';
import { useLoreStore } from '../../store/useLoreStore';
import {
  selectCharacters,
  selectPlotSeeds,
  selectStoryHistory,
  selectWorldRules,
} from '../../store/selectors';

export default function HomeScreen() {
  const router = useRouter();
  const characters = useLoreStore(selectCharacters);
  const plotSeeds = useLoreStore(selectPlotSeeds);
  const worldRules = useLoreStore(selectWorldRules);
  const storyHistory = useLoreStore(selectStoryHistory);
  const updateStory = useLoreStore((s) => s.updateStory);
  const deleteStory = useLoreStore((s) => s.deleteStory);
  const setGenerateDraft = useGenerateDraftStore((s) => s.setDraft);
  const [selectedStory, setSelectedStory] = useState(null);
  const [greeting, setGreeting] = useState(() => pickGreeting());

  useFocusEffect(
    useCallback(() => {
      setGreeting(pickGreeting());
    }, [])
  );

  const featured = storyHistory[0];

  const handleQuickAction = (key) => {
    if (key === 'chara') router.push('/characters?new=1');
    else if (key === 'rule') router.push('/world?tab=Rules&new=1');
    else if (key === 'plot') router.push('/world?tab=Plots&new=1');
  };

  const getPlot = (plotId) => plotSeeds.find((p) => p.id === plotId);

  const handleSaveStory = (data) => {
    if (!selectedStory) return;
    updateStory(selectedStory.id, data);
    setSelectedStory((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const handleDeleteStory = () => {
    if (!selectedStory) return;
    deleteStory(selectedStory.id);
    setSelectedStory(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader greeting={greeting} />
      <WorldSwitcher />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuickActionRow onAction={handleQuickAction} />

        <View style={styles.sectionHead}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.goldMuted} />
          <Text style={styles.sectionTitle}>PAST STORIES</Text>
        </View>

        {!featured ? (
          <Text style={styles.empty}>
            No stories yet, tap GENERATE + to write your first scene.
          </Text>
        ) : (
          <>
            <StoryGenerationCard
              story={featured}
              characters={characters}
              plot={getPlot(featured.plotId)}
              onPress={() => setSelectedStory(featured)}
            />
            {storyHistory.length > 1 ? (
              <TouchableOpacity
                style={styles.viewAll}
                onPress={() => router.push('/library')}
              >
                <Text style={styles.viewAllText}>
                  View all {storyHistory.length} stories →
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>

      <StoryDetailModal
        visible={!!selectedStory}
        story={selectedStory}
        characters={characters}
        plot={selectedStory ? getPlot(selectedStory.plotId) : null}
        plotSeeds={plotSeeds}
        worldRules={worldRules}
        onDismiss={() => setSelectedStory(null)}
        onSave={handleSaveStory}
        onDelete={handleDeleteStory}
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
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  viewAll: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  viewAllText: {
    fontFamily: fonts.bodySemi,
    color: colors.gold,
    fontSize: 14,
  },
});
