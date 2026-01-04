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

// ==========================================
// 1. 【核心修改】API 路由必须放在最前面
// ==========================================
// 只有放在静态资源托管之前，才能确保 POST 请求被正确处理，而不会报 405
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

// ==========================================
// 2. 静态资源托管 (放在 API 之后)
// ==========================================
// 只有当请求不是 /api/chat 时，才会去 dist 文件夹找文件
app.use(express.static(path.join(__dirname, 'dist')));

// ==========================================
// 3. 所有其他 GET 请求返回 index.html (SPA 支持)
// ==========================================
// 必须放在最后，处理前端路由刷新不丢失的问题
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ==========================================
// 4. 启动服务器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);
});
