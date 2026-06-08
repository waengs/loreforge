import { useEffect, useState } from 'react';
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
import { colors, fonts, radius, spacing } from '../../constants/theme';

const emptyForm = () => ({
  title: '',
  content: '',
  tags: [],
  characterIds: [],
  plotId: '',
  enabledRules: {},
});

export default function ManualStoryModal({
  visible,
  characters,
  plotSeeds,
  worldRules,
  onDismiss,
  onSave,
  onContinueWithAi,
}) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (visible) setForm(emptyForm());
  }, [visible]);

  const toggleCharacter = (id) => {
    setForm((prev) => {
      const has = prev.characterIds.includes(id);
      if (has) {
        return { ...prev, characterIds: prev.characterIds.filter((c) => c !== id) };
      }
      if (prev.characterIds.length >= 4) {
        Alert.alert('Character limit', 'Pick up to 4 characters for this story.');
        return prev;
      }
      return { ...prev, characterIds: [...prev.characterIds, id] };
    });
  };

  const toggleRule = (id) => {
    setForm((prev) => ({
      ...prev,
      enabledRules: { ...prev.enabledRules, [id]: !prev.enabledRules[id] },
    }));
  };

  const ruleMeta = (extra = {}) => ({
    ...extra,
    enabledRuleIds: enabledRuleIdsFromToggle(worldRules, form.enabledRules),
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Give your story a title.');
      return;
    }
    if (!form.content.trim()) {
      Alert.alert('Story required', 'Write something in the story field.');
      return;
    }
    onSave(
      ruleMeta({
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags,
        characterIds: form.characterIds,
        plotId: form.plotId || undefined,
        manual: true,
      })
    );
  };

  const handleContinueWithAi = () => {
    if (!form.plotId) {
      Alert.alert('Plot required', 'Select a plot seed to continue with AI.');
      return;
    }
    if (form.characterIds.length === 0) {
      Alert.alert('Characters required', 'Pick at least one character.');
      return;
    }
    onContinueWithAi(
      ruleMeta({
        title: form.title.trim() || 'Untitled',
        content: form.content.trim(),
        tags: form.tags,
        characterIds: form.characterIds,
        plotId: form.plotId,
      })
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Write Story</Text>
            <Text style={styles.subtitle}>No AI, your words only</Text>
          </View>
          <TouchableOpacity onPress={onDismiss}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <TextInput
              value={form.title}
              onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
              placeholder="Story title..."
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
              cursorColor={colors.gold}
              selectionColor={colors.primary}
            />
          </View>

          {characters.length > 0 ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CHARACTERS (UP TO 4)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castRow}
              >
                {characters.map((c) => {
                  const selected = form.characterIds.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.castItem, selected && styles.castItemActive]}
                      onPress={() => toggleCharacter(c.id)}
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

          <View style={styles.field}>
            <TagListInput
              tags={form.tags}
              onChange={(tags) => setForm((p) => ({ ...p, tags }))}
            />
          </View>

          {plotSeeds.length > 0 ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PLOT SEED (OPTIONAL)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.plotRow}
              >
                <TouchableOpacity
                  style={[styles.plotPill, !form.plotId && styles.plotPillActive]}
                  onPress={() => setForm((p) => ({ ...p, plotId: '' }))}
                >
                  <Text style={[styles.plotText, !form.plotId && styles.plotTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {plotSeeds.map((p) => {
                  const selected = form.plotId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.plotPill, selected && styles.plotPillActive]}
                      onPress={() => setForm((prev) => ({ ...prev, plotId: p.id }))}
                    >
                      <Text
                        style={[styles.plotText, selected && styles.plotTextActive]}
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

          {worldRules.length > 0 ? (
            <View style={styles.field}>
              <WorldRuleToggleList
                rules={worldRules}
                enabledRules={form.enabledRules}
                onToggle={toggleRule}
                label="WORLD RULES"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>STORY</Text>
            <TextInput
              value={form.content}
              onChangeText={(t) => setForm((p) => ({ ...p, content: t }))}
              placeholder="Start writing your scene..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={12}
              style={[styles.input, styles.storyInput]}
              cursorColor={colors.gold}
              selectionColor={colors.primary}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinueWithAi}>
              <MaterialCommunityIcons name="auto-fix" size={16} color={colors.gold} />
              <Text style={styles.continueText}>Continue with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save to Library</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: fonts.bodyItalic,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.md,
  },
  nameInput: {
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
  fieldLabel: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
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
  input: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minHeight: 44,
  },
  storyInput: {
    minHeight: 220,
    paddingTop: spacing.sm,
    lineHeight: 22,
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
  plotText: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  plotTextActive: {
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    backgroundColor: colors.surfaceCard,
  },
  continueText: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  cancelText: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saveText: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
