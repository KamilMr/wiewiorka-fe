import {StyleSheet, View, Text} from 'react-native';
import {useState} from 'react';

import {useAppTheme} from '@/constants/theme';
import {Select} from '@/components';
import ElementDropdown from '@/components/Dropdown';

const DropdownPage = () => {
  const t = useAppTheme();
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const mockFruits = [
    {label: 'Jabłko', value: 'apple'},
    {label: 'Banan', value: 'banana'},
    {label: 'Pomarańcza', value: 'orange'},
    {label: 'Gruszka', value: 'pear'},
    {label: 'Truskawka', value: 'strawberry'},
    {label: 'Winogrona', value: 'grapes'},
    {label: 'Ananas', value: 'pineapple'},
    {label: 'Mango', value: 'mango'},
    {label: 'Kiwi', value: 'kiwi'},
    {label: 'Brzoskwinia', value: 'peach'},
  ];

  const mockCategories = [
    {label: 'Żywność', value: 'food'},
    {label: 'Transport', value: 'transport'},
    {label: 'Rozrywka', value: 'entertainment'},
    {label: 'Ubrania', value: 'clothes'},
    {label: 'Zdrowie', value: 'health'},
  ];

  return (
    <View style={[styles.root, {backgroundColor: t.colors.background}]}>
      <Text style={[styles.title, {color: t.colors.foreground}]}>
        Dropdown Examples
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: t.colors.foreground}]}>
          Owoce
        </Text>
        <Select
          items={mockFruits}
          value={selectedValue}
          onChange={item => setSelectedValue(item.value)}
          placeholder="Wybierz owoc"
          showDivider={true}
        />
        {selectedValue && (
          <Text
            style={[styles.selectedText, {color: t.colors.mutedForeground}]}
          >
            Wybrano: {mockFruits.find(f => f.value === selectedValue)?.label}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: t.colors.foreground}]}>
          Kategorie (Current Select)
        </Text>
        <Select
          items={mockCategories}
          value={selectedCategory}
          onChange={item => setSelectedCategory(item.value)}
          placeholder="Wybierz kategorię"
        />
        {selectedCategory && (
          <Text
            style={[styles.selectedText, {color: t.colors.mutedForeground}]}
          >
            Wybrano:{' '}
            {mockCategories.find(c => c.value === selectedCategory)?.label}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: t.colors.foreground}]}>
          Kategorie (Element Dropdown)
        </Text>
        <ElementDropdown
          items={mockCategories}
          value={selectedCategory}
          onChange={item => setSelectedCategory(item.value)}
          placeholder="Wybierz kategorię"
        />
        {selectedCategory && (
          <Text
            style={[styles.selectedText, {color: t.colors.mutedForeground}]}
          >
            Wybrano:{' '}
            {mockCategories.find(c => c.value === selectedCategory)?.label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedText: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default DropdownPage;
