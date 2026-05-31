# 酶促反应动力学模拟实验

基于Canvas和Vite构建的交互式酶促反应动力学模拟网页实验。

## ✨ 功能特性

### 📊 动力学图谱
- **Michaelis-Menten 米氏曲线** - 标准底物浓度-反应速率曲线
- **Lineweaver-Burk 双倒数图** - 线性化处理
- **Hanes-Woolf 图** - 另一种线性化方法
- **Eadie-Hofstee 图** - 高精度线性化方法

### 🎨 可视化组件
- 实时底物消耗与产物积累曲线
- 粒子动画模拟酶-底物相互作用
- 可配置的坐标轴与图例
- 实时数据显示面板

### 🛡️ 后端功能
- 实验参数持久化存储
- 实验截图保存
- API请求速率限制（30次/分钟）
- 参数范围校验

## 🏗️ 项目架构

### 📁 目录结构
```
AI_solo_coder_task_294/
├── src/                      # 前端源码目录
│   ├── index.html            # 入口HTML
│   ├── main.js               # 主应用逻辑
│   ├── styles/
│   │   └── main.css          # 样式文件
│   └── lib/
│       ├── kineticsMath.js   # 酶动力学数学计算模块
│       ├── curvePlotter.js   # Canvas曲线绘制组件
│       └── particleAnimation.js # 粒子动画组件
├── public/                    # 静态资源
├── dist/                      # Vite构建输出
├── data/                      # 后端数据存储
│   ├── experiments.json      # 实验记录
│   └── screenshots/          # 实验截图
├── tests/                     # 测试文件
├── server.js                  # Express后端服务器
├── vite.config.js            # Vite配置
└── package.json
```

### 🧩 可复用模块

#### 1. EnzymeKineticsMath
独立的酶动力学数学计算模块，可在任何项目中使用。

```javascript
import EnzymeKineticsMath from './lib/kineticsMath.js';

const kinetics = new EnzymeKineticsMath({
  Km: 25,      // 米氏常数 (mM)
  kcat: 100,   // 催化常数 (s^-1)
  Et: 10       // 酶浓度 (μM)
});

// 计算反应速率
const rate = kinetics.getRate(S); // S为底物浓度

// 获取米氏曲线数据
const curve = kinetics.getRateCurve(0, 200, 100);

// 模拟时间进程
const timeData = kinetics.simulateReaction(initialS, totalTime, timeStep);
```

**API方法:**
- `getVmax()` - 计算最大反应速率
- `getRate(S)` - 计算指定底物浓度下的速率
- `getRateCurve(start, end, steps)` - 生成米氏曲线数据
- `simulateReaction(initialS, totalTime, timeStep)` - 完整时间模拟
- `getLineweaverBurk()` / `getHanesWoolf()` / `getEadieHofstee()` - 其他图谱
- `setParams(params)` - 动态更新参数

#### 2. CurvePlotter
通用的Canvas多数据集曲线绘制组件。

```javascript
import CurvePlotter from './lib/curvePlotter.js';

const plotter = new CurvePlotter('canvasId', {
  xAxis: { label: 'X轴', min: 0, max: 100 },
  yAxis: { label: 'Y轴', min: 0, max: 10 },
  showGrid: true,
  legendPosition: 'topLeft' // 'topLeft' | 'topRight'
});

// 添加数据集
plotter.addDataset(data, {
  color: '#00d4ff',
  label: '数据系列1',
  lineWidth: 2,
  showPoints: false,
  pointRadius: 3,
  dash: [] // 虚线样式: [5, 5]
});

plotter.render();
```

**API方法:**
- `addDataset(data, config)` - 添加数据集
- `clearDatasets()` - 清除所有数据集
- `removeDataset(index)` - 移除指定数据集
- `setConfig(config)` - 更新配置
- `render()` - 渲染图形
- `resize(width, height)` - 调整画布大小
- `animate(duration)` - 曲线动画效果

#### 3. ParticleAnimation
酶-底物-产物粒子动画系统。

```javascript
import ParticleAnimation from './lib/particleAnimation.js';

const particles = new ParticleAnimation('canvasId', {
  backgroundColor: '#0f0f23',
  glowIntensity: 15,
  enzymeCount: 10,
  substrateCount: 30
});

particles.init();
particles.start();

// 随机将底物转化为产物
setInterval(() => particles.convertToProduct(), 100);
```

**API方法:**
- `init()` - 初始化粒子
- `start()` / `stop()` - 控制动画
- `reset()` - 重置所有粒子
- `convertToProduct()` - 将随机底物转为产物
- `addParticles(type, count)` - 添加粒子
- `removeParticles(type, count)` - 移除粒子
- `getCounts()` - 获取各类型粒子数量

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 启动Vite开发服务器 (端口5173)
npm run dev

# 同时启动后端API服务器 (端口3000)
npm run server
```

### 生产构建
```bash
npm run build

# 预览构建结果
npm run preview

# 启动生产服务器
npm start
```

## 📡 API接口

### 保存实验参数
```http
POST /api/experiments
Content-Type: application/json

{
  "params": {
    "s": 50,
    "e": 10,
    "km": 25,
    "kcat": 100
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**响应:**
```json
{
  "success": true,
  "id": "1704067200000"
}
```

### 获取实验列表
```http
GET /api/experiments
```

### 保存实验截图
```http
POST /api/screenshot
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "id": "experiment-123"
}
```

**响应头:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704067260
```

## 🧪 测试

运行所有测试：
```bash
npm test
```

模块测试：
```bash
npm run test:modules
```

后端API测试：
```bash
npm run test:backend
```

## 🎯 参数说明

### 实验参数
| 参数 | 范围 | 默认值 | 单位 | 说明 |
|------|------|--------|------|------|
| 底物浓度 [S] | 1-200 | 50 | mM | 初始底物浓度 |
| 酶浓度 [E] | 1-50 | 10 | μM | 酶催化剂浓度 |
| 米氏常数 Km | 5-100 | 25 | mM | 酶与底物亲和力 |
| 催化常数 kcat | 10-500 | 100 | s⁻¹ | 酶转化效率 |

### 速率限制配置
- 窗口时间: 60秒
- 最大请求: 30次/IP
- 超出限制返回 429 状态码

## 🔧 技术栈

**前端:**
- Vite 5.0 - 构建工具
- 原生 JavaScript (ES Modules)
- Canvas 2D API

**后端:**
- Node.js + Express 4.x
- 内存速率限制 (无需数据库)
- CORS 跨域支持

## 📝 注意事项

1. **模块独立性:** 三个核心模块完全独立，可单独复用
2. **ES Modules:** 项目使用 ES Module 语法，Node.js 需 v14.13.0+
3. **速率限制:** API 接口有频率限制，请勿恶意调用
4. **数据存储:** 实验数据以 JSON 格式存储在 `data/` 目录

## 📄 许可证

MIT License
