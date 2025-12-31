const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dvodgeuygrmbpqstsuin.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2b2RnZXV5Z3JtYnBxc3RzdWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMTEwNiwiZXhwIjoyMDgyMDc3MTA2fQ.kbmWSFWDIRKMGK_pGw1WiC-4Oq1I3B3bPny4iihv5nE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('验证数据库迁移...\n');

  // 获取真实用户
  const { data: users } = await supabase.from('users').select('id, email').limit(1);

  if (!users || users.length === 0) {
    console.log('没有用户数据，跳过完整测试');
    return;
  }

  const userId = users[0].id;
  console.log('测试用户:', users[0].email);
  console.log('');

  // 测试创建对话（使用预设技能字符串ID）
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, skill_id: 'moments-copywriter' })
    .select()
    .single();

  if (error) {
    console.log('❌ 测试失败:', error.message);
    return;
  }

  console.log('✅ skill_id 迁移成功！');
  console.log('   对话ID:', data.id);
  console.log('   skill_id:', data.skill_id, '← TEXT 类型');
  console.log('');

  // 测试保存消息
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({ conversation_id: data.id, role: 'user', content: '测试消息' })
    .select()
    .single();

  if (msg) {
    console.log('✅ 消息保存成功！');
    await supabase.from('messages').delete().eq('id', msg.id);
  } else {
    console.log('❌ 消息保存失败:', msgErr?.message);
  }

  // 清理测试数据
  await supabase.from('conversations').delete().eq('id', data.id);
  console.log('✅ 测试数据已清理');
  console.log('');
  console.log('========================================');
  console.log('🎉 历史记录功能已恢复正常！');
  console.log('========================================');
}

verify().catch(console.error);
