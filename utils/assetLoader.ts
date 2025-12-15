// 这是一个新的工具文件，用于管理图片资源的加载和缓存
// 防止在每一帧渲染时重复创建 Image 对象

const imageCache: Record<string, HTMLImageElement> = {};

// 修复：由于 constants.ts 中生成的路径已经包含了 /assets/ 前缀（例如 /assets/face/face01.png）
// 这里不需要再设置 BASE_PATH，否则会导致路径重复 (如 /assets//assets/...)
const BASE_PATH = '';

export const loadImages = (sources: string[]) => {
    sources.forEach(src => {
        if (!imageCache[src]) {
            const img = new Image();
            // 直接使用传入的完整路径
            img.src = `${BASE_PATH}${src}`;

            img.onload = () => {
                console.log(`[AssetLoader] Loaded: ${src}`);
            };
            img.onerror = (e) => {
                console.warn(`[AssetLoader] Failed to load: ${src}`, e);
            };
            imageCache[src] = img;
        }
    });
};

export const getAsset = (path: string | undefined): HTMLImageElement | null => {
    if (!path) return null;
    const img = imageCache[path];
    return (img && img.complete && img.naturalWidth > 0) ? img : null;
};