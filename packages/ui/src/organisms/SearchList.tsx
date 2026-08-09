import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels } from '../theme/UIProvider';
import { Input } from '../atoms/Input';
import { EmptyState } from '../atoms/EmptyState';
import { Skeleton } from '../atoms/Skeleton';
import { Spinner } from '../atoms/Spinner';
import { IconButton } from '../atoms/IconButton';
import type { IconName } from '../icons/types';

export interface SearchListProps<T> {
  /** Chrome opcional arriba del buscador (ej. back button + título). */
  header?: React.ReactNode;

  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  searchIsLoading?: boolean;
  onScanPress?: () => void;
  scanAccessibilityLabel?: string;
  extraActions?: React.ReactNode;

  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: FlatListProps<T>['renderItem'];

  /** Carga inicial: mientras sea true y no haya datos, se muestran placeholders. */
  isLoading?: boolean;
  /** 'replace' cambia toda la lista por un spinner/skeleton; 'overlay' lo muestra encima manteniendo el layout. */
  loadingMode?: 'replace' | 'overlay';
  /** Recarga con datos ya en pantalla (pull-to-refresh). @default false */
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  /** Controlado por el consumidor: mientras es false, se muestra un spinner de pantalla completa. @default true */
  isReady?: boolean;
  loadingText?: string;
  loadingMoreText?: string;
  hasMore?: boolean;
  noMoreText?: string;

  /** Filas fantasma de la carga inicial. @default 6 */
  skeletonCount?: number;
  /** Placeholder propio, para que calce con la forma real del ítem. */
  renderSkeletonItem?: () => React.ReactElement;

  onLoadMore?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  onRefresh?: () => void;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyIconName?: IconName;

  ListHeaderComponent?: FlatListProps<T>['ListHeaderComponent'];
  ListFooterComponent?: FlatListProps<T>['ListFooterComponent'];

  contentContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: ViewStyle;

  /** Componente de lista a usar (FlashList, etc). @default FlatList */
  ListComponent?: React.ComponentType<any>;
  listProps?: Record<string, unknown>;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.tokens.spacing.lg - 1, gap: theme.tokens.spacing.sm + 2 },
  searchInput: { flex: 1, marginBottom: 0 },
  scanButton: { backgroundColor: theme.colors.primary, width: 50, height: 50, borderRadius: theme.tokens.radius.lg, ...theme.tokens.shadow.sm },
  listArea: { flex: 1 },
  listContent: { paddingBottom: theme.tokens.spacing.xl },
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
  footer: { paddingVertical: theme.tokens.spacing.xl, alignItems: 'center', gap: theme.tokens.spacing.md },
  footerText: { color: theme.colors.textLight, fontSize: theme.tokens.fontSize.md },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    padding: theme.tokens.spacing.md,
  },
  skeletonText: { flex: 1, gap: theme.tokens.spacing.sm },
}));

/**
 * SearchList
 * Buscador + lista + estados de carga/paginación/vacío. El contenido de
 * cada ítem (renderItem) queda a cargo de quien la usa, ya que difiere por
 * completo entre casos de uso.
 */
export function SearchList<T>({
  header,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchIsLoading = false,
  onScanPress,
  scanAccessibilityLabel = 'Scan',
  extraActions,
  data,
  keyExtractor,
  renderItem,
  isLoading = false,
  loadingMode = 'replace',
  isRefreshing = false,
  isLoadingMore = false,
  isReady = true,
  loadingText,
  loadingMoreText,
  hasMore = false,
  noMoreText,
  skeletonCount = 6,
  renderSkeletonItem,
  onLoadMore,
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
}: SearchListProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const resolvedSearchPlaceholder = searchPlaceholder ?? labels.search;
  const resolvedLoadingText = loadingText ?? labels.loading;
  const resolvedLoadingMoreText = loadingMoreText ?? labels.loadingMore;

  const handleEndReached = onLoadMore ?? onEndReached;

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
          <View style={styles.footer}>
            <Spinner text={resolvedLoadingMoreText} fullscreen={false} />
          </View>
        )}
        {noMoreText && !hasMore && data.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{noMoreText}</Text>
          </View>
        )}
      </>
    );
  }, [ListFooterComponent, isLoadingMore, resolvedLoadingMoreText, noMoreText, hasMore, data.length, styles.footer, styles.footerText]);

  // Vacío sólo cuando ya se sabe que no hay nada: durante la carga inicial se
  // muestran placeholders, no "sin resultados".
  const renderEmpty = useCallback(() => {
    if (isLoading || isRefreshing) return null;
    return <EmptyState title={emptyTitle} description={emptyDescription} iconName={emptyIconName} style={{ marginTop: 50 }} />;
  }, [isLoading, isRefreshing, emptyTitle, emptyDescription, emptyIconName]);

  if (!isReady) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Spinner text={resolvedLoadingText} />
      </View>
    );
  }

  const isInitialLoading = isLoading && loadingMode === 'replace' && data.length === 0;
  const showOverlayLoading = isLoading && loadingMode === 'overlay' && data.length === 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {header}

      <View style={styles.searchRow}>
        <Input
          placeholder={resolvedSearchPlaceholder}
          leftIconName="search"
          value={searchValue}
          onChangeText={onSearchChange}
          rightIconName={searchValue.length > 0 ? 'close' : undefined}
          onRightIconPress={() => onSearchChange('')}
          isLoading={searchIsLoading}
          containerStyle={styles.searchInput}
        />
        {onScanPress && (
          <IconButton
            iconName="search"
            onPress={onScanPress}
            color={colors.onPrimary}
            style={styles.scanButton}
            accessibilityLabel={scanAccessibilityLabel}
          />
        )}
        {extraActions}
      </View>

      <View style={styles.listArea}>
        {showOverlayLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.footerText}>{resolvedLoadingText}</Text>
          </View>
        )}

        {isInitialLoading ? (
          <View testID="list-skeleton" style={[styles.listContent, contentContainerStyle]}>
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
        ) : (
          <ListComponent
            data={data}
            keyExtractor={keyExtractor}
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.listContent, contentContainerStyle]}
            onEndReached={handleEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            renderItem={renderItem}
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
        )}
      </View>
    </View>
  );
}

