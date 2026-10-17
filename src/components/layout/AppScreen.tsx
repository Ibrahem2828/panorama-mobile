import type { ReactElement, ReactNode } from 'react';
import type { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '../../theme';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  safeArea?: boolean;
  horizontalPadding?: boolean;
  backgroundColor?: string;
  /** Pull-to-refresh for scrolling screens (use BrandRefreshControl). */
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Content is centred and capped to this width on tablets; `false` lets it span the screen. */
  maxContentWidth?: number | false;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({
  children,
  scroll = false,
  safeArea = true,
  horizontalPadding = true,
  backgroundColor = colors.background.primary,
  refreshControl,
  maxContentWidth = layout.maxContentWidth,
  style,
  contentContainerStyle,
}: AppScreenProps) {
  // Plain View + inset padding: the safe-area-context SafeAreaView measured to zero height inside the tab navigator.
  const insets = useSafeAreaInsets();
  const Container = View;
  const insetStyle = { paddingTop: safeArea ? insets.top : 0 };
  const widthStyle =
    maxContentWidth === false ? styles.fill : [styles.capped, { maxWidth: maxContentWidth }];

  if (scroll) {
    return (
      <Container style={[styles.root, { backgroundColor }, insetStyle, style]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            horizontalPadding ? styles.horizontalPadding : null,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          <View style={widthStyle}>{children}</View>
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container style={[styles.root, { backgroundColor }, insetStyle, style]}>
      <View style={[styles.inner, horizontalPadding ? styles.horizontalPadding : null, widthStyle]}>
        {children}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  fill: {
    flexGrow: 1,
    width: '100%',
  },
  capped: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
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
