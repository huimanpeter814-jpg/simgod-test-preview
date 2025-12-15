// 移除了对 @google/genai 的依赖，改用 fetch 直接调用 REST API
// 这样在 Web 环境中更稳定，不需要 Node.js polyfills

export const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string | null> => {
    // 使用 Vite 的方式获取环境变量
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
        console.warn("Gemini API Key not found. Please set VITE_API_KEY in .env");
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        systemInstruction: systemInstruction ? {
            parts: [{ text: systemInstruction }]
        } : undefined
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            return null;
        }

        const data = await response.json();

        // 解析返回结果
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }

        return null;
    } catch (error) {
        console.error("Gemini Network Error:", error);
        return null;
    }
};