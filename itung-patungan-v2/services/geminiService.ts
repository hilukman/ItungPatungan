
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptItem } from "../types";
import { resizeImage } from "./imageUtils";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface OCRResult {
  items: { name: string; price: number; quantity?: number }[];
  currency: string;
  taxAmount?: number;
  serviceAmount?: number;
  discountAmount?: number;
  deliveryFeeAmount?: number;
}

export const analyzeReceiptImage = async (base64Images: string[]): Promise<OCRResult> => {
  try {
    // Process all images: resize and remove headers
    const imageParts = await Promise.all(base64Images.map(async (img) => {
        // 1. Resize is handled via imageUtils now, but we ensure it here if not already done.
        const resizedBase64 = await resizeImage(img);
        // Remove header if present (data:image/jpeg;base64,) for the API call
        const cleanBase64 = resizedBase64.split(',')[1] || resizedBase64;
        
        return {
            inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
            }
        };
    }));

    // 2. Use gemini-3-flash-preview as recommended for general text/vision tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          ...imageParts,
          {
            text: "Analyze these receipt images (they may be multiple pages of the same bill). Extract all line items with their individual prices (total price for the line). Also extract the quantity of each item if specified (e.g. '2x Burger', quantity is 2). Extract the currency symbol (e.g. $, Rp, €). Extract the TOTAL amount charged for Tax, the TOTAL amount charged for Service/Gratuity, the TOTAL Delivery Fee/Shipping amount (if any), and the TOTAL Discount amount (if any) as absolute numbers. \n\nIMPORTANT: Handle number formatting carefully. For currencies like IDR (Rp) or VND, the dot '.' is often used as a thousands separator (e.g. '62.000' is 62000, not 62). Ensure you parse these as the full integer amounts. Do not confuse thousands separators with decimal points based on the currency context.\n\nIgnore subtotals or totals in the items list. If there are duplicate items across overlapping images, deduplicate them intelligently.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the item" },
                  price: { type: Type.NUMBER, description: "Total price for the line item (Unit Price * Quantity)" },
                  quantity: { type: Type.INTEGER, description: "Quantity of the item, default to 1 if not specified" },
                },
                required: ["name", "price"],
              },
            },
            currency: { type: Type.STRING, description: "Currency symbol found" },
            taxAmount: { type: Type.NUMBER, description: "Total Tax amount (absolute value, e.g. 5.00)" },
            serviceAmount: { type: Type.NUMBER, description: "Total Service charge amount (absolute value, e.g. 2.50)" },
            deliveryFeeAmount: { type: Type.NUMBER, description: "Total Delivery or Shipping Fee amount (absolute value, e.g. 15.00)" },
            discountAmount: { type: Type.NUMBER, description: "Total Discount amount (absolute value, e.g. 10.00)" },
          },
          required: ["items", "currency"],
        },
      },
    });

    // Check if the response contains text (it might be blocked by safety filters)
    if (response && response.text) {
      let data: OCRResult;
      try {
        // Attempt clean parse
        data = JSON.parse(response.text) as OCRResult;
      } catch (e) {
        // Fallback: strip potential markdown fences if model ignores mimeType constraint
        const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            data = JSON.parse(cleanText) as OCRResult;
        } catch (e2) {
            console.error("JSON Parse Error", e2);
            throw new Error("Failed to parse API response as JSON");
        }
      }

      // Safe guards against partial data or null data
      if (!data) throw new Error("API returned empty data");
      
      // Ensure items is an array before mapping
      const items = Array.isArray(data.items) ? data.items : [];

      // Sanitize: ensure numbers are numbers and names are strings
      data.items = items.map(item => ({
        ...item,
        name: String(item.name || "Unknown Item"),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      }));
      
      return data;
    }
    
    throw new Error("No text returned from Gemini (possibly blocked by safety settings)");

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};
