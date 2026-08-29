import pdfParse from 'pdf-parse';

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES || '20971520', 10); // 20 MB default

export interface ExtractedChunk {
  chunkIndex: number;
  content: string;
  charCount: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  rawText?: string;
  chunks?: ExtractedChunk[];
  error?: string;
}

export function validateFile(filename: string, fileSize: number): { valid: boolean; error?: string } {
  const ext = filename.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'txt', 'md', 'markdown'];

  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type .${ext || 'unknown'}. Please upload PDF, TXT, or Markdown (.md) documents.`,
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum limit of 20 MB.`,
    };
  }

  return { valid: true };
}

export function cleanText(text: string): string {
  return text
    // Replace non-printable ASCII/control characters except newlines/tabs
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Windows line endings
    .replace(/\r\n/g, '\n')
    // Remove repeated blank lines (3 or more)
    .replace(/\n{3,}/g, '\n\n')
    // Normalize spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function chunkText(cleanedText: string, chunkSize = 1200, overlap = 200): ExtractedChunk[] {
  if (!cleanedText) return [];

  const chunks: ExtractedChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= cleanedText.length) {
      endIndex = cleanedText.length;
    } else {
      // Find nearest space or newline to avoid cutting words
      const lastSpace = cleanedText.lastIndexOf(' ', endIndex);
      const lastNewline = cleanedText.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastSpace, lastNewline);

      if (breakPoint > startIndex + chunkSize / 2) {
        endIndex = breakPoint;
      }
    }

    const chunkContent = cleanedText.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        content: chunkContent,
        charCount: chunkContent.length,
      });
      chunkIndex++;
    }

    if (endIndex >= cleanedText.length) break;
    startIndex = endIndex - overlap;
    if (startIndex <= 0) startIndex = endIndex; // Prevent infinite loop on edge cases
  }

  return chunks;
}

export async function processDocumentBuffer(
  buffer: Buffer,
  filename: string
): Promise<DocumentProcessingResult> {
  const ext = filename.split('.').pop()?.toLowerCase();

  try {
    let extractedRawText = '';

    if (ext === 'pdf') {
      const pdfData = await pdfParse(buffer);
      extractedRawText = pdfData.text || '';
    } else if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
      extractedRawText = buffer.toString('utf-8');
    } else {
      return { success: false, error: 'Unsupported format' };
    }

    const cleaned = cleanText(extractedRawText);

    if (!cleaned || cleaned.length === 0) {
      return {
        success: false,
        error: 'Document contains no extractable text or is empty.',
      };
    }

    const chunks = chunkText(cleaned);

    return {
      success: true,
      rawText: cleaned,
      chunks,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to extract text from document';
    return {
      success: false,
      error: `Text extraction error: ${message}`,
    };
  }
}
