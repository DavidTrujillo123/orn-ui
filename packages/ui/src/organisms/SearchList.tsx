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
  /** Optional chrome above the search bar (e.g. back button + title). */
  header?: React.ReactNode;

  /** Text of the search box (controlled). */
  searchValue: string;
  /** Called with the new text; the clear button calls it with an empty string. */
  onSearchChange: (text: string) => void;
  /** Placeholder of the search box. @default labels.search */
  searchPlaceholder?: string;
  /** Shows a spinner inside the search box. @default false */
  searchIsLoading?: boolean;
  /** Shows a button next to the search box and is called when it is pressed. */
  onScanPress?: () => void;
  /** Accessible name of the `onScanPress` button. @default 'Scan' */
  scanAccessibilityLabel?: string;
  /** Extra nodes at the end of the search row. */
  extraActions?: React.ReactNode;

  /** Items to render. */
  data: T[];
  /** Stable key per item. */
  keyExtractor: (item: T, index: number) => string;
  /** Renders each row (same as FlatList's `renderItem`). */
  renderItem: FlatListProps<T>['renderItem'];

  /** Initial load: while true and there's no data, placeholders are shown. */
  isLoading?: boolean;
  /** 'replace' swaps the whole list for a spinner/skeleton; 'overlay' shows it on top while keeping the layout. */
  loadingMode?: 'replace' | 'overlay';
  /** Reload with data already on screen (pull-to-refresh). @default false */
  isRefreshing?: boolean;
  /** Shows a spinner in the footer while the next page loads. @default false */
  isLoadingMore?: boolean;
  /** Controlled by the consumer: while false, a fullscreen spinner is shown. @default true */
  isReady?: boolean;
  /**
   * Text of the spinner shown while `isReady` is false and of the `overlay` loading. @default
   * labels.loading
   */
  loadingText?: string;
  /** Text of the footer spinner shown with `isLoadingMore`. @default labels.loadingMore */
  loadingMoreText?: string;
  /**
   * Whether more pages remain. While false, `noMoreText` shows at the end of a non-empty list.
   * @default false
   */
  hasMore?: boolean;
  /** Text shown at the end of the list when `hasMore` is false. */
  noMoreText?: string;

  /** Ghost rows for the initial load. @default 6 */
  skeletonCount?: number;
  /** Custom placeholder, to match the real shape of the item. */
  renderSkeletonItem?: () => React.ReactElement;

  /** Called when scrolling gets close to the end. Takes precedence over `onEndReached`. */
  onLoadMore?: () => void;
  /** Called when scrolling gets close to the end. Ignored when `onLoadMore` is passed. */
  onEndReached?: () => void;
  /** How close to the end `onEndReached` fires, in visible lengths of the list. @default 0.3 */
  onEndReachedThreshold?: number;
  /** Enables pull-to-refresh and is called when the user pulls. */
  onRefresh?: () => void;

  /** Title of the empty state. @default labels.noResultsTitle */
  emptyTitle?: string;
  /** Supporting line of the empty state. @default labels.noResultsDescription */
  emptyDescription?: string;
  /** Icon of the empty state. @default 'search' */
  emptyIconName?: IconName;

  /** Rendered above the items, inside the scroll. */
  ListHeaderComponent?: FlatListProps<T>['ListHeaderComponent'];
  /** Rendered below the items, before the pagination loader and `noMoreText`. */
  ListFooterComponent?: FlatListProps<T>['ListFooterComponent'];

  /** Style of the list's content container (also used by the skeleton). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Style of the outer wrapper. */
  containerStyle?: ViewStyle;

  /** List component to use (FlashList, etc). @default FlatList */
  ListComponent?: React.ComponentType<any>;
  /** Extra props passed to `ListComponent`; they override the ones set here. */
  listProps?: Record<string, unknown>;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1 },
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
 * Search box + list + loading/pagination/empty states. The content of each
 * item (renderItem) is up to whoever uses it, since it differs completely
 * between use cases.
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

  // The custom footer and the pagination loader coexist: previously the first
  // covered the second and the list stopped signaling it was fetching more.
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

  // Empty only once it is known there is nothing: during the initial load
  // placeholders are shown, not "no results".
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
            iconName="scan"
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

