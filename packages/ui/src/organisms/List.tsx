import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View,
  type FlatListProps,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels } from '../theme/UIProvider';
import { EmptyState } from '../atoms/EmptyState';
import { Spinner } from '../atoms/Spinner';
import type { IconName } from '../icons/types';

export interface ListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: FlatListProps<T>['renderItem'];

  isLoading: boolean;
  isLoadingMore?: boolean;
  /** Controlado por el consumidor: mientras es false, se muestra un spinner de pantalla completa. @default true */
  isReady?: boolean;
  loadingText?: string;
  loadingMoreText?: string;

  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  onRefresh?: () => void;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyIconName?: IconName;

  ListHeaderComponent?: FlatListProps<T>['ListHeaderComponent'];
  ListFooterComponent?: FlatListProps<T>['ListFooterComponent'];

  contentContainerStyle?: ViewStyle;
  containerStyle?: ViewStyle;

  /** Componente de lista a usar (FlashList, etc). @default FlatList */
  ListComponent?: React.ComponentType<any>;
  listProps?: Record<string, unknown>;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.scrim,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: theme.tokens.spacing.md, color: theme.colors.textLight, fontWeight: theme.tokens.fontWeight.medium },
  listContent: { padding: theme.tokens.spacing.md, paddingBottom: Platform.OS === 'android' ? 100 : 80 },
  footerLoader: { paddingVertical: theme.tokens.spacing.xl, alignItems: 'center' },
}));

/**
 * List
 * Lista con estados de carga/paginación/vacío resueltos, sin atarse a
 * expo-router ni a FlashList: `ListComponent` permite inyectar cualquiera
 * (por defecto FlatList del propio React Native).
 */
export function List<T>({
  data,
  keyExtractor,
  renderItem,
  isLoading,
  isLoadingMore = false,
  isReady = true,
  loadingText,
  loadingMoreText,
  onEndReached,
  onEndReachedThreshold = 0.3,
  onRefresh,
  emptyTitle,
  emptyDescription,
  emptyIconName,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  containerStyle,
  ListComponent = FlatList,
  listProps,
}: ListProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const resolvedLoadingText = loadingText ?? labels.loading;
  const resolvedLoadingMoreText = loadingMoreText ?? labels.loadingMore;

  const renderFooter = useCallback(() => {
    if (ListFooterComponent) {
      return typeof ListFooterComponent === 'function' ? <ListFooterComponent /> : (ListFooterComponent as React.ReactElement);
    }
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <Spinner text={resolvedLoadingMoreText} fullscreen={false} />
      </View>
    );
  }, [isLoadingMore, resolvedLoadingMoreText, ListFooterComponent, styles.footerLoader]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return <EmptyState title={emptyTitle} description={emptyDescription} iconName={emptyIconName} style={{ marginTop: 50 }} />;
  }, [isLoading, emptyTitle, emptyDescription, emptyIconName]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Spinner text={resolvedLoadingText} />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {isLoading && data.length === 0 && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{resolvedLoadingText}</Text>
        </View>
      )}

      <ListComponent
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          ) : undefined
        }
        {...listProps}
      />
    </View>
  );
}
