import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import CharacterAvatar from '../CharacterAvatar';
import TagListInput from '../shared/TagListInput';
import WorldRuleToggleList, {
  enabledRuleIdsFromToggle,
  toggleStateFromRuleIds,
} from '../world/WorldRuleToggleList';
import { categoryMeta, colors, fonts, radius, spacing } from '../../constants/theme';
import { timeAgo } from '../../utils/timeAgo';
import { normalizeStoryTags } from '../../utils/storyTags';

function rulesForStory(story, worldRules) {
  const ids = story.enabledRuleIds;
  if (ids?.length) {
    return worldRules.filter((r) => ids.includes(r.id));
  }
  const charIds = new Set(story.characterIds || []);
  return worldRules.filter((rule) => {
    const ruleCharIds = rule.characterIds || [];
    if (ruleCharIds.length === 0) return true;
    return ruleCharIds.some((id) => charIds.has(id));
  });
}

function initialEnabledRules(story, worldRules) {
  if (story.enabledRuleIds?.length) {
    return toggleStateFromRuleIds(story.enabledRuleIds);
  }
  const inferred = rulesForStory(story, worldRules);
  if (inferred.length) {
    return toggleStateFromRuleIds(inferred.map((r) => r.id));
  }
  return {};
}

export default function StoryDetailModal({
  visible,
  story,
  characters,
  plot,
  plotSeeds,
  worldRules,
  onDismiss,
  onSave,
  onDelete,
  onContinueGenerating,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [plotId, setPlotId] = useState('');
  const [enabledRules, setEnabledRules] = useState({});

  useEffect(() => {
    if (!visible || !story) return;
    setTitle(story.title || '');
    setContent(story.content || '');
    setTags(normalizeStoryTags(story.tags));
    setPlotId(story.plotId || '');
    setEnabledRules(initialEnabledRules(story, worldRules));
    setEditing(false);
  }, [visible, story, worldRules]);

  const cast = useMemo(
    () =>
      (story?.characterIds || [])
        .map((id) => characters.find((c) => c.id === id))
        .filter(Boolean),
    [story, characters]
  );

  const linkedRules = useMemo(
    () => (story ? rulesForStory(story, worldRules) : []),
    [story, worldRules]
  );

  const storyTags = useMemo(
    () => (editing ? tags : story ? normalizeStoryTags(story.tags) : []),
    [editing, tags, story]
  );

  const displayPlot = useMemo(() => {
    const id = editing ? plotId : story?.plotId;
    if (!id) return null;
    return plotSeeds?.find((p) => p.id === id) || (!editing ? plot : null);
  }, [editing, plotId, story?.plotId, plotSeeds, plot]);

  const toggleRule = (id) => {
    setEnabledRules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Story empty', 'Add some text before saving.');
      return;
    }
    onSave({
      title: title.trim() || 'Untitled',
      content: content.trim(),
      tags,
      plotId: plotId || undefined,
      enabledRuleIds: enabledRuleIdsFromToggle(worldRules, enabledRules),
    });
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete story', 'Remove this story from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete();
          onDismiss();
        },
      },
    ]);
  };

  if (!story) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          {editing ? (
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              placeholder="Story title..."
              placeholderTextColor={colors.textMuted}
              cursorColor={colors.gold}
            />
          ) : (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {story.title || 'Story Title'}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.editBtn, editing && styles.editBtnActive]}
            onPress={() => (editing ? handleSave() : setEditing(true))}
          >
            <MaterialCommunityIcons
              name={editing ? 'check' : 'pencil-outline'}
              size={18}
              color={editing ? colors.gold : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.metaRow}>
            <Text style={styles.time}>{timeAgo(story.createdAt)}</Text>
            {editing ? (
              <TouchableOpacity
                onPress={() => {
                  setTags(normalizeStoryTags(story.tags));
                  setTitle(story.title || '');
                  setContent(story.content || '');
                  setPlotId(story.plotId || '');
                  setEnabledRules(initialEnabledRules(story, worldRules));
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelEdit}>Cancel edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {cast.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CHARACTERS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castRow}
              >
                {cast.map((c) => (
                  <View key={c.id} style={styles.castItem}>
                    <CharacterAvatar name={c.name} imageUri={c.imageUri} size={52} />
                    <Text style={styles.castName} numberOfLines={1}>
                      {c.name.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {(editing || storyTags.length > 0) ? (
            <View style={styles.section}>
              {editing ? (
                <TagListInput
                  tags={tags}
                  onChange={setTags}
                  hint="Optional, add any that fit"
                />
              ) : (
                <>
                  <Text style={styles.sectionLabel}>GENRE / TAGS</Text>
                  <View style={styles.tagList}>
                    {storyTags.map((tag) => (
                      <View key={tag} style={styles.tagRow}>
                        <Text style={styles.tagListText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}

          {editing && plotSeeds?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PLOT SEED</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.plotRow}
              >
                <TouchableOpacity
                  style={[styles.plotPill, !plotId && styles.plotPillActive]}
                  onPress={() => setPlotId('')}
                >
                  <Text style={[styles.plotPillText, !plotId && styles.plotPillTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {plotSeeds.map((p) => {
                  const selected = plotId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.plotPill, selected && styles.plotPillActive]}
                      onPress={() => setPlotId(p.id)}
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
          ) : displayPlot ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PLOT</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>{displayPlot.title}</Text>
                {displayPlot.logline ? (
                  <Text style={styles.infoBody}>{displayPlot.logline}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {editing && worldRules.length > 0 ? (
            <View style={styles.section}>
              <WorldRuleToggleList
                rules={worldRules}
                enabledRules={enabledRules}
                onToggle={toggleRule}
              />
            </View>
          ) : linkedRules.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WORLD RULES</Text>
              {linkedRules.map((rule) => {
                const meta = categoryMeta[rule.category] || categoryMeta.history;
                const ruleName =
                  rule.name?.trim() ||
                  rule.ruleText?.slice(0, 48) ||
                  'Untitled rule';
                return (
                  <View key={rule.id} style={styles.ruleRow}>
                    <View style={[styles.ruleTag, { borderColor: meta.color }]}>
                      <Text style={[styles.ruleTagText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.ruleName}>{ruleName}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STORY</Text>
            {editing ? (
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                style={styles.storyInput}
                cursorColor={colors.gold}
                selectionColor={colors.primary}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.storyText}>{story.content}</Text>
            )}
          </View>

          {editing ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
              <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete story</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        {!editing && onContinueGenerating ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => onContinueGenerating(story)}
            >
              <MaterialCommunityIcons name="auto-fix" size={18} color={colors.gold} />
              <Text style={styles.continueText}>Continue generating</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 18,
  },
  titleInput: {
    flex: 1,
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnActive: {
    borderColor: colors.goldMuted,
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  time: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
  },
  cancelEdit: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  castRow: {
    gap: spacing.md,
  },
  castItem: {
    alignItems: 'center',
    width: 64,
  },
  castName: {
    fontFamily: fonts.serif,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tagList: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tagRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagListText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  infoBody: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
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
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  ruleTagText: {
    fontFamily: fonts.serif,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  ruleName: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  storyText: {
    fontFamily: fonts.body,
    color: colors.outputText,
    fontSize: 15,
    lineHeight: 24,
  },
  storyInput: {
    minHeight: 280,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.body,
    color: colors.outputText,
    fontSize: 15,
    lineHeight: 24,
    padding: spacing.md,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  deleteText: {
    fontFamily: fonts.body,
    color: colors.error,
    fontSize: 14,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    backgroundColor: colors.surfaceCard,
  },
  continueText: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
