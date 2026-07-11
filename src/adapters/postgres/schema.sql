-- 用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- 查询模板表
CREATE TABLE IF NOT EXISTS query_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  intent TEXT NOT NULL,
  sql TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_templates_user_id ON query_templates(user_id);
CREATE INDEX idx_query_templates_intent ON query_templates USING gin(to_tsvector('simple', intent));

-- Schema 缓存表
CREATE TABLE IF NOT EXISTS schema_cache (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  db_id VARCHAR(255) NOT NULL,
  schema_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, db_id)
);

CREATE INDEX idx_schema_cache_user_db ON schema_cache(user_id, db_id);
CREATE INDEX idx_schema_cache_expires ON schema_cache(expires_at);

-- 自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
