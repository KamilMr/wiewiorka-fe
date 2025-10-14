import {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';

import {
  Menu,
  Text,
  TouchableRipple,
  TextInput,
  Divider,
  Chip,
} from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';

import {normalize} from '@/common';
import {sizes} from '@/constants/theme';

export type Items = Array<{label: string; value: string}>;

export interface Props {
  onChange: (selectedValues: string[]) => void;
  value: string[];
  style?: Object;
  items: Items;
  placeholder?: string;
  showDivider?: boolean;
}

const MultiSelectCategories = ({
  onChange = () => {},
  value = [],
  items,
  showDivider = false,
  placeholder = 'Wybierz kategorie',
  style = {},
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    normalize(item.label.toLowerCase()).includes(
      normalize(searchQuery.toLowerCase()),
    ),
  );

  // Split filtered items into first three and rest
  const firstItems = filteredItems.slice(0, 3);
  const restItems = filteredItems.slice(3);

  // Auto-focus search input when menu becomes visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  const handleToggleItem = (itemValue: string) => {
    if (value.includes(itemValue))
      onChange(value.filter(v => v !== itemValue));
    else onChange([...value, itemValue]);
  };

  const handleRemoveChip = (itemValue: string) => {
    onChange(value.filter(v => v !== itemValue));
  };

  const handleMenuDismiss = () => {
    setIsVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleCleanSearchQuery = () => setSearchQuery('');

  const selectedItems = items.filter(item => value.includes(item.value));

  return (
    <View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{backgroundColor: 'transparent'}}
      >
        <Menu
          visible={isVisible}
          onDismiss={handleMenuDismiss}
          style={{backgroundColor: 'white', width: '80%'}}
          contentStyle={{
            maxHeight: 400,
            marginBottom: 10,
          }}
          anchorPosition="bottom"
          mode="elevated"
          anchor={
            <TouchableRipple
              onPress={() => {
                Keyboard.dismiss();
                setIsVisible(true);
              }}
              style={[
                styles.dropdownContainer,
                isVisible && {borderColor: 'blue'},
              ]}
            >
              <View style={styles.dropdownContent}>
                <View style={styles.dropdownLeft}>
                  <AntDesign
                    style={styles.icon}
                    color={isVisible ? 'blue' : 'black'}
                    name="select1"
                    size={20}
                  />
                  <Text style={styles.dropdownText}>
                    {value.length > 0
                      ? `Wybrano ${value.length}`
                      : placeholder}
                  </Text>
                </View>
                <AntDesign
                  name={isVisible ? 'up' : 'down'}
                  size={16}
                  color={isVisible ? 'blue' : 'black'}
                />
              </View>
            </TouchableRipple>
          }
        >
          {/* Fixed Search TextField */}
          <View style={styles.searchContainer}>
            <TextInput
              ref={searchInputRef}
              placeholder="Szukaj..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              mode="outlined"
              dense
              autoFocus={isVisible}
              left={<TextInput.Icon icon="magnify" />}
              right={
                searchQuery ? (
                  <TextInput.Icon icon="close" onPress={handleCleanSearchQuery} />
                ) : null
              }
            />
          </View>

          {/* Scrollable Menu Items */}
          <ScrollView
            style={styles.scrollableContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            keyboardDismissMode="on-drag"
            nestedScrollEnabled={true}
          >
            {/* First three items */}
            {firstItems.map((item, index) => (
              <Menu.Item
                key={`first-${index}`}
                onPress={() => handleToggleItem(item.value)}
                title={item.label}
                leadingIcon={value.includes(item.value) ? 'checkbox-marked' : 'checkbox-blank-outline'}
              />
            ))}

            {/* Divider if there are rest items */}
            {restItems.length > 0 && showDivider && searchQuery.length === 0 && (
              <Divider style={{height: 2}} />
            )}

            {/* Rest of the items */}
            {restItems.map((item, index) => (
              <Menu.Item
                key={`rest-${index}`}
                onPress={() => handleToggleItem(item.value)}
                title={item.label}
                leadingIcon={value.includes(item.value) ? 'checkbox-marked' : 'checkbox-blank-outline'}
              />
            ))}

            {/* Show message if no items match search */}
            {filteredItems.length === 0 && searchQuery.length > 0 && (
              <Menu.Item
                title="Brak wyników"
                disabled
                titleStyle={styles.noResultsText}
              />
            )}
          </ScrollView>
        </Menu>
      </KeyboardAvoidingView>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedItems.map(item => (
            <Chip
              key={item.value}
              onClose={() => handleRemoveChip(item.value)}
              style={styles.chip}
            >
              {item.label}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
};

export default MultiSelectCategories;

const styles = StyleSheet.create({
  dropdownContainer: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollableContent: {
    maxHeight: 300,
  },
  searchInput: {
    backgroundColor: 'white',
  },
  noResultsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: sizes.sm,
    gap: sizes.xs,
  },
  chip: {
    marginRight: sizes.xs,
    marginBottom: sizes.xs,
  },
});
