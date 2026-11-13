import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, type FlatListProps, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels } from '../theme/UIProvider';
import { EmptyState } from '../atoms/EmptyState';
import { Skeleton } from '../atoms/Skeleton';
import { Spinner } from '../atoms/Spinner';
import type { IconName } from '../icons/types';

export interface ListProps<T> {
  /** Items to render. */
  data: T[];
  /** Stable key per item. */
  keyExtractor: (item: T, index: number) => string;
  /** Renders each row (same as FlatList's `renderItem`). */
  renderItem: FlatListProps<T>['renderItem'];

  /** Initial load: while true and there's no data, placeholders are shown. */
  isLoading: boolean;
  /** Reload with data already on screen (pull-to-refresh). @default false */
  isRefreshing?: boolean;
  /** Shows a spinner in the footer while the next page loads. @default false */
  isLoadingMore?: boolean;
  /** Controlled by the consumer: while false, a fullscreen spinner is shown. @default true */
  isReady?: boolean;
  /** Text of the fullscreen spinner shown while `isReady` is false. @default labels.loading */
  loadingText?: string;
  /** Text of the footer spinner shown with `isLoadingMore`. @default labels.loadingMore */
  loadingMoreText?: string;

  /** Ghost rows for the initial load. @default 6 */
  skeletonCount?: number;
  /** Custom placeholder, to match the real shape of the item. */
  renderSkeletonItem?: () => React.ReactElement;

  /** Called when scrolling gets close to the end (to load the next page). */
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
  /** Rendered below the items, before the pagination loader. */
  ListFooterComponent?: FlatListProps<T>['ListFooterComponent'];

  /** Style of the list's content container (also used by the skeleton). */
  contentContainerStyle?: ViewStyle;
  /** Style of the outer wrapper. */
  containerStyle?: ViewStyle;

  /** List component to use (FlashList, etc). @default FlatList */
  ListComponent?: React.ComponentType<any>;
  /** Extra props passed to `ListComponent`; they override the ones set here. */
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
  skeletonText: { flex: 1 },
  empty: { marginTop: theme.tokens.spacing.xxxl },
}));

/** Same as Avatar's default size: the placeholder row matches a typical avatar row. */
const SKELETON_AVATAR = 44;

function renderHeader(Header: ListProps<unknown>['ListHeaderComponent']) {
  if (!Header) return null;
  return typeof Header === 'function' ? <Header /> : (Header as React.ReactElement);
}

/**
 * List
 * List with loading/pagination/empty states handled, without being tied to
 * expo-router or FlashList: `ListComponent` lets you inject any of them
 * (React Native's own FlatList by default).
 *
 * Design:
 * - Continuity (Gestalt): the first load shows placeholders shaped like the
 *   rows and keeps `ListHeaderComponent` in place, so nothing jumps when the
 *   data arrives.
 * - Doherty threshold: every wait has immediate feedback (placeholders,
 *   pull-to-refresh spinner, footer loader while paging), and "no results"
 *   only appears once it is known there is nothing.
 * - Jakob's law: the native pull-to-refresh and infinite scroll people
 *   already know from other apps.
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
          <View style={styles.footerLoader}>
            <Spinner text={resolvedLoadingMoreText} fullscreen={false} />
          </View>
        )}
      </>
    );
  }, [isLoadingMore, resolvedLoadingMoreText, ListFooterComponent, styles.footerLoader]);

  // Empty only once it is known there is nothing: during the initial load
  // placeholders are shown, not "no results".
  const renderEmpty = useCallback(() => {
    if (isLoading || isRefreshing) return null;
    return <EmptyState title={emptyTitle} description={emptyDescription} iconName={emptyIconName} style={styles.empty} />;
  }, [isLoading, isRefreshing, emptyTitle, emptyDescription, emptyIconName, styles.empty]);

  if (!isReady) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Spinner text={resolvedLoadingText} />
      </View>
    );
  }

  if (isInitialLoading) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.listContent, contentContainerStyle]}>
        {/* Same padding as the loaded list, and outside the group below so it
            stays reachable (a search field above the list, say). */}
        {renderHeader(ListHeaderComponent as ListProps<unknown>['ListHeaderComponent'])}
        <View
          testID="list-skeleton"
          // The placeholders themselves are hidden from screen readers: the
          // group announces that the list is loading instead of silence.
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={resolvedLoadingText}
          accessibilityState={{ busy: true }}
        >
          {Array.from({ length: skeletonCount }, (_, i) => (
            <React.Fragment key={i}>
              {renderSkeletonItem?.() ?? (
                <View style={styles.skeletonRow}>
                  <Skeleton variant="circle" width={SKELETON_AVATAR} />
                  <View style={styles.skeletonText}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="35%" />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
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
