FROM node:22-alpine

WORKDIR /app

# 1. 复制依赖清单
COPY package*.json ./

# 2. 安装所有依赖 (包括 express 等后端库)
RUN npm install

# 3. 复制所有源码
COPY . .

# 4. 执行构建 (生成 dist 文件夹)
RUN npm run build

# 5. 暴露端口
EXPOSE 3000

# 6. === 核心修正 ===
# 必须运行 node server.js 来启动您的后端，而不是 npx serve
CMD ["node", "server.js"]
