/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export async function generateReportContent(params: {
    reportType: string;
    description: string;
    phoneNumber?: string;
    country?: string;
    reporterName?: string;
}) {
    const prompt = `You are an expert at writing formal reports and support requests. 
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
    
    Return ONLY the email content in Markdown format.`;

    const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Gemini API Error details:", error);
        throw new Error(error.error || "AI generation failed");
    }

    const data = await response.json();
    return data.text;
}

export async function getAISuggestions(description: string) {
    const prompt = `Based on this description of an issue, provide 3 short, helpful suggestions for reporting it effectively:
    "${description}"
    
    Return a JSON array of strings.`;

    const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt,
            config: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) return [];

    try {
        const data = await response.json();
        return JSON.parse(data.text || "[]");
    } catch (e) {
        return [];
    }
}
