-- ==============================================
-- 性能优化索引
-- 用于提升常见查询性能
-- ==============================================

-- 技能查询优化
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_owner ON skills(owner_id);
CREATE INDEX IF NOT EXISTS idx_skills_public ON skills(is_public);
CREATE INDEX IF NOT EXISTS idx_skills_category_public ON skills(category, is_public);
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);
CREATE INDEX IF NOT EXISTS idx_skills_created ON skills(created_at DESC);

-- 对话查询优化
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_skill ON conversations(skill_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

-- 消息查询优化
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- 统计查询优化
CREATE INDEX IF NOT EXISTS idx_usage_stats_user ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_skill ON usage_stats(skill_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_stats_created ON usage_stats(created_at DESC);

-- 收藏查询优化
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_skill ON favorites(skill_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_skill ON favorites(user_id, skill_id);

-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- ==============================================
-- 复合索引用于常见查询场景
-- ==============================================

-- 首页技能列表：按分类筛选公开技能
CREATE INDEX IF NOT EXISTS idx_skills_list 
ON skills(is_public, category, created_at DESC) 
WHERE is_public = true;

-- 用户技能列表：按用户ID和创建时间
CREATE INDEX IF NOT EXISTS idx_skills_user_list 
ON skills(owner_id, created_at DESC);

-- 对话历史：按用户和最近更新
CREATE INDEX IF NOT EXISTS idx_conversations_recent 
ON conversations(user_id, updated_at DESC);

-- ==============================================
-- 执行说明：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 粘贴并执行此脚本
-- 或使用 supabase CLI: supabase db push
-- ==============================================
