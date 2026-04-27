const pdf = require("pdf-parse");

async function extractText(fileBuffer) {
  const data = await pdf(fileBuffer);
  return data.text;
}

module.exports = extractText;
