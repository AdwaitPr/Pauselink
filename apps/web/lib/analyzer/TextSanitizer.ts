import { InvisibleChars } from './InvisibleChars';
import { SanitizedText } from './types';

/**
 * Sanitizes input text by normalizing line endings and enforcing character limits
 * while preserving character cases and detecting invisible/formatting characters.
 * Matches Kotlin TextSanitizer.
 */
export const TextSanitizer = {
  /**
   * Prepares raw input text:
   * - Normalizes CRLF and CR line endings to LF.
   * - Preserves case (paths and parameters are case-sensitive).
   * - Detects invisible/formatting characters without silently deleting them.
   * - Caps text length at [maxChars].
   */
  prepare(input: string, maxChars: number = 10_000): SanitizedText {
    if (!input || input.length === 0) {
      return { value: '', wasTruncated: false, hadHiddenChars: false };
    }

    const hadHiddenChars = InvisibleChars.containsHidden(input);
    const normalized = this.normalizeLineEndings(input);

    const wasTruncated = normalized.length > maxChars;
    const value = wasTruncated ? normalized.substring(0, maxChars) : normalized;

    return {
      value,
      wasTruncated,
      hadHiddenChars,
    };
  },

  /**
   * Checks whether the given string contains hidden or formatting characters.
   */
  hasHiddenChars(text: string): boolean {
    return InvisibleChars.containsHidden(text);
  },

  /**
   * Strips hidden characters from the given string.
   */
  stripHiddenChars(text: string): string {
    return InvisibleChars.stripHidden(text);
  },

  normalizeLineEndings(text: string): string {
    let result = '';
    const len = text.length;
    let i = 0;
    while (i < len) {
      const c = text[i];
      if (c === '\r') {
        result += '\n';
        if (i + 1 < len && text[i + 1] === '\n') {
          i++; // Skip \n in \r\n
        }
      } else {
        result += c;
      }
      i++;
    }
    return result;
  },
};
