import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface SelectOption<T> {
  label: string;
  value: T;
  /** Glifo del set de la librería, a la izquierda del label. */
  iconName?: IconName;
  /** Emoji a la izquierda del label. Gana sobre `iconName`. */
  emoji?: string;
  disabled?: boolean;
}

export interface SelectProps<T> {
  label?: string;
  required?: boolean;
  options: SelectOption<T>[];
  selectedValue: T | undefined;
  onSelect: (value: T) => void;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** Agrega un buscador dentro del desplegable. @default false */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Alto máximo del desplegable, si el espacio disponible lo permite. @default 280 */
  maxHeight?: number;
  onOpenChange?: (open: boolean) => void;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Aire entre el campo y el desplegable. */
const GAP = 8;
/** Por debajo de esto el desplegable no muestra ni dos filas. */
const MIN_HEIGHT = 120;

const useStyles = createStyles((theme) => ({
  container: { gap: theme.tokens.spacing.sm },
  label: { fontWeight: theme.tokens.fontWeight.bold, fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  required: { color: theme.colors.errorText },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.inputBackground,
    minHeight: 50,
    paddingHorizontal: theme.tokens.spacing.lg,
  },
  fieldOpen: { borderColor: theme.colors.primary },
  fieldDisabled: { opacity: 0.5 },
  fieldValue: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.sm, flexShrink: 1 },
  fieldText: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text, flexShrink: 1 },
  fieldPlaceholder: { color: theme.colors.textLight },
  backdrop: { flex: 1 },
  sheet: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.tokens.shadow.md,
  },
  search: {
    fontSize: theme.tokens.fontSize.md,
    color: theme.colors.text,
    paddingHorizontal: theme.tokens.spacing.lg,
    paddingVertical: theme.tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.tokens.spacing.lg,
    paddingVertical: theme.tokens.spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionRowSelected: { backgroundColor: theme.colors.primarySoft },
  optionRowDisabled: { opacity: 0.4 },
  optionLabel: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.sm, flexShrink: 1 },
  optionText: { fontSize: theme.tokens.fontSize.lg - 1, color: theme.colors.text },
  optionTextSelected: { fontWeight: theme.tokens.fontWeight.semibold, color: theme.colors.primaryText },
  emoji: { fontSize: theme.tokens.fontSize.lg },
  empty: {
    padding: theme.tokens.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: theme.tokens.fontSize.md,
  },
  errorText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Select
 * Dropdown de una sola opción. La lista se mide contra la ventana y se dibuja
 * dentro de un Modal, no en el árbol del campo: así ningún `overflow: hidden`
 * la recorta, no depende del zIndex (poco confiable en Android) y el fondo del
 * Modal resuelve cerrar tocando afuera y con el botón atrás.
 */
export function Select<T extends string | number>({
  label,
  required = false,
  options,
  selectedValue,
  onSelect,
  placeholder,
  error,
  isLoading = false,
  disabled = false,
  searchable = false,
  searchPlaceholder,
  maxHeight = 280,
  onOpenChange,
  containerStyle,
  testID,
}: SelectProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const allowFontScaling = useAllowFontScaling();
  const { height: windowHeight } = useWindowDimensions();

  const fieldRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isDisabled = disabled || isLoading;
  const selectedOption = options.find((o) => o.value === selectedValue);

  const close = useCallback(() => {
    setOpen(false);
    setAnchor(null);
    setQuery('');
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Abrir no espera a la medición: si `measureInWindow` no responde, la lista
  // igual aparece (centrada) en vez de que el campo deje de funcionar.
  const openList = () => {
    fieldRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
    setOpen(true);
    onOpenChange?.(true);
  };

  // El buscador abre el teclado encima del desplegable: sin descontarlo, la
  // lista se dibuja donde ya no se ve.
  useEffect(() => {
    if (!open) return;
    setKeyboardHeight(Keyboard.metrics()?.height ?? 0);
    const [show, hide] =
      Platform.OS === 'ios' ? ['keyboardWillShow', 'keyboardWillHide'] : ['keyboardDidShow', 'keyboardDidHide'];
    const subs = [
      Keyboard.addListener(show as 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height)),
      Keyboard.addListener(hide as 'keyboardDidHide', () => setKeyboardHeight(0)),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [open]);

  const visibleOptions = useMemo(() => {
    if (!searchable || query.trim() === '') return options;
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query, searchable]);

  // Se abre hacia donde haya más aire: contra el borde inferior de la pantalla,
  // hacia arriba es la única forma de que entre.
  const placement = useMemo((): ViewStyle => {
    if (!anchor) return { left: GAP * 2, right: GAP * 2, top: windowHeight * 0.25, maxHeight };
    const usableHeight = windowHeight - keyboardHeight;
    const below = usableHeight - (anchor.y + anchor.height) - GAP * 2;
    const above = anchor.y - GAP * 2;
    const downwards = below >= Math.min(maxHeight, above);
    return {
      left: anchor.x,
      width: anchor.width,
      maxHeight: Math.max(Math.min(maxHeight, downwards ? below : above), MIN_HEIGHT),
      ...(downwards ? { top: anchor.y + anchor.height + GAP } : { bottom: windowHeight - anchor.y + GAP }),
    };
  }, [anchor, keyboardHeight, maxHeight, windowHeight]);

  const renderLeading = (option: SelectOption<T> | undefined, color: string) => {
    if (!option) return null;
    if (option.emoji) {
      return (
        <Text allowFontScaling={allowFontScaling} style={styles.emoji}>
          {option.emoji}
        </Text>
      );
    }
    return option.iconName ? <Icon name={option.iconName} size={20} color={color} /> : null;
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <Pressable
        ref={fieldRef}
        style={[styles.field, open && styles.fieldOpen, isDisabled && styles.fieldDisabled]}
        onPress={openList}
        disabled={isDisabled}
        accessibilityRole="combobox"
        accessibilityLabel={label ?? placeholder ?? labels.selectPlaceholder}
        accessibilityValue={{ text: selectedOption?.label ?? '' }}
        accessibilityState={{ expanded: open, disabled: isDisabled }}
      >
        <View style={styles.fieldValue}>
          {renderLeading(selectedOption, colors.textLight)}
          <Text
            allowFontScaling={allowFontScaling}
            numberOfLines={1}
            style={[styles.fieldText, !selectedOption && styles.fieldPlaceholder]}
          >
            {selectedOption?.label || placeholder || labels.selectPlaceholder}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textLight} />
        )}
      </Pressable>

      {open && (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
          <Pressable style={styles.backdrop} onPress={close} testID="select-backdrop" />

          <View style={[styles.sheet, placement]} accessibilityRole="radiogroup" testID="select-list">
            {searchable && (
              <TextInput
                allowFontScaling={allowFontScaling}
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder ?? labels.search}
                placeholderTextColor={colors.textLight}
                autoFocus
                accessibilityLabel={searchPlaceholder ?? labels.search}
              />
            )}

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
              {visibleOptions.map((option, index) => {
                const isSelected = option.value === selectedValue;
                return (
                  <Pressable
                    key={String(option.value)}
                    style={[
                      styles.optionRow,
                      index === visibleOptions.length - 1 && styles.optionRowLast,
                      isSelected && styles.optionRowSelected,
                      option.disabled && styles.optionRowDisabled,
                    ]}
                    onPress={() => {
                      onSelect(option.value);
                      close();
                    }}
                    disabled={option.disabled}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected, checked: isSelected, disabled: !!option.disabled }}
                  >
                    <View style={styles.optionLabel}>
                      {renderLeading(option, isSelected ? colors.primary : colors.textLight)}
                      <Text
                        allowFontScaling={allowFontScaling}
                        numberOfLines={1}
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && <Icon name="check" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}

              {visibleOptions.length === 0 && (
                <Text allowFontScaling={allowFontScaling} style={styles.empty}>
                  {labels.noResultsTitle}
                </Text>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {!!error && (
        <Text allowFontScaling={allowFontScaling} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}
