-- Supabase에서 실행할 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- quotes 테이블 생성
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_name text not null,
  product_category text not null,
  total_cost bigint not null,
  survey_data jsonb not null,
  estimate_data jsonb not null,
  ai_analysis_data jsonb
);

-- RLS (Row Level Security) 활성화
alter table quotes enable row level security;

-- 모든 사용자가 읽기 가능 (공유 링크용)
create policy "Anyone can view quotes"
  on quotes for select
  using (true);

-- 모든 사용자가 생성 가능 (익명 사용자도 견적 저장 가능)
create policy "Anyone can create quotes"
  on quotes for insert
  with check (true);

-- 인덱스 생성 (검색 성능 향상)
create index if not exists quotes_created_at_idx on quotes(created_at desc);
create index if not exists quotes_company_name_idx on quotes(company_name);
