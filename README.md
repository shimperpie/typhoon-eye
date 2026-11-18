# Typhoon Eye · 台风眼

一个交互式台风路径可视化工具。地图显示历史路径、风圈和预报点，浏览器允许定位时可以计算台风中心与你的距离。拒绝定位时使用上海作为参考位置。

天气数据来自中央气象台。上游不可用时，界面标注「演示数据」。距离和预报不确定范围用于理解可视化，实际天气和应急决策以官方预警为准。应用没有访问统计功能。底图、卫星图层与字体由各自的外部服务提供。

## 在 Mac 上运行

需要 Node.js 22.12 或更新的 LTS 版本及 Python 3。解压源代码后，在 Finder 打开项目文件夹。打开「终端」，输入 cd 和一个空格，把项目文件夹拖进终端，再按回车。依次运行以下命令。

~~~bash
npm ci
npm run build
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/app.py
~~~

浏览器访问 http://127.0.0.1:5001。按 Control+C 停止。开发时可以在另一窗口运行 npm run dev，Vite 会把天气请求转给同一台机器的后端。

