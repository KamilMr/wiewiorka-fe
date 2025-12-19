import {useRef} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import {useAppTheme} from '@/constants/theme';

const quotes = [
  {
    text: 'Wiewiórkowy sekret: oszczędzaj zimą, a w lecie będziesz spokojny. Bądź jak wiewiórka – zbieraj i planuj!',
    author: 'Mądrość natury',
  },
  {
    text: 'Budżet to sposób, by powiedzieć swoim pieniądzom, dokąd mają iść, zamiast zastanawiać się, gdzie znikły.',
    author: 'Dave Ramsey',
  },
  {
    text: 'Nie odkładaj marzeń, odkładaj na marzenia.',
    author: 'Autor nieznany',
  },
  {
    text: 'Najlepszy moment na posadzenie drzewa był 20 lat temu. Drugi najlepszy moment jest teraz. To samo dotyczy oszczędzania.',
    author: 'Chińskie przysłowie',
  },
  {
    text: 'Pieniądze, które mamy, są narzędziem wolności. Pieniądze, za którymi się uganiamy – narzędziem niewoli.',
    author: 'Jean-Jacques Rousseau',
  },
  {
    text: 'Małe oszczędności czynią wielkie majątki. Każda złotówka się liczy!',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Bogactwo to nie to, ile zarabiasz, ale to, ile oszczędzasz i jak mądrze inwestujesz.',
    author: 'Robert Kiyosaki',
  },
  {
    text: 'Kontroluj swoje wydatki, zanim one zaczną kontrolować ciebie.',
    author: 'Warren Buffett',
  },
  {
    text: 'Kupujemy rzeczy, których nie potrzebujemy, za pieniądze, których nie mamy, żeby zaimponować ludziom, na których nam nie zależy.',
    author: 'Will Smith',
  },
  {
    text: 'Nie wydawaj pieniędzy na to, co masz w portfelu – wydaj tylko to, co zostało po oszczędnościach.',
    author: 'Warren Buffett',
  },
  {
    text: 'Pieniądze nie są celem. Pieniądze nie mają wartości. Wartość mają marzenia, które pieniądze pomogą zrealizować.',
    author: 'Robert Kiyosaki',
  },
  {
    text: 'Oszczędzanie to dyscyplina odkładania dzisiaj po to, by móc cieszyć się jutrem.',
    author: 'Autor nieznany',
  },
  {
    text: 'Każda złotówka zaoszczędzona to złotówka zarobiona – i żadnych podatków!',
    author: 'Autor nieznany',
  },
  {
    text: 'Finanse to 80% psychologii i 20% wiedzy. Zacznij od zmiany nawyków.',
    author: 'Dave Ramsey',
  },
  {
    text: 'Nie liczy się ile zarabiasz, ale ile zatrzymujesz dla siebie.',
    author: 'Robert Kiyosaki',
  },
  {
    text: 'Planowanie budżetu to sposób na powiedzenie pieniądzom, gdzie mają pracować, zamiast się zastanawiać, gdzie uciekły.',
    author: 'Autor nieznany',
  },
  {
    text: 'Świadome wydawanie to klucz do finansowego spokoju. Każdy wydatek to decyzja.',
    author: 'Autor nieznany',
  },
  {
    text: 'Bogactwo nie polega na tym, żeby mieć dużo pieniędzy, ale na tym, żeby mieć więcej opcji.',
    author: 'Chris Rock',
  },
  {
    text: 'Twoja przyszłość finansowa zależy od tego, co robisz dziś, a nie jutro.',
    author: 'Robert Kiyosaki',
  },
  {
    text: 'Najważniejsza inwestycja to ta w siebie – w wiedzę o finansach i dyscyplinę oszczędzania.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Wiewiórka zbiera orzechy nie dlatego, że lubi pracować, ale dlatego, że wie – zima nadejdzie.',
    author: 'Mądrość natury',
  },
  {
    text: 'Nie musisz być bogaty, żeby zacząć oszczędzać. Musisz zacząć oszczędzać, żeby być bogatym.',
    author: 'Autor nieznany',
  },
  {
    text: 'Niewidoczne wydatki to twój największy wróg. Śledź każdą złotówkę – wtedy nic nie ucieknie.',
    author: 'Autor nieznany',
  },
  {
    text: 'Dobry budżet nie ogranicza – daje wolność, bo wiesz dokładnie, na co cię stać.',
    author: 'Dave Ramsey',
  },
  {
    text: 'Wiewiórkowe podejście: zbieraj regularnie, oszczędzaj mądrze, a zimą będziesz bezpieczny.',
    author: 'Mądrość natury',
  },
];

const {width: screenWidth} = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 32;

const FinancialQuote = () => {
  const t = useAppTheme();
  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const today = new Date();
  const defaultIndex = today.getDate() % quotes.length;

  return (
    <View style={styles.wrapper}>
      <Carousel
        ref={ref}
        width={CAROUSEL_WIDTH}
        height={140}
        data={quotes}
        defaultIndex={defaultIndex}
        onProgressChange={progress}
        loop
        renderItem={({item}) => (
          <View style={styles.container}>
            <Text style={[styles.quote, {color: t.colors.onBackground}]}>
              {item.text}
            </Text>
            <Text style={[styles.author, {color: t.colors.onBackground}]}>
              — {item.author}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
  },
  paginationContainer: {
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  activeDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
});

export default FinancialQuote;
