-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Companies / research subjects
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    ticker TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw document storage (SEC filings, news, scraped pages)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,          -- 'sec_edgar', 'gdelt', 'web_scout'
    source_id TEXT,                -- external identifier (e.g., SEC accession number)
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks for RAG (pgvector embeddings)
CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),        -- adjust dimension to match your embedding model
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index (IVFFlat)
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Research run metadata (one per user request)
CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',   -- pending, running, awaiting_approval, completed, failed
    state JSONB,                               -- full LangGraph state snapshot
    result_report TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT
);

-- Store generated reports (optional, can also be in runs)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    citations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human approval audit log
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,        -- 'approved', 'changes_requested'
    comment TEXT,
    reviewer TEXT,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);