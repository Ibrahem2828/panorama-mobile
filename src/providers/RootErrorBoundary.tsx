import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { reportError } from '../services/monitoring';
import { logger } from '../utils/logger';

type RootErrorBoundaryProps = { children: ReactNode };
type RootErrorBoundaryState = { error: Error | null };

/**
 * Inline rather than from the i18n catalog, and keyed off the running layout direction
 * rather than the locale store: the store is one of the modules that could have thrown,
 * and a fallback that depends on it would fail exactly when it is needed.
 */
const COPY = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    message: 'تعذّر عرض هذه الشاشة. يمكنك المحاولة مرة أخرى، وإن تكرر الخطأ أعد تشغيل التطبيق.',
    retry: 'إعادة المحاولة',
  },
  en: {
    title: 'Something went wrong',
    message:
      'This screen could not be displayed. Try again, and restart the app if it keeps happening.',
    retry: 'Try again',
  },
} as const;

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
    reportError(error, { componentStack: info.componentStack });
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
    const isRTL = I18nManager.isRTL;
    const writingDirection = isRTL ? 'rtl' : 'ltr';
    const copy = isRTL ? COPY.ar : COPY.en;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { writingDirection }]}>{copy.title}</Text>
          <Text style={[styles.message, { writingDirection }]}>{copy.message}</Text>
          {isDevelopment ? (
            <Text style={styles.diagnostic}>{`${error.name}: ${error.message}`}</Text>
          ) : null}
          <Pressable accessibilityRole="button" onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonLabel}>{copy.retry}</Text>
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
