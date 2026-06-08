import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import LoreForgeLogo from './LoreForgeLogo';
import { colors, fonts, spacing } from '../constants/theme';

export default function LoadingScreen({ fontsReady = false, progress = 0 }) {
  const fade = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: clampedProgress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [barWidth, clampedProgress]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <LoreForgeLogo size={72} style={styles.logoMark} />
        <Text
          style={[styles.title, fontsReady && styles.titleFont]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          LoreForge
        </Text>
        <Text
          style={[styles.tagline, fontsReady && styles.taglineFont]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          FORGE WORLDS, INSPIRE STORIES
        </Text>
        <Text
          style={[styles.subtitle, fontsReady && styles.subtitleFont]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Loading your worlds…
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: barWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: spacing.xl,
  },
  logoMark: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    letterSpacing: 1,
    textAlign: 'center',
    width: '100%',
  },
  titleFont: {
    fontFamily: fonts.serifBold,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  taglineFont: {
    fontFamily: fonts.serif,
  },
  subtitle: {
    color: colors.gold,
    fontSize: 15,
    marginTop: spacing.xl,
    textAlign: 'center',
    width: '100%',
  },
  subtitleFont: {
    fontFamily: fonts.bodyItalic,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceInset,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
});
