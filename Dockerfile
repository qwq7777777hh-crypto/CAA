FROM node:22-alpine

WORKDIR /app

# 复制依赖定义
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制所有源代码
COPY . .

# 执行构建（这会生成 dist 文件夹）
RUN npm run build

# 暴露 3000 端口
EXPOSE 3000

# === 核心修改在这里 ===
# 不再运行 server.js，而是使用 npx serve 直接服务 dist 目录
# -s dist: 指定服务 dist 目录
# -l 3000: 强制监听 3000 端口
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
