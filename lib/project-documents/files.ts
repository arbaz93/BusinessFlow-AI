export const MAX_PROJECT_DOCUMENT_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH = 128;
export const MAX_PROJECT_DOCUMENT_ORIGINAL_NAME_LENGTH = 255;
export const MAX_PROJECT_DOCUMENT_FILE_HEAD_BYTES = 1024;

const STORAGE_NAME_PATTERN = /[^\p{L}\p{N}._-]+/gu;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/g;
const REPEATED_UNDERSCORE_PATTERN = /_{2,}/g;
const EDGE_DOT_PATTERN = /^\.+|\.+$/g;
const TRAILING_SEPARATOR_PATTERN = /[._]+$/g;

export type ProjectDocumentFileType = {
  extension: string;
  label: string;
  mimeType: string;
  acceptedMimeTypes: readonly string[];
};

const PROJECT_DOCUMENT_FILE_TYPES: readonly ProjectDocumentFileType[] = [
  {
    extension: "pdf",
    label: "PDF",
    mimeType: "application/pdf",
    acceptedMimeTypes: ["application/pdf"],
  },
  {
    extension: "docx",
    label: "Word document",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    acceptedMimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  {
    extension: "txt",
    label: "plain text",
    mimeType: "text/plain",
    acceptedMimeTypes: ["text/plain"],
  },
  {
    extension: "md",
    label: "Markdown",
    mimeType: "text/markdown",
    acceptedMimeTypes: ["text/markdown", "text/x-markdown"],
  },
  {
    extension: "markdown",
    label: "Markdown",
    mimeType: "text/markdown",
    acceptedMimeTypes: ["text/markdown", "text/x-markdown"],
  },
  {
    extension: "csv",
    label: "CSV",
    mimeType: "text/csv",
    acceptedMimeTypes: ["text/csv", "text/comma-separated-values"],
  },
  {
    extension: "png",
    label: "PNG image",
    mimeType: "image/png",
    acceptedMimeTypes: ["image/png"],
  },
  {
    extension: "jpg",
    label: "JPEG image",
    mimeType: "image/jpeg",
    acceptedMimeTypes: ["image/jpeg", "image/pjpeg"],
  },
  {
    extension: "jpeg",
    label: "JPEG image",
    mimeType: "image/jpeg",
    acceptedMimeTypes: ["image/jpeg", "image/pjpeg"],
  },
  {
    extension: "gif",
    label: "GIF image",
    mimeType: "image/gif",
    acceptedMimeTypes: ["image/gif"],
  },
  {
    extension: "webp",
    label: "WebP image",
    mimeType: "image/webp",
    acceptedMimeTypes: ["image/webp"],
  },
];

const FILE_TYPES_BY_EXTENSION = new Map(
  PROJECT_DOCUMENT_FILE_TYPES.map((fileType) => [fileType.extension, fileType]),
);

export const PROJECT_DOCUMENT_FILE_LABELS = PROJECT_DOCUMENT_FILE_TYPES.map(
  (fileType) => fileType.label,
);

export const PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE = [
  ...PROJECT_DOCUMENT_FILE_TYPES.flatMap((fileType) => [
    `.${fileType.extension}`,
    ...fileType.acceptedMimeTypes,
  ]),
].join(",");

export const PROJECT_DOCUMENT_UPLOAD_HINT =
  "PDF, DOCX, TXT, MD, CSV, PNG, JPG, GIF, or WebP up to 20 MB.";

export function formatProjectDocumentFileSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024 && sizeBytes % (1024 * 1024) === 0) {
    return `${sizeBytes / (1024 * 1024)} MB`;
  }
  return `${Math.round(sizeBytes / 1024)} KB`;
}

export function getProjectDocumentFileExtension(fileName: string): string {
  if (typeof fileName !== "string") return "";
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === fileName.length - 1) return "";
  return fileName.slice(lastDot + 1).toLowerCase().slice(0, 16);
}

function boundFileNameLength(sanitized: string): string {
  if (sanitized.length <= MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH) return sanitized;
  const lastDot = sanitized.lastIndexOf(".");
  if (lastDot <= 0) return sanitized.slice(0, MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH);
  const extension = sanitized.slice(lastDot);
  const baseLimit = MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH - extension.length;
  if (baseLimit < 1) return sanitized.slice(0, MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH);
  return `${sanitized.slice(0, baseLimit)}${extension}`;
}

export function sanitizeProjectDocumentFileName(rawName: string): string {
  if (typeof rawName !== "string") return "document";

  const finalSegment = rawName.split(/[\\/]/).filter(Boolean).pop() ?? "";
  const sanitized = finalSegment
    .replace(CONTROL_CHARACTER_PATTERN, "")
    .replace(STORAGE_NAME_PATTERN, "_")
    .replace(REPEATED_UNDERSCORE_PATTERN, "_")
    .replace(EDGE_DOT_PATTERN, "")
    .replace(TRAILING_SEPARATOR_PATTERN, "");

  return boundFileNameLength(sanitized) || "document";
}

