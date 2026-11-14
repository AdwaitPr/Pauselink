import tldList from './tlds.json';

/**
 * Registry of valid ICANN Top Level Domains (and RFC 2606 test TLDs) along with
 * common file extension heuristics used during bare-domain URL extraction.
 * Matches Kotlin TldRegistry.
 */
export const TldRegistry = {
  commonFileExtensions: new Set([
    'zip', 'mov', 'tar', 'gz', 'rar', '7z', 'iso', 'bin',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'json', 'xml', 'html', 'htm',
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
    'mp3', 'mp4', 'wav', 'avi', 'mkv', 'ogg'
  ]),

  tldSet: new Set<string>([
    ...tldList,
    'com', 'net', 'org', 'edu', 'gov', 'example', 'test', 'invalid', 'localhost'
  ]),

  /**
   * Checks if the given label is a recognized ICANN or test TLD.
   */
  isIcannTld(tld: string): boolean {
    return this.tldSet.has(tld.toLowerCase());
  },

  /**
   * Checks if the given TLD/extension matches a common file extension.
   * Bare domains ending in these extensions require a path or `www.` prefix to be considered a link.
   */
  isCommonFileExtension(ext: string): boolean {
    return this.commonFileExtensions.has(ext.toLowerCase());
  }
};
