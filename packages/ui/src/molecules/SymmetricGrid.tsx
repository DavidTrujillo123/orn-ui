import React, { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useTheme } from '../theme/UIProvider';

export interface SymmetricGridProps<T> {
  /** Items to lay out, in reading order. */
  data: T[];
  /** Renders one cell; it gets the full cell width. */
  renderItem: (item: T, index: number) => React.ReactElement;
  /** Stable key per item. */
  keyExtractor: (item: T, index: number) => string;
  /** Columns per row. @default 2 */
  columns?: number;
  /** Spacing between cells, on both axes. @default theme.tokens.spacing.md */
  gap?: number;
  /**
   * Incomplete last row: centered (symmetric) instead of stuck to the
   * left with a gap on the right. @default true
   */
  balanceLastRow?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles(() => ({
  row: { flexDirection: 'row' },
  rowBalanced: { justifyContent: 'center' },
  rowFull: { justifyContent: 'flex-start' },
  cell: { flexGrow: 0, flexShrink: 0 },
}));

function chunk<T>(data: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < data.length; i += size) rows.push(data.slice(i, i + size));
  return rows;
}

/**
 * SymmetricGrid
 * Law of Prägnanz (good form): groups items into even rows of N columns.
 * The last row, when incomplete, is centered by default instead of sticking
 * to one edge — that is what makes it read as a "short row" and not as a
 * broken layout with a gap on one side.
 *
 * Gestalt, similarity: every cell has exactly the same width, also in the
 * centered short row, so items read as peers. The horizontal gap is padding
 * inside each cell (and a negative margin on the row), not flex `gap`: a
 * `100 / columns %` width plus a gap made every row wider than the grid and
 * pushed the right column out of the container.
 */
export function SymmetricGrid<T>({
  data,
  renderItem,
  keyExtractor,
  columns = 2,
  gap,
  balanceLastRow = true,
  style,
  testID,
}: SymmetricGridProps<T>) {
  const theme = useTheme();
  const styles = useStyles();
  const rows = useMemo(() => chunk(data, columns), [data, columns]);
  const space = gap ?? theme.tokens.spacing.md;
  const cellWidth = `${100 / columns}%` as const;

  return (
    <View style={[{ gap: space }, style]} testID={testID}>
      {rows.map((row, rowIndex) => {
        const isLastRow = rowIndex === rows.length - 1;
        const isIncomplete = row.length < columns;
        const centered = isLastRow && isIncomplete && balanceLastRow;

        return (
          <View
            // `columns` in the key: if it changes, rows don't reuse DOM nodes
            // from a row built with a different number of columns.
            key={`row-${columns}-${rowIndex}`}
            style={[styles.row, centered ? styles.rowBalanced : styles.rowFull, { marginHorizontal: -space / 2 }]}
          >
            {row.map((item, colIndex) => {
              const index = rowIndex * columns + colIndex;
              return (
                <View
                  key={keyExtractor(item, index)}
                  style={[styles.cell, { width: cellWidth, paddingHorizontal: space / 2 }]}
                >
                  {renderItem(item, index)}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
