FROM node:22-alpine

WORKDIR /app

# 1. 安装依赖
COPY package*.json ./
RUN npm install

# 2. 复制源码
COPY . .

# 3. 构建前端 (这一步非常重要，它会生成 dist 文件夹)
RUN npm run build

# 4. 暴露端口
EXPOSE 3000

# 5. 启动您的后端服务
CMD ["node", "server.js"]
