import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件
app.use(cors());
app.use(express.json());

// ==========================================
// 1. 【重点】API 路由必须放在最前面
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('SERVER ERROR: API Key missing');
      return res.status(500).json({ error: 'Server config error' });
    }

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
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    const aiContent = response.data.choices[0].message.content;
    res.json({ text: aiContent });

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'AI provider error', details: error.message });
  }
});

// ==========================================
// 2. 静态资源托管 (必须在 API 之后)
// ==========================================
app.use(express.static(path.join(__dirname, 'dist')));

// ==========================================
// 3. SPA 前端路由支持 (最后)
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
