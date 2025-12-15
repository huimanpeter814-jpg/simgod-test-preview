import React, { useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import TopUI from './components/TopUI';
import Sidebar from './components/Sidebar/Sidebar';
import { initGame } from './utils/simulation';
import { loadImages } from './utils/assetLoader';
import { ASSET_CONFIG } from './constants';

const App: React.FC = () => {
    useEffect(() => {
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