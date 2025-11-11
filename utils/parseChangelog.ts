export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    added?: string[];
    fixed?: string[];
    changed?: string[];
    removed?: string[];
  };
}

export const parseChangelog = (content: string): ChangelogEntry[] => {
  const lines = content.split('\n');
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: 'added' | 'fixed' | 'changed' | 'removed' | null = null;

  for (const line of lines) {
    // Match version header: ## [1.0.7] - 2025-01-10
    const versionMatch = line.match(/^##\s+\[([^\]]+)\]\s+-\s+(.+)$/);
    if (versionMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2],
        changes: {},
      };
      currentSection = null;
      continue;
    }

    // Match section headers
    if (line.startsWith('### Dodano')) {
      currentSection = 'added';
      continue;
    }
    if (line.startsWith('### Naprawiono')) {
      currentSection = 'fixed';
      continue;
    }
    if (line.startsWith('### Zmieniono')) {
      currentSection = 'changed';
      continue;
    }
    if (line.startsWith('### Usunięto')) {
      currentSection = 'removed';
      continue;
    }

    // Match bullet points
    const bulletMatch = line.match(/^-\s+(.+)$/);
    if (bulletMatch && currentEntry && currentSection) {
      if (!currentEntry.changes[currentSection])
        currentEntry.changes[currentSection] = [];
      currentEntry.changes[currentSection]!.push(bulletMatch[1]);
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
};
