import React, { memo } from 'react';
import { ActivityIndicator, FlatList, Text, View, type FlatListProps, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels } from '../theme/UIProvider';
import { Input } from '../atoms/Input';
import { EmptyState } from '../atoms/EmptyState';
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
  keyExtractor: (item: T) => string;
  renderItem: FlatListProps<T>['renderItem'];

  isLoading?: boolean;
  /** 'replace' cambia toda la lista por un spinner; 'overlay' lo muestra encima manteniendo el layout. */
  loadingMode?: 'replace' | 'overlay';
  loadingText?: string;

  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadingMoreText?: string;
  hasMore?: boolean;
  noMoreText?: string;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyIconName?: IconName;

  contentContainerStyle?: StyleProp<ViewStyle>;
  ListComponent?: React.ComponentType<any>;
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
    backgroundColor: theme.colors.surface + 'B3',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { paddingVertical: theme.tokens.spacing.xl, alignItems: 'center', gap: theme.tokens.spacing.md },
  footerText: { color: theme.colors.textLight, fontSize: theme.tokens.fontSize.md },
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
  loadingText,
  onLoadMore,
  isLoadingMore = false,
  loadingMoreText,
  hasMore = false,
  noMoreText,
  emptyTitle,
  emptyDescription,
  emptyIconName,
  contentContainerStyle,
  ListComponent = FlatList,
  listProps,
}: SearchListProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const resolvedSearchPlaceholder = searchPlaceholder ?? labels.search;
  const resolvedLoadingText = loadingText ?? labels.loading;
  const resolvedLoadingMoreText = loadingMoreText ?? labels.loadingMore;

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <Spinner text={resolvedLoadingMoreText} fullscreen={false} />
        </View>
      );
    }
    if (noMoreText && !hasMore && data.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{noMoreText}</Text>
        </View>
      );
    }
    return null;
  };

  const showReplaceLoading = isLoading && loadingMode === 'replace' && data.length === 0;
  const showOverlayLoading = isLoading && loadingMode === 'overlay' && data.length === 0;
  const showEmpty = !isLoading && data.length === 0;

  return (
    <View style={styles.container}>
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
            color={colors.white}
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

        {showReplaceLoading ? (
          <Spinner text={resolvedLoadingText} />
        ) : showEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} iconName={emptyIconName} />
        ) : (
          <ListComponent
            data={data}
            keyExtractor={keyExtractor}
            keyboardDismissMode="on-drag"
            contentContainerStyle={contentContainerStyle ?? styles.listContent}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={renderFooter}
            renderItem={renderItem}
            {...listProps}
          />
        )}
      </View>
    </View>
  );
}
