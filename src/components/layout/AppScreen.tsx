import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { colors, layout } from '../../theme';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  safeArea?: boolean;
  horizontalPadding?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({
  children,
  scroll = false,
  safeArea = true,
  horizontalPadding = true,
  backgroundColor = colors.background.primary,
  style,
  contentContainerStyle,
}: AppScreenProps) {
  const Container = safeArea ? SafeAreaView : View;

  if (scroll) {
    return (
      <Container style={[styles.root, { backgroundColor }, style]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            horizontalPadding ? styles.horizontalPadding : null,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container
      style={[
        styles.root,
        horizontalPadding ? styles.horizontalPadding : null,
        { backgroundColor },
        style,
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
  },
  horizontalPadding: {
    paddingHorizontal: layout.screenHorizontalPadding,
  },
});
