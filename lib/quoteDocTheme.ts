/**
 * Shared visual tokens for quote PDF (`QuoteDocument`) and Word export (`buildQuoteDocx`).
 * Keep hex strings without `#` where docx `color` expects none — docx helpers add as needed.
 * In-flow section headings use SECTION_TITLE_BLUE; the standalone “Detailed Financials”
 * page title uses BLACK (same as PDF `financialsTitle`).
 */
export const QUOTE_DOC_THEME = {
  SECTION_TITLE_BLUE: "4A90E2",
  TABLE_BORDER: "000000",
  TABLE_SECTION_BG: "D3D3D3",
  CLIENT_PROVIDE_HEADER_BG: "FADBD8",
  CLIENT_PROVIDE_TITLE_TEXT: "1A1A1A",
  COVER_ACCENT: "6495ED",
  COVER_LABEL: "666666",
  COVER_VERSION_REF: "999999",
  NOTE_BORDER: "DDDDDD",
  NOTE_BG: "FAFAFA",
  NOTE_BODY: "333333",
  BLACK: "000000",
} as const;
