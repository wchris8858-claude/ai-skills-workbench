-- ============================================
-- 修复 conversations 表 skill_id 类型问题
-- 问题：原来 skill_id 是 UUID 类型并有外键约束
--      但预设技能使用字符串 ID（如 'moments-copywriter'）
--      导致创建对话失败，历史记录无法保存
-- ============================================

-- 1. 删除外键约束（如果存在）
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_skill_id_fkey;

-- 2. 修改 skill_id 列类型为 TEXT
-- 注意：需要先删除依赖此列的索引，修改后重建
DROP INDEX IF EXISTS idx_conversations_skill;
DROP INDEX IF EXISTS idx_conversations_skill_id;
DROP INDEX IF EXISTS idx_conversations_user_skill;

-- 修改列类型
ALTER TABLE conversations
ALTER COLUMN skill_id TYPE TEXT;

-- 3. 重建索引
CREATE INDEX IF NOT EXISTS idx_conversations_skill_id ON conversations(skill_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_skill ON conversations(user_id, skill_id);

-- 4. 同样修复 usage_stats 表（如果有相同问题）
ALTER TABLE usage_stats
DROP CONSTRAINT IF EXISTS usage_stats_skill_id_fkey;

DROP INDEX IF EXISTS idx_usage_stats_skill;
DROP INDEX IF EXISTS idx_usage_stats_skill_id;

ALTER TABLE usage_stats
ALTER COLUMN skill_id TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_usage_stats_skill_id ON usage_stats(skill_id);

-- 5. 同样修复 favorites 表（如果有相同问题）
ALTER TABLE favorites
DROP CONSTRAINT IF EXISTS favorites_skill_id_fkey;

-- favorites 表可能没有 skill_id，检查后执行
-- ALTER TABLE favorites ALTER COLUMN skill_id TYPE TEXT;

-- 6. 添加注释说明
COMMENT ON COLUMN conversations.skill_id IS '技能ID，支持预设技能字符串ID和自定义技能UUID';
COMMENT ON COLUMN usage_stats.skill_id IS '技能ID，支持预设技能字符串ID和自定义技能UUID';

-- ============================================
-- 验证修复
-- ============================================
-- 执行后，可以用以下语句测试：
-- INSERT INTO conversations (user_id, skill_id) VALUES ('your-user-id', 'moments-copywriter');
-- 如果成功，说明修复生效
