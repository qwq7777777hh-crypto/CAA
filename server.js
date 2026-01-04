
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

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// 1. 优先托管静态资源 (Vite 构建产物)
// 确保路径使用 path.join 以防止操作系统差异导致的错误
app.use(express.static(path.join(__dirname, 'dist')));

// API 路由：处理 AI 聊天请求
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('SERVER ERROR: DeepSeek API Key is missing.');
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    // 调用 DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction || "You are a helpful assistant." },
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
        }
      }
    );

    const aiContent = response.data.choices[0].message.content;
    res.json({ text: aiContent });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to communicate with AI provider',
      details: error.response?.data || error.message 
    });
  }
});

// 2. 所有其他 GET 请求返回 index.html (SPA 前端路由支持)
// 必须放在 API 路由之后
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 3. 启动服务器
// 关键：必须使用 process.env.PORT，否则 Zeabur 无法绑定端口会导致崩溃
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);
});
