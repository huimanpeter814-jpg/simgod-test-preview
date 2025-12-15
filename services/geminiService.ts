// �Ƴ��˶� @google/genai ������������ fetch ֱ�ӵ��� REST API
// ������ Web �����и��ȶ�������Ҫ Node.js polyfills

export const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string | null> => {
    // ʹ�� Vite �ķ�ʽ��ȡ��������
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
        console.warn("Gemini API Key not found. Please set VITE_API_KEY in .env");
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
 * @param globalContext 全局背景 (比如节日、季节)
 * @returns 解析后的字典对象 { [simId]: "日记内容" }
 */
export const batchGenerateDiaries = async (simsData: any[], globalContext: string = ""): Promise<Record<string, string>> => {
    // 1. 构造系统提示词 (System Instruction)
    // 强制要求 JSON 格式，并设定角色
    const systemPrompt = `
    你是一个像素风模拟游戏《SimGod》的叙事助手。
    你的任务是根据市民的档案，用【第一人称】写一句像“微博/推特”一样的短日记。

    请参考以下数据来丰富内容：
    - **Events (经历)**: 如果有具体事件，必须在日记中提及。
    - **Buffs (状态)**: 这是最重要的心情指标！(例如: "社畜过劳"要写得累，"恋爱脑"要写得甜)。
    - **LifeGoal (目标)**: 如果今天没事发生，可以感慨一下梦想。
    - **MBTI (性格)**: F人更感性，T人更逻辑，E人更外向，I人更内敛。
    - **Global Context**: ${globalContext} (如果是节日，请尽量关联)。

    要求：
    1. **拒绝流水账**：不要写“我今天去工作了”，要写更为生动的语气。
    2. **口语化**：可以使用 1-2 个 Emoji，语气要像真人发朋友圈。
    3. **字数**：控制在 40 字以内，短小精悍。
    4. **格式**：**必须**返回纯 JSON 对象 { [id]: "日记内容" }，不要 Markdown。
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