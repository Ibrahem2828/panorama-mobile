import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logger } from '../utils/logger';

type RootErrorBoundaryProps = { children: ReactNode };
type RootErrorBoundaryState = { error: Error | null };

/**
 * Last-resort boundary around the entire tree.
 *
 * It renders with React Native primitives and literal styles only, never the app's
 * component library, theme or i18n: any of those can be what threw, and a fallback
 * that crashes leaves the user with a blank screen and no way back.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled render error', {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const isDevelopment = __DEV__;
    const writingDirection = I18nManager.isRTL ? 'rtl' : 'ltr';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { writingDirection }]}>حدث خطأ غير متوقع</Text>
          <Text style={[styles.message, { writingDirection }]}>
            تعذّر عرض هذه الشاشة. يمكنك المحاولة مرة أخرى، وإن تكرر الخطأ أعد تشغيل التطبيق.
          </Text>
          {isDevelopment ? (
            <Text style={styles.diagnostic}>{`${error.name}: ${error.message}`}</Text>
          ) : null}
          <Pressable accessibilityRole="button" onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonLabel}>إعادة المحاولة</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#475467',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  diagnostic: {
    backgroundColor: '#FDECEC',
    borderRadius: 8,
    color: '#D93025',
    fontSize: 13,
    padding: 12,
    textAlign: 'left',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#002B7F',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
