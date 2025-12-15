import { WorldPlot } from '../types';

const ROAD_W = 100;

// 定义道路 (Global Infrastructure)
// 道路通常比较特殊，可以作为全局对象存在，或者也做成地皮
// 这里为了简单，我们把道路定义为一组特殊的“静态房间”，在初始化时合并进去
export const ROADS = [
    { id: 'road_h_top', x: 0, y: 380, w: 3000, h: ROAD_W, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    { id: 'road_h_bot', x: 0, y: 1150, w: 3000, h: ROAD_W, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    { id: 'road_v_left', x: 500, y: 0, w: ROAD_W, h: 1800, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    { id: 'road_v_right', x: 1600, y: 0, w: ROAD_W, h: 1800, label: '', color: '#3d404b', pixelPattern: 'stripes' },
    // 斑马线
    { id: 'zebra_1', x: 500, y: 380, w: 84, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' },
    { id: 'zebra_2', x: 1200, y: 1160, w: 84, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' }
];

// 定义路边的装饰物 (Global Furniture)
export const STREET_PROPS = [
    { id: 'vending_h1', x: 400, y: 460, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 450, y: 460, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'hydrant_1', x: 590, y: 340, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 590, y: 300, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
];

export const WORLD_LAYOUT: WorldPlot[] = [
    { id: 'plot_cbd', templateId: 'cbd', x: 20, y: 20 },
    { id: 'plot_dorm', templateId: 'dorm', x: 1480, y: 20 },
    { id: 'plot_res', templateId: 'residential', x: 20, y: 480 },
    { id: 'plot_park', templateId: 'park', x: 600, y: 480 },
    { id: 'plot_comm', templateId: 'commercial', x: 580, y: 1250 },
    { id: 'plot_serv', templateId: 'service', x: 1680, y: 480 },
    { id: 'plot_night', templateId: 'nightlife', x: 1680, y: 1250 },
    { id: 'plot_fareast', templateId: 'fareast', x: 2450, y: 50 },
];