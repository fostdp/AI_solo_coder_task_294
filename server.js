import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const rateLimit = new Map();

function rateLimitMiddleware(windowMs = 60000, maxRequests = 30) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const data = rateLimit.get(ip);
      if (now > data.resetTime) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      } else {
        data.count++;
        if (data.count > maxRequests) {
          const remainingTime = Math.ceil((data.resetTime - now) / 1000);
          return res.status(429).json({
            success: false,
            error: `请求过于频繁，请在 ${remainingTime} 秒后再试`
          });
        }
      }
    }
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - rateLimit.get(ip).count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.get(ip).resetTime / 1000));
    
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  rateLimit.forEach((data, ip) => {
    if (now > data.resetTime) {
      rateLimit.delete(ip);
    }
  });
}, 60000);

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api', rateLimitMiddleware(60000, 30));
app.use(express.static('dist'));
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');
const PARAMS_FILE = path.join(DATA_DIR, 'experiments.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(PARAMS_FILE)) {
  fs.writeFileSync(PARAMS_FILE, JSON.stringify([]));
}

function validateParams(params) {
  if (typeof params !== 'object' || params === null) {
    return { valid: false, error: '参数必须是对象' };
  }
  
  const { s, e, km, kcat } = params;
  const errors = [];
  
  if (s !== undefined) {
    if (typeof s !== 'number' || isNaN(s) || s < 0 || s > 10000) {
      errors.push('底物浓度s必须是0-10000之间的数字');
    }
  }
  if (e !== undefined) {
    if (typeof e !== 'number' || isNaN(e) || e < 0 || e > 1000000) {
      errors.push('酶浓度e必须是0-1000000之间的数字');
    }
  }
  if (km !== undefined) {
    if (typeof km !== 'number' || isNaN(km) || km < 0 || km > 1000000) {
      errors.push('米氏常数km必须是0-1000000之间的数字');
    }
  }
  if (kcat !== undefined) {
    if (typeof kcat !== 'number' || isNaN(kcat) || kcat < 0 || kcat > 10000000) {
      errors.push('催化常数kcat必须是0-10000000之间的数字');
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, error: errors.join(', ') };
  }
  return { valid: true };
}

app.get('/api/experiments', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(PARAMS_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/experiments', (req, res) => {
  try {
    const { params, timestamp } = req.body;
    
    const validation = validateParams(params);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    const experiments = JSON.parse(fs.readFileSync(PARAMS_FILE, 'utf8'));
    const newExperiment = {
      id: Date.now().toString(),
      params,
      timestamp: timestamp || new Date().toISOString()
    };
    experiments.push(newExperiment);
    fs.writeFileSync(PARAMS_FILE, JSON.stringify(experiments, null, 2));
    res.json({ success: true, id: newExperiment.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/screenshot', (req, res) => {
  try {
    const { image, id } = req.body;
    
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: '图片数据无效' });
    }
    
    if (!image.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ success: false, error: '仅支持PNG格式图片' });
    }
    
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    
    if (base64Data.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: '图片大小不能超过10MB' });
    }
    
    const filename = `screenshot_${id || Date.now()}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filepath, base64Data, 'base64');
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
