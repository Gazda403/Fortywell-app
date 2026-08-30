-- Create saved_sessions table for storing completed workout sessions
CREATE TABLE IF NOT EXISTS saved_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_slug TEXT NOT NULL,
  workout_title TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL,
  completed_sets INTEGER NOT NULL,
  total_sets INTEGER NOT NULL,
  total_volume_kg DECIMAL(10, 2) NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  mood INTEGER,
  energy INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries by user
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON saved_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_completed_at ON saved_sessions(completed_at DESC);

-- Enable RLS
ALTER TABLE saved_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved sessions
CREATE POLICY "Users can view own saved sessions" ON saved_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved sessions" ON saved_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved sessions" ON saved_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved sessions" ON saved_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);