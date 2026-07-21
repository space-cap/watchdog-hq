-- ============================================================
-- watchdog-hq PostgreSQL Schema Initialization Script
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    plan_tier VARCHAR(50) DEFAULT 'Free' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Health Targets Table
CREATE TABLE IF NOT EXISTS health_targets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    interval_seconds INTEGER DEFAULT 60 NOT NULL,
    timeout_seconds INTEGER DEFAULT 5 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_targets_user_id ON health_targets(user_id);

-- 4. Alert Channels Table
CREATE TABLE IF NOT EXISTS alert_channels (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL,
    destination TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_channels_user_id ON alert_channels(user_id);

-- 5. Health Logs Table (Partitioning by Range Timestamp)
CREATE TABLE IF NOT EXISTS health_logs (
    id BIGSERIAL,
    target_id BIGINT NOT NULL REFERENCES health_targets(id) ON DELETE CASCADE,
    status_code INTEGER,
    latency_ms INTEGER DEFAULT 0 NOT NULL,
    is_success BOOLEAN NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Composite Index for fast dashboard history queries
CREATE INDEX IF NOT EXISTS idx_health_logs_target_time ON health_logs(target_id, timestamp DESC);
