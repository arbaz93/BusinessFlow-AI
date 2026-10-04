import JSZip from "jszip";

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown"]);
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isSupportedProjectBrief(originalName: string, mimeType: string | null) {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  const type = mimeType?.split(";")[0]?.trim().toLowerCase() ?? "";

  if (extension === "pdf") return !type || type === "application/pdf" || type === "application/octet-stream";
  if (extension === "docx") return !type || type === DOCX_MIME_TYPE || type === "application/octet-stream";
  if (TEXT_EXTENSIONS.has(extension)) {
    return !type || TEXT_MIME_TYPES.has(type) || type === "application/octet-stream";
  }
  return false;
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function decodeXmlText(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'");
}

function extractTextFromPdfBuffer(buffer: Buffer) {
  const rawText = buffer.toString("latin1");
  const matches = rawText.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:!?"'()\-\/\[\]@#$%^&*+=_~]{0,200}/g) ?? [];
  const text = matches.map((snippet) => snippet.replace(/\s+/g, " ").trim()).filter((snippet) => snippet.length > 1).join(" ");
  return normalizeExtractedText(text);
}

async function extractTextFromDocxBuffer(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) return "";

  const xml = await documentXml.async("string");
  const text = [...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => decodeXmlText(match[1]))
    .join(" ");
  return normalizeExtractedText(text.replace(/<[^>]+>/g, " "));
}

export async function extractProjectBriefText(buffer: Buffer, originalName: string, mimeType: string | null) {
  if (!isSupportedProjectBrief(originalName, mimeType)) {
    return { supported: false as const, content: null };
  }

  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  try {
    if (extension === "pdf") {
      return { supported: true as const, failed: false, content: extractTextFromPdfBuffer(buffer) || null };
    }
    if (extension === "docx") {
      return { supported: true as const, failed: false, content: await extractTextFromDocxBuffer(buffer) || null };
    }
    return { supported: true as const, failed: false, content: normalizeExtractedText(buffer.toString("utf8")) || null };
  } catch {
    return { supported: true as const, failed: true, content: null };
  }
}
