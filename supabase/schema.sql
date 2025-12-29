-- Skills table
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  input_types TEXT[] NOT NULL,
  placeholder TEXT,
  source VARCHAR(20) CHECK (source IN ('official', 'custom', 'community')) NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  metadata JSONB,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL DEFAULT 'viewer',
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  skill_id UUID REFERENCES skills(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage statistics table
CREATE TABLE usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  skill_id UUID REFERENCES skills(id) NOT NULL,
  tokens_used INTEGER NOT NULL,
  response_time INTEGER, -- in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id),
  UNIQUE(user_id, message_id)
);

-- Create indexes for better performance
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_source ON skills(source);
CREATE INDEX idx_skills_owner_id ON skills(owner_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_skill_id ON conversations(skill_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_stats_skill_id ON usage_stats(skill_id);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Skills policies
CREATE POLICY "Public skills are viewable by everyone" ON skills
  FOR SELECT USING (is_public = true OR source = 'official');

CREATE POLICY "Users can view their own skills" ON skills
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own skills" ON skills
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own skills" ON skills
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own skills" ON skills
  FOR DELETE USING (auth.uid() = owner_id);

-- User profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Usage stats policies
CREATE POLICY "Users can view their own usage stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage stats" ON usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);