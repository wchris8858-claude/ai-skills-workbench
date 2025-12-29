-- ===========================================
-- 性能优化索引迁移
-- 创建时间: 2024-12-23
-- 说明: 添加常用查询的索引以提升性能
-- ===========================================

-- -------------------------------------------
-- 技能表索引 (skills)
-- -------------------------------------------

-- 按分类查询公开技能
CREATE INDEX IF NOT EXISTS idx_skills_category
ON skills(category);

-- 按所有者查询
CREATE INDEX IF NOT EXISTS idx_skills_owner
ON skills(owner_id);

-- 查询公开技能
CREATE INDEX IF NOT EXISTS idx_skills_public
ON skills(is_public);

-- 复合索引：按分类查询公开技能
CREATE INDEX IF NOT EXISTS idx_skills_category_public
ON skills(category, is_public);

-- 按来源查询
CREATE INDEX IF NOT EXISTS idx_skills_source
ON skills(source);

-- -------------------------------------------
-- 对话表索引 (conversations)
-- -------------------------------------------

-- 按用户查询对话
CREATE INDEX IF NOT EXISTS idx_conversations_user
ON conversations(user_id);

-- 按技能查询对话
CREATE INDEX IF NOT EXISTS idx_conversations_skill
ON conversations(skill_id);

-- 复合索引：用户最近的对话
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- 复合索引：用户在特定技能的对话
CREATE INDEX IF NOT EXISTS idx_conversations_user_skill
ON conversations(user_id, skill_id);

-- -------------------------------------------
-- 消息表索引 (messages)
-- -------------------------------------------

-- 按对话查询消息
CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id);

-- 按时间排序的消息
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
ON messages(conversation_id, timestamp DESC);

-- -------------------------------------------
-- 使用统计表索引 (usage_stats)
-- -------------------------------------------

-- 按用户统计
CREATE INDEX IF NOT EXISTS idx_usage_stats_user
ON usage_stats(user_id);

-- 按技能统计
CREATE INDEX IF NOT EXISTS idx_usage_stats_skill
ON usage_stats(skill_id);

-- 按日期范围查询
CREATE INDEX IF NOT EXISTS idx_usage_stats_created
ON usage_stats(created_at);

-- 复合索引：用户在时间范围内的使用
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date
ON usage_stats(user_id, created_at);

-- -------------------------------------------
-- 收藏表索引 (favorites)
-- -------------------------------------------

-- 按用户查询收藏
CREATE INDEX IF NOT EXISTS idx_favorites_user
ON favorites(user_id);

-- 按技能查询收藏数
CREATE INDEX IF NOT EXISTS idx_favorites_skill
ON favorites(skill_id);

-- 复合索引：用户的技能收藏（唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_skill
ON favorites(user_id, skill_id);

-- -------------------------------------------
-- 用户资料表索引 (profiles)
-- -------------------------------------------

-- 按角色查询用户
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- -------------------------------------------
-- 说明
-- -------------------------------------------
-- 执行方式：
-- 1. 通过 Supabase CLI: supabase db push
-- 2. 手动在 Supabase Dashboard SQL 编辑器中执行
--
-- 注意事项：
-- - 所有索引使用 IF NOT EXISTS 避免重复创建错误
-- - 大表添加索引可能需要一些时间
-- - 建议在低峰期执行
