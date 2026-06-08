import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from './home/HomeHeader';
import WorldSwitcher from './WorldSwitcher';
import { colors, spacing } from '../constants/theme';

export default function ScreenLayout({
  showSettings = true,
  showWorldSwitcher = true,
  showHeader = true,
  children,
  scroll = true,
  noPadding,
}) {
  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        noPadding && styles.noPadding,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, noPadding && styles.noPadding]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {showHeader ? <HomeHeader showSettings={showSettings} /> : null}
      {showWorldSwitcher ? <WorldSwitcher /> : null}
      {body}
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
    paddingBottom: 100,
  },
  noPadding: {
    padding: 0,
    paddingBottom: 100,
  },
  flex: {
    flex: 1,
    padding: spacing.md,
  },
});
