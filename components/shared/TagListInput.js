import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { colors, fonts, radius, spacing } from '../../constants/theme';

export default function TagListInput({
  label = 'GENRE / TAGS',
  hint = 'Add 0 or more, optional',
  tags,
  onChange,
  placeholder = 'e.g. fantasy',
}) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const value = draft.trim();
    if (!value) return;
    const exists = tags.some((t) => t.toLowerCase() === value.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      {tags.length > 0 ? (
        <View style={styles.list}>
          {tags.map((tag, index) => (
            <View key={`${tag}-${index}`} style={styles.listRow}>
              <Text style={styles.listText} numberOfLines={1}>
                {tag}
              </Text>
              <TouchableOpacity
                onPress={() => removeTag(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No tags yet</Text>
      )}

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          cursorColor={colors.gold}
          selectionColor={colors.primary}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
          onPress={addTag}
          disabled={!draft.trim()}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  list: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  listText: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
  empty: {
    fontFamily: fonts.bodyItalic,
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
});
