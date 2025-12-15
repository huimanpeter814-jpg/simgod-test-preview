// �Ƴ��˶� @google/genai ������������ fetch ֱ�ӵ��� REST API
// ������ Web �����и��ȶ�������Ҫ Node.js polyfills

export const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string | null> => {
    // ʹ�� Vite �ķ�ʽ��ȡ��������
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

        // �������ؽ��
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }

        return null;
    } catch (error) {
        console.error("Gemini Network Error:", error);
        return null;
    }
};

/**
 * 批量生成市民日记
 * @param simsData 市民数据列表（包含 ID, 名字, 性格, 当天经历等）
 * @returns 解析后的字典对象 { [simId]: "日记内容" }
 */
export const batchGenerateDiaries = async (simsData: any[]): Promise<Record<string, string>> => {
    // 1. 构造系统提示词 (System Instruction)
    // 强制要求 JSON 格式，并设定角色
    const systemPrompt = `
    你是一个像素风模拟游戏《Simgod》的叙事助手。
    你的任务是根据提供的市民列表及其当天的经历（events），为每一位市民写一句简短的日记（第一人称）。
    
    要求：
    1. **简短**：每条日记不超过 30 个字。
    2. **风格**：综合市民的MBTI、星座、性取向、职业、岁数、人生目标等等来判断此人的说话风格。如果当天有重要事件（如升职、恋爱、分手），必须在日记中体现。如果没有特殊事件，就写一句符合心情的日常感叹，语气自然生动符合风格，比较口语化。
    3. **格式**：**必须且只能**返回一个合法的 JSON 对象。Key 是市民的 ID，Value 是日记字符串。
    4. **严禁**：不要输出 markdown 代码块标记（如 \`\`\`json），直接输出纯 JSON 字符串。
    `;

    // 2. 构造用户输入
    // 为了节省 Token，只发送必要字段
    const userPrompt = JSON.stringify(simsData);

    // 3. 调用 API
    // 复用已有的 callGemini 逻辑，或者直接在这里构建请求（为了复用 key 和 fetch 逻辑，建议复用 callGemini，但 callGemini 需要支持 JSON 模式会更好，这里我们简单处理文本解析）
    const responseText = await callGemini(userPrompt, systemPrompt);

    if (!responseText) return {};

    // 4. 解析结果
    try {
        // 清洗可能存在的 Markdown 标记
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("AI 日记解析失败:", e, responseText);
        return {};
    }
};