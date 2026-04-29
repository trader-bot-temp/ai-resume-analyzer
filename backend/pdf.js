const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");

async function extractText(buffer, mimeType = "", originalName = "") {
  try {
    let text = "";

    const type =
      mimeType ||
      (originalName ? originalName.split(".").pop().toLowerCase() : "");

    console.log("📄 FILE TYPE:", mimeType, type);

    // ================= PDF (ONLY PDF PARSER) =================
    if (mimeType === "application/pdf" || type === "pdf") {
      const data = await pdfParse(buffer);
      text = data.text || "";
    }

    // ================= DOCX =================
    else if (
      mimeType.includes("wordprocessingml") ||
      type === "docx"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    }

    // ================= DOC =================
    else if (mimeType === "application/msword" || type === "doc") {
      text = await new Promise((resolve, reject) => {
        textract.fromBufferWithMime(
          mimeType || "application/msword",
          buffer,
          (err, text) => {
            if (err) reject(err);
            else resolve(text);
          }
        );
      });
    }

    // ================= TXT =================
    else if (mimeType === "text/plain" || type === "txt") {
      text = buffer.toString("utf-8");
    }

    // ================= UNSUPPORTED =================
    else {
      throw new Error("Unsupported file type");
    }

    // ================= FINAL CHECK =================
    if (!text || text.trim().length < 10) {
      throw new Error(
        "No readable text found. PDF may be scanned image-based."
      );
    }

    return text;
  } catch (err) {
    console.error("❌ Parser error:", err.message);

    return `ERROR: ${err.message}`;
  }
}

module.exports = extractText;