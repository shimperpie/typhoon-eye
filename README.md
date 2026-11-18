# Typhoon Eye · 台风眼

[English](#english) · [简体中文](#简体中文)

## English

Typhoon Eye is an interactive map for exploring typhoon tracks. It shows observed and forecast positions, wind zones, and the distance from the typhoon center to your location when you grant browser location access. Shanghai is used as the reference location when browser location is unavailable.

Weather data comes from China’s National Meteorological Center. If the feed is unavailable, the app displays clearly labeled demo data. Distance estimates and forecast uncertainty help explain the map. For weather and emergency decisions, follow official warnings.

The app does not collect visitor analytics. Map tiles, the satellite layer, and fonts are loaded from their respective external providers.

### Run on macOS

You’ll need Node.js 22.12 or later and Python 3. Open Terminal, type `cd ` with a trailing space, drag the project folder from Finder into Terminal, then press Return. Run these commands in order.

~~~bash
npm ci
npm run build
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/app.py
~~~

Open [http://127.0.0.1:5001](http://127.0.0.1:5001). Press **Control+C** in Terminal to stop the server. For front-end development, keep the backend running and run `npm run dev` in a second Terminal window opened in the project folder. Vite forwards weather requests to the local backend.

## 简体中文

台风眼是一款交互式台风路径可视化工具。地图显示实况和预报路径、风圈。允许浏览器定位后，可以查看台风中心与你的距离。浏览器定位不可用时，以上海为参考位置。

天气数据来自中央气象台。上游服务不可用时，界面会明确标注「演示数据」。距离估算与预报不确定范围用于辅助读图，实际天气和应急决策请以官方预警为准。

应用没有访问统计功能。底图、卫星图层和字体由各自的外部服务提供。

### 在 macOS 上运行

需要 Node.js 22.12 或更新版本，以及 Python 3。打开「终端」，输入 `cd ` 并保留末尾空格，将 Finder 中的项目文件夹拖到终端，再按回车。依次运行以下命令。

~~~bash
npm ci
npm run build
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/app.py
~~~

在浏览器打开 [http://127.0.0.1:5001](http://127.0.0.1:5001)。在终端按 **Control+C** 停止服务。开发前端时，保持后端运行，在另一个终端窗口进入项目文件夹并运行 `npm run dev`，Vite 会把天气请求转给本机后端。
