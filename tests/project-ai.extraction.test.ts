import assert from "node:assert/strict";
import { describe, it } from "node:test";
import JSZip from "jszip";
import { extractProjectBriefText, isSupportedProjectBrief } from "@/lib/project-ai/extraction";

describe("Project Brief extraction", () => {
  it("supports PDF, DOCX, plain text, and Markdown without accepting unrelated formats", () => {
    assert.equal(isSupportedProjectBrief("brief.pdf", "application/pdf"), true);
    assert.equal(isSupportedProjectBrief("brief.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), true);
    assert.equal(isSupportedProjectBrief("brief.txt", "text/plain"), true);
    assert.equal(isSupportedProjectBrief("brief.md", "text/markdown"), true);
    assert.equal(isSupportedProjectBrief("brief.rtf", "application/rtf"), false);
    assert.equal(isSupportedProjectBrief("brief.pdf", "image/png"), false);
  });

  it("retains short legitimate text and treats whitespace as empty", async () => {
    const shortText = await extractProjectBriefText(Buffer.from("Short brief."), "brief.txt", "text/plain");
    assert.deepEqual(shortText, { supported: true, failed: false, content: "Short brief." });

    const whitespace = await extractProjectBriefText(Buffer.from(" \n\t  "), "brief.md", "text/markdown");
    assert.deepEqual(whitespace, { supported: true, failed: false, content: null });
  });

  it("distinguishes unsupported types from malformed DOCX files", async () => {
    const unsupported = await extractProjectBriefText(Buffer.from("data"), "brief.rtf", "application/rtf");
    assert.deepEqual(unsupported, { supported: false, content: null });

    const malformed = await extractProjectBriefText(Buffer.from("not a zip archive"), "brief.docx", null);
    assert.deepEqual(malformed, { supported: true, failed: true, content: null });
  });

  it("extracts XML entities from valid DOCX documents", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:document><w:body><w:p><w:r><w:t>Client &amp; agency</w:t></w:r></w:p></w:body></w:document>");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    const extracted = await extractProjectBriefText(
      buffer,
      "brief.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    assert.deepEqual(extracted, { supported: true, failed: false, content: "Client & agency" });
  });

  it("does not claim page or heading locations when extraction only returns flattened text", async () => {
    const pdf = await extractProjectBriefText(Buffer.from("Project Brief: landing page."), "brief.pdf", "application/pdf");
    assert.equal(pdf.supported, true);
    if (pdf.supported && !pdf.failed) {
      assert.equal(typeof pdf.content, "string");
      assert.equal("page" in pdf, false);
      assert.equal("heading" in pdf, false);
    }

    const markdown = await extractProjectBriefText(
      Buffer.from("# Scope\n\nDeliver a responsive website."),
      "brief.md",
      "text/markdown",
    );
    assert.deepEqual(markdown, {
      supported: true,
      failed: false,
      content: "# Scope\n\nDeliver a responsive website.",
    });

    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:pPr><w:pStyle w:val=\"Heading1\"/></w:pPr><w:r><w:t>Scope</w:t></w:r></w:p><w:p><w:r><w:t>Deliver a website.</w:t></w:r></w:p></w:body></w:document>",
    );
    const docx = await extractProjectBriefText(
      await zip.generateAsync({ type: "nodebuffer" }),
      "brief.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    assert.deepEqual(docx, { supported: true, failed: false, content: "Scope Deliver a website." });
  });
});
