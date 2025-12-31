
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// 托管 dist 文件夹中的静态文件 (Vite 构建产物)
app.use(express.static(path.join(__dirname, 'dist')));

// POST 接口：处理聊天请求并转发给 DeepSeek
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DeepSeek API Key is missing on server.');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 构建 DeepSeek 请求
    // 注意：DeepSeek 是 OpenAI 兼容的，建议使用 json_object 模式以确保返回 JSON
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat", // 或者 deepseek-coder
        messages: [
          { role: "system", content: systemInstruction || "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }, // 强制让 DeepSeek 返回 JSON
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
    console.error('Error calling DeepSeek API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to communicate with AI provider',
      details: error.response?.data || error.message 
    });
  }
});

// 所有其他 GET 请求返回 index.html (支持 React 路由)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
