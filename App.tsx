import React, { useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import TopUI from './components/TopUI';
import Sidebar from './components/Sidebar/Sidebar';
import { initGame } from './utils/simulation';
import { loadImages } from './utils/assetLoader';
import { ASSET_CONFIG } from './constants';

const App: React.FC = () => {
    // [修复] 使用 ref 追踪初始化状态，防止 React.StrictMode 导致的双重执行
    const initialized = useRef(false);

    useEffect(() => {
        // 如果已经初始化过，直接返回
        if (initialized.current) return;
        initialized.current = true;

        // [新功能] 预加载所有资源
        const allAssets = [
            ...ASSET_CONFIG.face,
            ...ASSET_CONFIG.hair,
            ...ASSET_CONFIG.clothes,
            ...ASSET_CONFIG.pants
        ];
        loadImages(allAssets);

        initGame();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-bg font-inter text-textMain">
            <div className="flex-1 flex flex-col items-center justify-center relative bg-black overflow-hidden">
                <GameCanvas />
                <TopUI />
            </div>
            <Sidebar />
        </div>
    );
};

export default App;