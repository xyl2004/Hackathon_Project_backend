-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建请求状态枚举类型
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 创建队伍表
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  captain_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 添加索引
  CONSTRAINT idx_captain_address UNIQUE (captain_address)
);

-- 创建成员表
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  role INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id),
  
  -- 添加索引
  CONSTRAINT idx_member_address UNIQUE (address)
);
CREATE INDEX idx_members_team_id ON members(team_id);

-- 创建入队申请表
CREATE TABLE team_join_requests (
  id SERIAL PRIMARY KEY,
  applicant TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role INTEGER NOT NULL,
  status request_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id)
);
CREATE INDEX idx_join_requests_applicant ON team_join_requests(applicant);
CREATE INDEX idx_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX idx_join_requests_status ON team_join_requests(status);

-- 为updated_at字段创建触发器
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_join_requests_timestamp
BEFORE UPDATE ON team_join_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 设置RLS (Row Level Security)策略
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略
CREATE POLICY "允许公共读取teams" ON teams FOR SELECT USING (true);
CREATE POLICY "允许公共读取members" ON members FOR SELECT USING (true);
CREATE POLICY "允许公共读取team_join_requests" ON team_join_requests FOR SELECT USING (true);

-- 创建队长修改权限策略
CREATE POLICY "允许队长修改自己的队伍" ON teams 
FOR ALL USING (auth.uid()::text = captain_address);

-- 创建队员修改权限策略
CREATE POLICY "允许成员修改自己的信息" ON members 
FOR ALL USING (auth.uid()::text = address);

-- 创建申请修改权限策略
CREATE POLICY "允许用户创建申请" ON team_join_requests 
FOR INSERT WITH CHECK (auth.uid()::text = applicant);

CREATE POLICY "允许队长处理申请" ON team_join_requests 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_join_requests.team_id 
    AND teams.captain_address = auth.uid()::text
  )
); 