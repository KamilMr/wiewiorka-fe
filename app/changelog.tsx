import {ScrollView, StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import WarmCard from '@/components/warm/WarmCard';
import {CHANGELOG} from '@/constants/changelog';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {parseChangelog, ChangelogEntry} from '@/utils/parseChangelog';

const packageJson = require('../package.json');

const Changelog = () => {
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
        <Text variant="titleSmall" style={[styles.changeSectionTitle, {color}]}>
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

  const renderVersionCard = (
    entry: ChangelogEntry,
    isCurrentVersion: boolean,
  ) => (
    <WarmCard
      key={entry.version}
      variant="solid"
      style={
        isCurrentVersion
          ? [styles.versionCard, styles.currentVersionCard]
          : styles.versionCard
      }
    >
      <View style={styles.versionHeader}>
        <Text variant="titleLarge" style={styles.versionText}>
          Wersja {entry.version}
        </Text>
        {isCurrentVersion && (
          <View style={styles.currentBadge}>
            <Text variant="labelSmall" style={styles.currentBadgeText}>
              OBECNE
            </Text>
          </View>
        )}
      </View>
      <Text variant="bodySmall" style={styles.dateText}>
        {entry.date}
      </Text>

      <View style={styles.changesContainer}>
        {renderChangeSection('Dodano', entry.changes.added, warmColors.success)}
        {renderChangeSection(
          'Naprawiono',
          entry.changes.fixed,
          warmColors.primary,
        )}
        {renderChangeSection(
          'Zmieniono',
          entry.changes.changed,
          warmColors.mutedForeground,
        )}
        {renderChangeSection(
          'Usunięto',
          entry.changes.removed,
          warmColors.destructive,
        )}
      </View>
    </WarmCard>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {entries.map(entry =>
          renderVersionCard(entry, entry.version === currentVersion),
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: warmColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  versionCard: {
    marginBottom: 16,
  },
  currentVersionCard: {
    borderColor: warmColors.primary,
    borderWidth: 2,
  },
  versionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  versionText: {
    color: warmColors.foreground,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: warmColors.accent,
    borderRadius: warmRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: warmColors.foreground,
    fontWeight: '700',
  },
  dateText: {
    color: warmColors.mutedForeground,
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
    fontWeight: '700',
  },
  changeItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    color: warmColors.primary,
    marginRight: 8,
    fontSize: 14,
  },
  changeText: {
    color: warmColors.foreground,
    flex: 1,
  },
});

export default Changelog;
