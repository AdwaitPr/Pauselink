/**
 * Detection and manipulation utilities for zero-width, bidi formatting, and invisible characters.
 * Matches Unicode ranges specified in Section E2 of the PauseLink Blueprint.
 */
export const InvisibleChars = {
  /**
   * Checks whether the specified Unicode code point is an invisible or formatting character.
   */
  isHidden(codePoint: number): boolean {
    return (
      codePoint === 0x00ad ||
      (codePoint >= 0x200b && codePoint <= 0x200f) ||
      (codePoint >= 0x202a && codePoint <= 0x202e) ||
      (codePoint >= 0x2060 && codePoint <= 0x2064) ||
      (codePoint >= 0x2066 && codePoint <= 0x2069) ||
      codePoint === 0xfeff
    );
  },

  /**
   * Returns true if the string contains one or more invisible/formatting characters.
   */
  containsHidden(text: string): boolean {
    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && this.isHidden(codePoint)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Returns the count of invisible/formatting characters in the string.
   */
  countHidden(text: string): number {
    let count = 0;
    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && this.isHidden(codePoint)) {
        count++;
      }
    }
    return count;
  },

  /**
   * Strips all invisible/formatting characters from the string.
   */
  stripHidden(text: string): string {
    const chars: string[] = [];
    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && !this.isHidden(codePoint)) {
        chars.push(char);
      }
    }
    return chars.join('');
  },
};
