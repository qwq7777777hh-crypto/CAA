import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
dotenv.config();

const app = express();

// ES Module 中获取 __dirname 的方法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 核心中间件
app.use(cors());
app.use(express.json());

// 记录所有请求日志，方便在 Zeabur 控制台排查 405 Method Not Allowed
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 1. API 路由：必须在静态资源托管 app.use(express.static) 之前定义
// 确保 POST 请求不会被静态服务器拦截
app.post('/api/chat', async (req, res) => {
  try {
    const { message, instruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('SERVER ERROR: DEEPSEEK_API_KEY is missing.');
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    // 调用 DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: instruction || "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 2048
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 45000 // 45秒超时
      }
    );

    const aiContent = response.data.choices[0].message.content;
    res.json({ text: aiContent });

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error('API Error:', JSON.stringify(errorMsg));
    res.status(500).json({ 
      error: 'Failed to communicate with AI provider',
      details: errorMsg 
    });
  }
});

// 2. 托管静态资源 (Vite 构建后的 dist 目录)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// 3. SPA 路由回退：所有未匹配的 GET 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 4. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`--- SERVER ACTIVE ---`);
  console.log(`Port: ${PORT}`);
  console.log(`Static Root: ${distPath}`);
});