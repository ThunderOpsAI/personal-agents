/**
 * Multimodal OCR Agent
 * Processes image and document inputs (photos, camera captures, PDFs, scanned letters, receipts)
 * to extract structured text, clinical notes, and agenda items using Gemini Vision.
 */

export async function parseOCR(
  input: string | Buffer,
  options?: { mimeType?: string; mode?: 'document' | 'handwriting' | 'receipt' | 'general' }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("OCR parsing requires GEMINI_API_KEY to be configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let base64Data: string;
  let mimeType = options?.mimeType || "image/jpeg";

  if (Buffer.isBuffer(input)) {
    base64Data = input.toString("base64");
  } else if (typeof input === "string") {
    if (input.startsWith("data:")) {
      const commaIdx = input.indexOf(",");
      if (commaIdx !== -1) {
        const header = input.substring(0, commaIdx);
        const mimeMatch = header.match(/data:([^;]+);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = input.substring(commaIdx + 1);
      } else {
        base64Data = input;
      }
    } else if (input.startsWith("http://") || input.startsWith("https://")) {
      const fetchRes = await fetch(input);
      if (!fetchRes.ok) throw new Error(`Failed to fetch image from URL: ${fetchRes.statusText}`);
      let arrayBuf: ArrayBuffer;
      if (typeof fetchRes.arrayBuffer === "function") {
        arrayBuf = await fetchRes.arrayBuffer();
      } else if (typeof (fetchRes as any).buffer === "function") {
        arrayBuf = (await (fetchRes as any).buffer()).buffer;
      } else {
        const text = await fetchRes.text();
        arrayBuf = Buffer.from(text).buffer;
      }
      base64Data = Buffer.from(arrayBuf).toString("base64");
      const fetchedType = fetchRes.headers && typeof fetchRes.headers.get === "function" ? fetchRes.headers.get("content-type") : null;
      if (fetchedType) mimeType = fetchedType;
    } else {
      base64Data = input;
    }
  } else {
    throw new Error("Invalid image input for OCR parsing.");
  }

  const prompt = options?.mode === "receipt"
    ? "Analyze this receipt or financial invoice. Extract the merchant/store, date, line items with amounts, subtotal, GST/tax, and total amount spent."
    : options?.mode === "handwriting"
    ? "Transcribe and extract all handwritten notes, lists, or clinical records from this image precisely."
    : "Transcribe and analyze all readable text, medical documents, appointments, instructions, or notes from this image. Structure the key information clearly.";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini Vision OCR API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("No readable text found in image.");
  }

  return text.trim();
}

export interface ReceiptItemSplit {
  description: string;
  amount: number;
  category: string;
}

export interface StructuredDocumentExtraction {
  docType: 'mixed_receipt' | 'medical_receipt' | 'recurring_bill' | 'referral_letter' | 'medication_box' | 'general';
  title?: string;
  merchant?: string;
  provider?: string;
  service?: string;
  amount?: number;
  receipt_date?: string;
  due_date?: string;
  frequency?: string;
  splits?: ReceiptItemSplit[];
  appointmentDate?: string;
  clinicalNotes?: string;
  medication?: {
    name: string;
    dosage: string;
    instructions: string;
  };
  summary: string;
}

/**
 * Detects document type from OCR or message text.
 */
export function detectDocumentType(text: string): StructuredDocumentExtraction['docType'] {
  const lowered = text.toLowerCase();
  
  if (/\b(?:referral|dear\s+colleague|dear\s+doctor|re:\s+mr|patient\s+history|clinical\s+summary|mri\s+report)\b/i.test(lowered)) {
    return 'referral_letter';
  }
  if (/\b(?:tablets?|capsules?|take\s+\d+|daily\s+dosage|mg\s+daily|prescription\s+label|dispensed|take\s+with\s+food)\b/i.test(lowered)) {
    return 'medication_box';
  }
  if (/\b(?:dr\.?|doctor|clinic|physiotherapy|neurosurgery|consultation\s+fee|medical\s+centre|chemist|pharmacy\s+receipt|medicare)\b/i.test(lowered)) {
    return 'medical_receipt';
  }
  if (/\b(?:due\s+date|bill|invoice\s+number|account\s+no|telecom|energy|electricity|water\s+bill|subscription|monthly\s+fee)\b/i.test(lowered)) {
    return 'recurring_bill';
  }
  if (/\b(?:receipt|tax\s+invoice|total|subtotal|gst|eftpos|change\s+due)\b/i.test(lowered)) {
    return 'mixed_receipt';
  }
  return 'general';
}

/**
 * Parses mixed line-items from receipt text and groups them into categories.
 */
export function parseReceiptSplits(text: string): { splits: ReceiptItemSplit[]; total: number } {
  const lines = text.split(/\r?\n/);
  const items: Array<{ name: string; amount: number; category: string }> = [];
  let detectedTotal = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for total line
    const totalMatch = trimmed.match(/\b(?:total|amount\s+paid|balance\s+due)\b[:\s]*\$?([0-9]+\.[0-9]{2})/i);
    if (totalMatch) {
      detectedTotal = parseFloat(totalMatch[1]);
      continue;
    }

    // Match line item format: description ... $12.34
    const itemMatch = trimmed.match(/^(.*?)\s+\$?([0-9]+\.[0-9]{2})$/);
    if (itemMatch) {
      const name = itemMatch[1].replace(/^[-*•\d\.\s]+/, "").trim();
      const amount = parseFloat(itemMatch[2]);
      if (name.toLowerCase().includes("subtotal") || name.toLowerCase().includes("total") || name.toLowerCase().includes("tax")) {
        continue;
      }
      
      let category = "Groceries";
      const nameLower = name.toLowerCase();
      if (/\b(?:panadol|nurofen|paracetamol|bandage|cream|tablets?|medicine|pharmacy|chemist|script)\b/i.test(nameLower)) {
        category = "Medical";
      } else if (/\b(?:soap|detergent|towel|cleaner|paper|foil|sponge|battery|batteries)\b/i.test(nameLower)) {
        category = "Household";
      } else if (/\b(?:pet|dog|cat)\b/i.test(nameLower)) {
        category = "Pets";
      }

      items.push({ name, amount, category });
    }
  }

  // If items found, aggregate into category splits
  if (items.length > 0) {
    const categoryTotals: Record<string, { amount: number; descriptions: string[] }> = {};
    let sum = 0;
    for (const it of items) {
      sum += it.amount;
      if (!categoryTotals[it.category]) {
        categoryTotals[it.category] = { amount: 0, descriptions: [] };
      }
      categoryTotals[it.category].amount += it.amount;
      categoryTotals[it.category].descriptions.push(it.name);
    }

    const splits: ReceiptItemSplit[] = Object.entries(categoryTotals).map(([cat, val]) => ({
      description: `${cat} (${val.descriptions.slice(0, 3).join(", ")}${val.descriptions.length > 3 ? "..." : ""})`,
      amount: parseFloat(val.amount.toFixed(2)),
      category: cat,
    }));

    return {
      splits,
      total: detectedTotal > 0 ? detectedTotal : parseFloat(sum.toFixed(2)),
    };
  }

  // Fallback single total extraction
  const singleTotalMatch = text.match(/\$?([0-9]+\.[0-9]{2})/);
  const fallbackAmount = singleTotalMatch ? parseFloat(singleTotalMatch[1]) : 0;
  return {
    splits: [
      {
        description: "Receipt Expense",
        amount: fallbackAmount,
        category: "Groceries",
      },
    ],
    total: fallbackAmount,
  };
}

