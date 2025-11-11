import {StyleSheet, View, ScrollView} from 'react-native';
import {Text, Card} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';
import {parseChangelog, ChangelogEntry} from '@/utils/parseChangelog';
import {CHANGELOG} from '@/constants/changelog';

const packageJson = require('../package.json');

const Changelog = () => {
  const t = useAppTheme();
  const currentVersion = packageJson.version;
  const entries = parseChangelog(CHANGELOG);

  const renderChangeSection = (
    title: string,
    changes: string[] | undefined,
    color: string,
  ) => {
    if (!changes || changes.length === 0) return null;

    return (
      <View style={styles.changeSection}>
        <Text
          variant="titleSmall"
          style={[styles.changeSectionTitle, {color}]}
        >
          {title}
        </Text>
        {changes.map((change, index) => (
          <View key={index} style={styles.changeItem}>
            <Text style={styles.bullet}>•</Text>
            <Text variant="bodyMedium" style={styles.changeText}>
              {change}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderVersionCard = (entry: ChangelogEntry, isCurrentVersion: boolean) => (
    <Card
      key={entry.version}
      style={[
        styles.versionCard,
        isCurrentVersion && {
          borderColor: t.colors.accent,
          borderWidth: 2,
        },
      ]}
    >
      <Card.Content>
        <View style={styles.versionHeader}>
          <Text
            variant="titleLarge"
            style={[styles.versionText, {color: t.colors.primary}]}
          >
            Wersja {entry.version}
          </Text>
          {isCurrentVersion && (
            <View
              style={[
                styles.currentBadge,
                {backgroundColor: t.colors.accent},
              ]}
            >
              <Text
                variant="labelSmall"
                style={{color: t.colors.onAccent, fontWeight: '600'}}
              >
                NADCHODZĄCE
              </Text>
            </View>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={[styles.dateText, {color: t.colors.textSecondary}]}
        >
          {entry.date}
        </Text>

        <View style={styles.changesContainer}>
          {renderChangeSection('Dodano', entry.changes.added, t.colors.success)}
          {renderChangeSection('Naprawiono', entry.changes.fixed, t.colors.info)}
          {renderChangeSection('Zmieniono', entry.changes.changed, t.colors.warning)}
          {renderChangeSection('Usunięto', entry.changes.removed, t.colors.error)}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: t.colors.background}]}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, {color: t.colors.primary}]}>
          Historia zmian
        </Text>
        {entries.map(entry => renderVersionCard(entry, entry.version === currentVersion))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 20,
    fontWeight: '600',
  },
  versionCard: {
    marginBottom: 16,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontWeight: '600',
  },
  currentBadge: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateText: {
    marginBottom: 16,
  },
  changesContainer: {
    marginTop: 8,
  },
  changeSection: {
    marginBottom: 12,
  },
  changeSectionTitle: {
    marginBottom: 6,
    fontWeight: '600',
  },
  changeItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    marginRight: 8,
    fontSize: 14,
  },
  changeText: {
    flex: 1,
  },
});

export default Changelog;
