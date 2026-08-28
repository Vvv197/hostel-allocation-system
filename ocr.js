const Tesseract = require("tesseract.js");

/**
 * Extract text from receipt image using OCR
 * @param {string} imagePath - path to uploaded image
 * @returns {Promise<string>} extracted text
 */
async function extractText(imagePath) {
    try {
        const result = await Tesseract.recognize(
            imagePath,
            "eng",
            {
                logger: m => {
                    // optional progress logs
                    console.log(m.status, m.progress);
                }
            }
        );

        return result.data.text;

    } catch (err) {
        console.error("OCR ERROR:", err);
        throw new Error("Failed to process image");
    }
}

module.exports = extractText;