/**
 * Extracts structured properties from document text based on detected document type.
 */
export function parseDocumentTextToExtraction(text: string): StructuredDocumentExtraction {
  const docType = detectDocumentType(text);
  const nowStr = new Date().toISOString().split("T")[0];

  if (docType === "mixed_receipt") {
    const { splits, total } = parseReceiptSplits(text);
    const merchantMatch = text.match(/(?:welcome\s+to|store|merchant|retailer)?\s*([A-Za-z\s]{3,25}(?:Supermarket|Coles|Woolworths|Aldi|Pharmacy|Chemist|Target|Kmart|Bunnings|Bakery|Cafe))/i) ||
                          text.match(/^([A-Za-z\s]{3,20})/m);
    const merchant = merchantMatch ? merchantMatch[1].trim() : "Store";

    return {
      docType: "mixed_receipt",
      merchant,
      amount: total,
      receipt_date: nowStr,
      splits,
      summary: `Analyzed ${merchant} receipt ($${total.toFixed(2)}) across ${splits.length} categories.`,
    };
  }

  if (docType === "medical_receipt") {
    const amountMatch = text.match(/\b(?:total|fee|amount\s+paid|due|cost)[:\s]*\$?([0-9]+(?:\.[0-9]{2})?)/i) || text.match(/\$?([0-9]+\.[0-9]{2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const providerMatch = text.match(/\b(?:Dr\.?|Doctor|Clinic|Prof\.?)\s+([A-Za-z\s]+)/i) || text.match(/([A-Za-z\s]+(?:Pharmacy|Chemist|Medical|Physiotherapy|Health))/i);
    const provider = providerMatch ? providerMatch[0].trim() : "Medical Provider";
    const serviceMatch = text.match(/(?:service|consultation|treatment|prescription|item)[:\s]*([A-Za-z0-9\s]+)/i);
    const service = serviceMatch ? serviceMatch[1].trim() : "Clinical Consult / Pharmacy";

    return {
      docType: "medical_receipt",
      provider,
      service,
      amount,
      receipt_date: nowStr,
      summary: `Medical receipt from ${provider} for ${service} ($${amount.toFixed(2)}).`,
    };
  }

  if (docType === "recurring_bill") {
    const amountMatch = text.match(/\b(?:total\s+amount\s+due|amount\s+due|total\s+due|balance)[:\s]*\$?([0-9]+(?:\.[0-9]{2})?)/i) || text.match(/\$?([0-9]+\.[0-9]{2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const billerMatch = text.match(/([A-Za-z\s]{3,20}(?:Energy|Power|Water|Telstra|Optus|Internet|Broadband|Gym|Council))/i) || text.match(/^([A-Za-z\s]{3,20})/m);
    const title = billerMatch ? billerMatch[1].trim() : "Utility Bill";
    const dateMatch = text.match(/\b(?:due\s+date|pay\s+by)[:\s]*([0-9]{1,2}[\/\-\s][0-9]{1,2}[\/\-\s][0-9]{2,4}|[A-Za-z]+\s+\d{1,2},?\s*\d{4})/i);
    const due_date = dateMatch ? dateMatch[1].trim() : nowStr;

    return {
      docType: "recurring_bill",
      title,
      amount,
      due_date,
      frequency: "monthly",
      summary: `Recurring bill detected: ${title} ($${amount.toFixed(2)}) due ${due_date}.`,
    };
  }

  if (docType === "referral_letter") {
    const specialistMatch = text.match(/\b(?:Dr\.?|Prof\.?|Mr\.?)\s+([A-Za-z\s]+)/i);
    const provider = specialistMatch ? specialistMatch[0].trim() : "Specialist Physician";
    const dateMatch = text.match(/\b(?:appointment|scheduled|date)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-\s]\d{1,2}[\/\-\s]\d{2,4}(?:\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i);
    const appointmentDate = dateMatch ? dateMatch[1].trim() : undefined;

    return {
      docType: "referral_letter",
      provider,
      appointmentDate,
      clinicalNotes: text.substring(0, 300).trim(),
      summary: `Referral letter to ${provider}${appointmentDate ? ` on ${appointmentDate}` : ""}.`,
    };
  }

  if (docType === "medication_box") {
    const medMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g))/i);
    const name = medMatch ? medMatch[1].trim() : "Medication";
    const dosage = medMatch ? medMatch[2].trim() : "Standard dosage";
    const instructMatch = text.match(/\b(?:take\s+.*?|instructions?[:\s]*.*?)(?:\.|$)/i);
    const instructions = instructMatch ? instructMatch[0].trim() : "Take as directed by doctor/pharmacist.";

    return {
      docType: "medication_box",
      medication: { name, dosage, instructions },
      summary: `Medication box: ${name} (${dosage}). Instructions: ${instructions}`,
    };
  }

  return {
    docType: "general",
    summary: text.substring(0, 150).trim(),
  };
}

