// �Ƴ��˶� @google/genai ������������ fetch ֱ�ӵ��� REST API
// ������ Web �����и��ȶ�������Ҫ Node.js polyfills


// services/geminiService.ts

export const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_API_KEY;
    
    // ⚠️ 检查 Key 是否为空
    if (!apiKey) {
        console.error("❌ 致命错误: .env.local 中未找到 API Key");
        return null;
    }

    // 尝试使用 gemini-1.5-flash (这是目前最推荐的)
    const model = "gemini-2.5-flash"; 
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const url = `${baseUrl}?key=${apiKey}`;

    // 🔍 调试日志：请在浏览器控制台(F12)查看这条打印
    console.log("🚀 正在请求 Gemini API:", baseUrl); 
    // 注意：不要在生产环境打印含 Key 的完整 URL，但在调试时可以检查 Key 是否有多余空格

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        ...(systemInstruction && {
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            }
        })
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API 请求失败 [${response.status}]:`, errorText);
            
            if (response.status === 404) {
                console.error("👉 原因: API未启用 或 模型名称错误。请务必新建一个 Project 并重新生成 Key。");
            }
            return null;
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch (error) {
        console.error("❌ 网络错误 (请检查代理/VPN):", error);
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