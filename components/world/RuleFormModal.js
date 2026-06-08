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
import {
  categoryMeta,
  colors,
  fonts,
  radius,
  spacing,
} from '../../constants/theme';
import { WORLD_CATEGORIES } from '../../store/useLoreStore';

export const emptyRuleForm = () => ({
  name: '',
  category: WORLD_CATEGORIES[0],
  ruleText: '',
  characterIds: [],
});

export default function RuleFormModal({
  visible,
  editingRule,
  characters,
  onDismiss,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(emptyRuleForm());
  const [charMode, setCharMode] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingRule) {
      const ids = editingRule.characterIds || [];
      setForm({
        name: editingRule.name || '',
        category: editingRule.category || WORLD_CATEGORIES[0],
        ruleText: editingRule.ruleText || '',
        characterIds: ids,
      });
      setCharMode(ids.length > 0);
    } else {
      setForm(emptyRuleForm());
      setCharMode(false);
    }
  }, [visible, editingRule]);

  const toggleCharacter = (id) => {
    setForm((prev) => {
      const has = prev.characterIds.includes(id);
      if (has) {
        return { ...prev, characterIds: prev.characterIds.filter((c) => c !== id) };
      }
      return { ...prev, characterIds: [...prev.characterIds, id] };
    });
  };

  const handleSave = () => {
    if (!form.name.trim() && !form.ruleText.trim()) {
      Alert.alert('Rule required', 'Add a name or description for this rule.');
      return;
    }
    onSave({
      ...form,
      characterIds: charMode ? form.characterIds : [],
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingRule ? 'Edit Rule' : 'New Rule'}
          </Text>
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
              value={form.name}
              onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
              placeholder="Rule Name..."
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
              cursorColor={colors.gold}
              selectionColor={colors.primary}
            />
          </View>

          <TouchableOpacity
            style={[styles.charToggle, charMode && styles.charToggleActive]}
            onPress={() => {
              setCharMode((v) => {
                if (v) setForm((p) => ({ ...p, characterIds: [] }));
                return !v;
              });
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.charIcon, charMode && styles.charIconActive]}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={20}
                color={charMode ? colors.gold : colors.textMuted}
              />
            </View>
            <Text style={styles.charLabel}>Add character specific rule</Text>
          </TouchableOpacity>

          {charMode && characters.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charRow}
            >
              {characters.map((c) => {
                const selected = form.characterIds.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.charPill, selected && styles.charPillActive]}
                    onPress={() => toggleCharacter(c.id)}
                  >
                    <Text
                      style={[styles.charPillText, selected && styles.charPillTextActive]}
                      numberOfLines={1}
                    >
                      {c.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : charMode ? (
            <Text style={styles.hint}>
              No characters yet, this will save as a world rule.
            </Text>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              value={form.ruleText}
              onChangeText={(t) => setForm((p) => ({ ...p, ruleText: t }))}
              placeholder="Describe how this rule works in your world..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              style={[styles.input, styles.inputMulti]}
              cursorColor={colors.gold}
              selectionColor={colors.primary}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.filterLabel}>EASY ACCESS FILTERS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {WORLD_CATEGORIES.map((cat) => {
              const meta = categoryMeta[cat];
              const selected = form.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, selected && styles.filterPillActive]}
                  onPress={() => setForm((p) => ({ ...p, category: cat }))}
                >
                  <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                    {meta?.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          {editingRule ? (
            <TouchableOpacity onPress={onDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <View style={styles.footerBtns}>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
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
  title: {
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 18,
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
  charToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
  },
  charToggleActive: {
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  charIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charIconActive: {
    borderColor: colors.goldMuted,
    backgroundColor: colors.primaryDark,
  },
  charLabel: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  charRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  charPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
  },
  charPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.borderLight,
  },
  charPillText: {
    fontFamily: fonts.serif,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  charPillTextActive: {
    color: colors.text,
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
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
  inputMulti: {
    minHeight: 140,
    paddingTop: spacing.sm,
  },
  filterLabel: {
    fontFamily: fonts.serif,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.borderLight,
  },
  filterText: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  deleteText: {
    fontFamily: fonts.body,
    color: colors.error,
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
