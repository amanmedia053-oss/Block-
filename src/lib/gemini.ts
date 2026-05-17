import { GoogleGenAI } from "@google/genai";

// Always initialize inside functions or hooks or check for presence
const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets.");
    }
    return new GoogleGenAI({ apiKey });
};

export async function generateReportContent(params: {
    reportType: string;
    description: string;
    phoneNumber?: string;
    country?: string;
    reporterName?: string;
}) {
    const ai = getAI();
    const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert at writing formal reports and support requests. 
        TASK: Generate a professional report email in ENGLISH language.
        
        INPUT DETAILS:
        - Report Category: ${params.reportType}
        - Problem Description: ${params.description}
        - Target Phone Number: ${params.phoneNumber || 'N/A'}
        - Target Country: ${params.country || 'N/A'}
        - Reporter's Name: ${params.reporterName || 'Concerned User'}
        
        IMPORTANT INSTRUCTIONS:
        1. The output MUST be entirely in ENGLISH.
        2. If the Reporter's Name or Description is in Pashto or any other language, TRANSLATE it to professional English for the report.
        3. Use a formal tone suitable for a legal or trust & safety department.
        4. Include a clear subject line and a structured body.
        
        Return ONLY the email content in Markdown format.`,
    });

    const response = await model;
    return response.text;
}

export async function getAISuggestions(description: string) {
    const ai = getAI();
    const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this description of an issue, provide 3 short, helpful suggestions for reporting it effectively:
        "${description}"
        
        Return a JSON array of strings.`,
        config: {
            responseMimeType: "application/json"
        }
    });

    const response = await model;
    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
}
