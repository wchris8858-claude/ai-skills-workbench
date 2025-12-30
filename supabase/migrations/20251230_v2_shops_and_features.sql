-- AI 掌柜 v2.0 数据库迁移
-- 添加店铺系统、知识库、培训系统等新功能

-- 1. 创建店铺表
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  industry VARCHAR(50) NOT NULL,
  address VARCHAR(255),
  description TEXT,
  target_customer TEXT,
  brand_style VARCHAR(50),
  slogan VARCHAR(255),
  contact_info JSONB,
  logo_url VARCHAR(500),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建店铺成员表
CREATE TABLE IF NOT EXISTS shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

-- 3. 更新对话表，添加 shop_id 和 feature 字段
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS feature VARCHAR(50);

-- 4. 更新消息表，添加 metadata 字段
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 5. 创建知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  tags TEXT[],
  version INT DEFAULT 1,
  parent_id UUID REFERENCES knowledge_documents(id),
  source_type VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建知识库向量表（用于 RAG）
-- 注意：需要先启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建素材库表
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  file_url VARCHAR(500),
  folder_id UUID,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 创建内容日历表
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 创建培训学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  module_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started',
  score INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 创建对练记录表
CREATE TABLE IF NOT EXISTS roleplay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  scenario VARCHAR(100) NOT NULL,
  messages JSONB NOT NULL,
  score INT,
  score_details JSONB,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 创建运营数据表
CREATE TABLE IF NOT EXISTS operation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, date)
);

-- 12. 更新使用量统计表
ALTER TABLE usage_stats
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS feature VARCHAR(50),
ADD COLUMN IF NOT EXISTS requests_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS date DATE;

-- 13. 创建订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 创建索引

-- 店铺相关索引
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_user ON shop_members(user_id);

-- 对话查询优化
CREATE INDEX IF NOT EXISTS idx_conversations_shop_user ON conversations(shop_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_feature ON conversations(feature);

-- 知识库检索优化
CREATE INDEX IF NOT EXISTS idx_knowledge_shop_category ON knowledge_documents(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_document ON knowledge_embeddings(document_id);

-- 向量相似度搜索索引（需要 pgvector）
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 内容日历查询优化
CREATE INDEX IF NOT EXISTS idx_calendar_shop_date ON content_calendar(shop_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON content_calendar(status);

-- 素材库索引
CREATE INDEX IF NOT EXISTS idx_materials_shop ON materials(shop_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);

-- 培训进度索引
CREATE INDEX IF NOT EXISTS idx_learning_user_shop ON learning_progress(user_id, shop_id);

-- 对练记录索引
CREATE INDEX IF NOT EXISTS idx_roleplay_user ON roleplay_sessions(user_id);

-- 运营数据索引
CREATE INDEX IF NOT EXISTS idx_operation_shop_date ON operation_data(shop_id, date);

-- 使用量统计优化
CREATE INDEX IF NOT EXISTS idx_usage_shop_date ON usage_stats(shop_id, date);

-- 15. 创建知识检索函数
CREATE OR REPLACE FUNCTION match_knowledge(
  p_shop_id UUID,
  p_query_embedding VECTOR(1024),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.document_id,
    kd.title,
    ke.chunk_text as content,
    1 - (ke.embedding <=> p_query_embedding) as similarity
  FROM knowledge_embeddings ke
  JOIN knowledge_documents kd ON ke.document_id = kd.id
  WHERE kd.shop_id = p_shop_id
    AND 1 - (ke.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY ke.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- 16. 添加 RLS 策略

-- 店铺表 RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shops" ON shops
  FOR SELECT USING (owner_id = auth.uid() OR id IN (
    SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create shops" ON shops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their shops" ON shops
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their shops" ON shops
  FOR DELETE USING (owner_id = auth.uid());

-- 店铺成员表 RLS
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view shop members" ON shop_members
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "Owners can manage shop members" ON shop_members
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 知识库文档 RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view knowledge" ON knowledge_documents
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
      UNION
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop admins can manage knowledge" ON knowledge_documents
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()) OR
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- 知识库向量表 RLS
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inherit from documents" ON knowledge_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM knowledge_documents WHERE shop_id IN (
        SELECT id FROM shops WHERE owner_id = auth.uid()
        UNION
        SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
      )
    )
  );

-- 素材库 RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view materials" ON materials
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
      UNION
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage materials" ON materials
  FOR ALL USING (
    user_id = auth.uid() OR
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 内容日历 RLS
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view calendar" ON content_calendar
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
      UNION
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage calendar" ON content_calendar
  FOR ALL USING (
    user_id = auth.uid() OR
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 学习进度 RLS
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON learning_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON learning_progress
  FOR ALL USING (user_id = auth.uid());

-- 对练记录 RLS
ALTER TABLE roleplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON roleplay_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create sessions" ON roleplay_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 运营数据 RLS
ALTER TABLE operation_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view data" ON operation_data
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
      UNION
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage data" ON operation_data
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()) OR
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- 订阅表 RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view subscriptions" ON subscriptions
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "Shop owners can manage subscriptions" ON subscriptions
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );
