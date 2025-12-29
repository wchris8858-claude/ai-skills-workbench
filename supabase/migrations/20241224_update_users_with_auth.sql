-- ==============================================
-- 更新用户表 - 添加用户名密码认证
-- ==============================================

-- 添加用户名字段（唯一）
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- 添加密码哈希字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 添加账户状态字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 添加最后登录时间
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 创建用户名索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 更新现有用户：将 email 作为默认用户名（取 @ 前面部分）
UPDATE users
SET username = split_part(email, '@', 1)
WHERE username IS NULL;

-- ==============================================
-- 创建默认管理员账户
-- 用户名: admin
-- 密码: admin123 (bcrypt hash)
-- ==============================================

INSERT INTO users (email, username, password_hash, name, role, is_active)
VALUES (
  'admin@system.local',
  'admin',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  '系统管理员',
  'admin',
  true
)
ON CONFLICT (username) DO NOTHING;

-- ==============================================
-- 执行说明：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 粘贴并执行此脚本
-- 4. 默认管理员: admin / admin123
-- ==============================================