function normalizeMimeType(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

export type ProjectDocumentFileValidation =
  | {
      ok: true;
      extension: string;
      mimeType: string;
      storageName: string;
      originalName: string;
    }
  | { ok: false; error: string };

export function validateProjectDocumentUploadFile(file: {
  name: string;
  size: number;
  type?: string | null;
}): ProjectDocumentFileValidation {
  if (typeof file.name !== "string" || file.name.trim().length === 0) {
    return { ok: false, error: "Choose a document to upload." };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  if (file.size > MAX_PROJECT_DOCUMENT_FILE_BYTES) {
    return {
      ok: false,
      error: `Documents must be ${formatProjectDocumentFileSize(MAX_PROJECT_DOCUMENT_FILE_BYTES)} or smaller. Reduce the file size and try again.`,
    };
  }

  const storageName = sanitizeProjectDocumentFileName(file.name);
  const extension = getProjectDocumentFileExtension(storageName);
  const fileType = FILE_TYPES_BY_EXTENSION.get(extension);

  if (!fileType) {
    return {
      ok: false,
      error: `This file type is not supported. Upload ${PROJECT_DOCUMENT_FILE_LABELS.join(", ")} files.`,
    };
  }

  const reportedMimeType = normalizeMimeType(file.type);
  if (
    reportedMimeType &&
    reportedMimeType !== "application/octet-stream" &&
    !fileType.acceptedMimeTypes.includes(reportedMimeType)
  ) {
    return {
      ok: false,
      error: `The file content does not match a ${fileType.label}. Check the file and try again.`,
    };
  }

  const originalName = file.name.trim().slice(0, MAX_PROJECT_DOCUMENT_ORIGINAL_NAME_LENGTH);

  return {
    ok: true,
    extension,
    mimeType: fileType.mimeType,
    storageName,
    originalName: originalName || "document",
  };
}

function hasMagic(head: Uint8Array, magic: readonly number[], offset = 0): boolean {
  if (head.length < offset + magic.length) return false;
  return magic.every((byte, index) => head[offset + index] === byte);
}

function containsMagic(head: Uint8Array, magic: readonly number[]): boolean {
  if (head.length < magic.length) return false;
  for (let index = 0; index + magic.length <= head.length; index += 1) {
    if (hasMagic(head, magic, index)) return true;
  }
  return false;
}

type ProjectDocumentContentSignature = (head: Uint8Array) => boolean;

const CONTENT_SIGNATURES: Readonly<Record<string, ProjectDocumentContentSignature>> = {
  pdf: (head) => containsMagic(head, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  docx: (head) => hasMagic(head, [0x50, 0x4b, 0x03, 0x04]),
  png: (head) => hasMagic(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpg: (head) => head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
  jpeg: (head) => head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
  gif: (head) =>
    hasMagic(head, [0x47, 0x49, 0x46, 0x38]) &&
    (head[4] === 0x37 || head[4] === 0x39) &&
    head[5] === 0x61,
  webp: (head) => hasMagic(head, [0x52, 0x49, 0x46, 0x46]) && hasMagic(head, [0x57, 0x45, 0x42, 0x50], 8),
};

export function verifyProjectDocumentFileContent(
  head: Uint8Array | null | undefined,
  extension: string,
): boolean {
  if (!head || head.length === 0) return true;
  const signature = CONTENT_SIGNATURES[extension];
  if (!signature) return true;
  return signature(head);
}

export async function readProjectDocumentFileHead(
  file: Blob,
  bytes: number = MAX_PROJECT_DOCUMENT_FILE_HEAD_BYTES,
): Promise<Uint8Array> {
  const headBuffer = await file.slice(0, bytes).arrayBuffer();
  return new Uint8Array(headBuffer);
}

export type ProjectDocumentStorageScope = {
  organizationId: string;
  projectId: string;
  documentId: string;
};

export function buildProjectDocumentStoragePath(
  scope: ProjectDocumentStorageScope,
  storageName: string,
): string {
  return `organizations/${scope.organizationId}/projects/${scope.projectId}/documents/${scope.documentId}/${storageName}`;
}

export function isProjectDocumentStoragePath(
  storagePath: string | null | undefined,
  scope?: Partial<ProjectDocumentStorageScope>,
): boolean {
  if (typeof storagePath !== "string" || storagePath.length === 0) return false;
  if (storagePath.startsWith("/") || storagePath.includes("\\")) return false;
  if (CONTROL_CHARACTER_PATTERN.test(storagePath)) return false;

  const segments = storagePath.split("/");
  if (segments.length !== 7) return false;

  const [namespacePrefix, organizationId, projectPrefix, projectId, documentsPrefix, documentId, fileName] =
    segments;

  if (namespacePrefix !== "organizations" || projectPrefix !== "projects" || documentsPrefix !== "documents") {
    return false;
  }
  if (!organizationId || !projectId || !documentId) return false;
  if (organizationId === ".." || projectId === ".." || documentId === "..") return false;

  if (
    fileName.length === 0 ||
    fileName === "." ||
    fileName === ".." ||
    fileName.startsWith(".") ||
    fileName.length > MAX_PROJECT_DOCUMENT_FILE_NAME_LENGTH
  ) {
    return false;
  }
  if (!/^[\p{L}\p{N}._-]+$/u.test(fileName)) return false;

  if (scope?.organizationId !== undefined && organizationId !== scope.organizationId) return false;
  if (scope?.projectId !== undefined && projectId !== scope.projectId) return false;
  if (scope?.documentId !== undefined && documentId !== scope.documentId) return false;

  return true;
}
