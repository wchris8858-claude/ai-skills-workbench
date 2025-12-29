-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 添加注释
COMMENT ON TABLE system_settings IS '系统配置表,存储模型配置等系统级设置';
COMMENT ON COLUMN system_settings.key IS '配置键名';
COMMENT ON COLUMN system_settings.value IS '配置值(JSON格式)';

-- 插入默认的模型配置
INSERT INTO system_settings (key, value)
VALUES (
  'model_configs',
  '{
    "moments-copywriter": {
      "text": {
        "provider": "anthropic",
        "model": "claude-opus-4-5-20251101",
        "type": "text",
        "temperature": 0.8,
        "maxTokens": 4096,
        "description": "Claude Opus 4.5 - 最强推理和创作能力"
      }
    },
    "video-rewriter": {
      "text": {
        "provider": "anthropic",
        "model": "claude-opus-4-5-20251101",
        "type": "text",
        "temperature": 0.5,
        "maxTokens": 4096,
        "description": "Claude Opus 4.5 - 最强推理和创作能力"
      }
    },
    "viral-analyzer": {
      "text": {
        "provider": "anthropic",
        "model": "claude-opus-4-5-20251101",
        "type": "text",
        "temperature": 0.3,
        "maxTokens": 4096,
        "description": "Claude Opus 4.5 - 最强推理和创作能力"
      }
    },
    "meeting-transcriber": {
      "text": {
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001",
        "type": "text",
        "temperature": 0.2,
        "maxTokens": 4096,
        "description": "Claude Haiku 4.5 - 快速响应，性价比高"
      }
    },
    "knowledge-query": {
      "text": {
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001",
        "type": "text",
        "temperature": 0.1,
        "maxTokens": 4096,
        "description": "Claude Haiku 4.5 - 快速响应，性价比高"
      }
    },
    "official-notice": {
      "text": {
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001",
        "type": "text",
        "temperature": 0.2,
        "maxTokens": 4096,
        "description": "Claude Haiku 4.5 - 快速响应，性价比高"
      }
    },
    "poster-creator": {
      "text": {
        "provider": "google",
        "model": "gemini-pro-vision",
        "type": "text",
        "temperature": 0.6,
        "maxTokens": 4096,
        "description": "Gemini Pro Vision - 支持视觉理解"
      },
      "image": {
        "provider": "image",
        "model": "gpt-image-1.5",
        "type": "image",
        "description": "GPT Image 1.5 - AI 图像生成"
      }
    },
    "photo-selector": {
      "text": {
        "provider": "google",
        "model": "gemini-pro-vision",
        "type": "text",
        "temperature": 0.3,
        "maxTokens": 4096,
        "description": "Gemini Pro Vision - 支持视觉理解"
      },
      "image": {
        "provider": "image",
        "model": "nano-banana-pro",
        "type": "image",
        "description": "Nano Banana Pro - 创意图像生成"
      }
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 启用 RLS (Row Level Security)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略:只有管理员可以读写
CREATE POLICY "Allow admin to read system_settings" ON system_settings
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow admin to insert system_settings" ON system_settings
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow admin to update system_settings" ON system_settings
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow admin to delete system_settings" ON system_settings
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');
