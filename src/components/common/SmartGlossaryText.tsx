import React, { useMemo } from 'react';
import { GLOSSARY_TERMS, GlossaryTermData } from '../../data/glossary-data';
import { GlossaryTerm } from './GlossaryTerm';

interface SmartGlossaryTextProps {
  text: string;
  className?: string;
  limitPerTerm?: number; // Nombre max d'occurrences soulignées par terme (défaut 1)
  onNavigateToGlossary?: () => void;
}

interface MatchRule {
  alias: string;
  term: GlossaryTermData;
  regex: RegExp;
}

export const SmartGlossaryText: React.FC<SmartGlossaryTextProps> = ({
  text,
  className = '',
  limitPerTerm = 1,
  onNavigateToGlossary
}) => {
  // Precompile match rules sorted by longest alias first to avoid partial word collisions
  const matchRules: MatchRule[] = useMemo(() => {
    const rules: MatchRule[] = [];

    GLOSSARY_TERMS.forEach(term => {
      // Add all aliases and term names
      const allAliases = Array.from(
        new Set([
          term.term,
          term.abbreviation,
          ...term.aliases
        ].filter(Boolean) as string[])
      );

      allAliases.forEach(alias => {
        // Escape special regex characters
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Word boundary match: handle letters, apostrophes, accents
        const regex = new RegExp(`(?<=^|\\s|[,;.:(«"'\`])(${escaped})(?=$|\\s|[,;.:)»"'\`])`, 'gi');
        rules.push({
          alias,
          term,
          regex
        });
      });
    });

    // Sort by alias length descending
    return rules.sort((a, b) => b.alias.length - a.alias.length);
  }, []);

  const parsedContent = useMemo(() => {
    if (!text || typeof text !== 'string') return text;

    // Track how many times each term ID has been highlighted in this text block
    const termCountMap: { [termId: string]: number } = {};

    // Find all matches with their start/end indices in the string
    interface FoundMatch {
      start: number;
      end: number;
      text: string;
      termId: string;
    }

    const foundMatches: FoundMatch[] = [];

    for (const rule of matchRules) {
      const currentCount = termCountMap[rule.term.id] || 0;
      if (currentCount >= limitPerTerm) continue;

      let match: RegExpExecArray | null;
      // Reset regex index
      rule.regex.lastIndex = 0;

      while ((match = rule.regex.exec(text)) !== null) {
        const start = match.index;
        const matchedStr = match[0];
        const end = start + matchedStr.length;

        // Verify this range does not overlap with an existing match
        const isOverlapping = foundMatches.some(
          existing => Math.max(start, existing.start) < Math.min(end, existing.end)
        );

        if (!isOverlapping) {
          foundMatches.push({
            start,
            end,
            text: matchedStr,
            termId: rule.term.id
          });

          termCountMap[rule.term.id] = (termCountMap[rule.term.id] || 0) + 1;

          if (termCountMap[rule.term.id] >= limitPerTerm) {
            break;
          }
        }
      }
    }

    if (foundMatches.length === 0) {
      return text;
    }

    // Sort matches in order of appearance
    foundMatches.sort((a, b) => a.start - b.start);

    // Build the array of React nodes
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    foundMatches.forEach((m, idx) => {
      // Append text before match
      if (m.start > lastIndex) {
        elements.push(text.substring(lastIndex, m.start));
      }

      // Append interactive glossary term
      elements.push(
        <GlossaryTerm
          key={`term-${m.termId}-${idx}`}
          termId={m.termId}
          onNavigateToGlossary={onNavigateToGlossary}
        >
          {m.text}
        </GlossaryTerm>
      );

      lastIndex = m.end;
    });

    // Append any remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements;
  }, [text, matchRules, limitPerTerm, onNavigateToGlossary]);

  return <span className={className}>{parsedContent}</span>;
};
