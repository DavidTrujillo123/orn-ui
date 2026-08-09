import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, type FlatListProps, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels } from '../theme/UIProvider';
import { EmptyState } from '../atoms/EmptyState';
import { Skeleton } from '../atoms/Skeleton';
import { Spinner } from '../atoms/Spinner';
import type { IconName } from '../icons/types';

export interface ListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: FlatListProps<T>['renderItem'];

  /** Carga inicial: mientras sea true y no haya datos, se muestran placeholders. */
  isLoading: boolean;
  /** Recarga con datos ya en pantalla (pull-to-refresh). @default false */
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  /** Controlado por el consumidor: mientras es false, se muestra un spinner de pantalla completa. @default true */
  isReady?: boolean;
  loadingText?: string;
  loadingMoreText?: string;

  /** Filas fantasma de la carga inicial. @default 6 */
  skeletonCount?: number;
  /** Placeholder propio, para que calce con la forma real del ítem. */
  renderSkeletonItem?: () => React.ReactElement;

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
  listContent: { padding: theme.tokens.spacing.md },
  footerLoader: { paddingVertical: theme.tokens.spacing.xl, alignItems: 'center' },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    padding: theme.tokens.spacing.md,
  },
  skeletonText: { flex: 1, gap: theme.tokens.spacing.sm },
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
  isRefreshing = false,
  isLoadingMore = false,
  isReady = true,
  loadingText,
  loadingMoreText,
  skeletonCount = 6,
  renderSkeletonItem,
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

  const isInitialLoading = isLoading && data.length === 0;

  // El footer propio y el loader de paginación conviven: antes el primero
  // tapaba al segundo y la lista dejaba de avisar que estaba trayendo más.
  const renderFooter = useCallback(() => {
    const custom =
      typeof ListFooterComponent === 'function' ? (
        <ListFooterComponent />
      ) : (
        (ListFooterComponent as React.ReactElement | undefined) ?? null
      );

    return (
      <>
        {custom}
        {isLoadingMore && (
          <View style={styles.footerLoader}>
            <Spinner text={resolvedLoadingMoreText} fullscreen={false} />
          </View>
        )}
      </>
    );
  }, [isLoadingMore, resolvedLoadingMoreText, ListFooterComponent, styles.footerLoader]);

  // Vacío sólo cuando ya se sabe que no hay nada: durante la carga inicial se
  // muestran placeholders, no "sin resultados".
  const renderEmpty = useCallback(() => {
    if (isLoading || isRefreshing) return null;
    return <EmptyState title={emptyTitle} description={emptyDescription} iconName={emptyIconName} style={{ marginTop: 50 }} />;
  }, [isLoading, isRefreshing, emptyTitle, emptyDescription, emptyIconName]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Spinner text={resolvedLoadingText} />
      </View>
    );
  }

  if (isInitialLoading) {
    return (
      <View style={[styles.container, containerStyle]} testID="list-skeleton">
        <View style={[styles.listContent, contentContainerStyle]}>
          {Array.from({ length: skeletonCount }, (_, i) => (
            <React.Fragment key={i}>
              {renderSkeletonItem?.() ?? (
                <View style={styles.skeletonRow}>
                  <Skeleton variant="circle" width={40} />
                  <View style={styles.skeletonText}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="35%" height={12} />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
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
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        {...listProps}
      />
    </View>
  );
}
