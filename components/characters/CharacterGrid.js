import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import CharacterAvatar from '../CharacterAvatar';
import { colors, fonts, radius, spacing } from '../../constants/theme';

const COLS = 3;
const GAP = spacing.sm;
const PAD = spacing.md;
const CARD_W =
  (Dimensions.get('window').width - PAD * 2 - GAP * (COLS - 1)) / COLS;
const AVATAR_SIZE = CARD_W - spacing.sm * 2;

export default function CharacterGrid({ characters, onPressCharacter }) {
  if (!characters.length) {
    return (
      <Text style={styles.empty}>
        No characters yet, import from another world or add a new one.
      </Text>
    );
  }

  return (
    <View style={styles.grid}>
      {characters.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => onPressCharacter(item)}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrap}>
            <CharacterAvatar
              name={item.name}
              imageUri={item.imageUri}
              size={AVATAR_SIZE}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {item.name || 'Unnamed'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  name: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});
