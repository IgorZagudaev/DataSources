import type { DataSource, Report } from './types';

// Источник, у которого найден выбранный тип, и путь до него в дереве
export interface SourceMatch {
  sourceId: string;
  /** ID всех родителей: доклад → раздел → справка → [блок справки] → показатель → разрез */
  ancestorIds: string[];
}

function hasSourceType(source: DataSource, sourceType: string): boolean {
  return Array.isArray(source.sourceTypes)
    && (source.sourceTypes as readonly string[]).includes(sourceType);
}

function collectFromSlices(
  slices: Array<{ id: string; sources: DataSource[] }>,
  sourceType: string,
  parentIds: string[],
  matches: SourceMatch[]
): void {
  for (const slice of slices) {
    for (const source of slice.sources || []) {
      if (hasSourceType(source, sourceType)) {
        matches.push({ sourceId: source.id, ancestorIds: [...parentIds, slice.id] });
      }
    }
  }
}

/**
 * Поиск всех источников с указанным типом.
 * Проверяются все три места, где встречаются источники:
 *  - прямые источники справки (note.sources);
 *  - источники разрезов показателей справки (note.indicators[].slices[].sources);
 *  - источники разрезов показателей блоков справки (note.noteBlocks[].indicators[].slices[].sources).
 */
export function findSourcesByType(reports: Report[], sourceType: string): SourceMatch[] {
  const matches: SourceMatch[] = [];
  if (!sourceType) {
    return matches;
  }

  for (const report of reports) {
    for (const section of report.sections) {
      for (const note of section.notes) {
        const notePath = [report.id, section.id, note.id];

        // Прямые источники справки
        for (const source of note.sources || []) {
          if (hasSourceType(source, sourceType)) {
            matches.push({ sourceId: source.id, ancestorIds: notePath });
          }
        }

        // Источники разрезов показателей справки
        for (const indicator of note.indicators || []) {
          collectFromSlices(indicator.slices || [], sourceType, [...notePath, indicator.id], matches);
        }

        // Источники разрезов показателей блоков справки
        for (const noteBlock of note.noteBlocks || []) {
          const noteBlockPath = [...notePath, noteBlock.id];
          for (const indicator of noteBlock.indicators || []) {
            collectFromSlices(indicator.slices || [], sourceType, [...noteBlockPath, indicator.id], matches);
          }
        }
      }
    }
  }

  return matches;
}

/** ID узлов, которые нужно раскрыть, чтобы найденные источники стали видны */
export function collectAncestorIds(matches: SourceMatch[]): string[] {
  const ids = new Set<string>();
  for (const match of matches) {
    for (const id of match.ancestorIds) {
      ids.add(id);
    }
  }
  return Array.from(ids);
}
