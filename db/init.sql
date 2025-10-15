-- ============================================================================
-- Database Initialization Script
-- This script runs automatically when PostgreSQL starts in Docker
-- ============================================================================

-- Set timezone
SET timezone = 'UTC';

-- ============================================================================
-- USERS TABLE (Auth Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- ORDERS TABLE (Order Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255),
    transaction_reference VARCHAR(255),
    third_party_reference VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    cart JSONB NOT NULL,
    customer_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'paid',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- OPTIONAL: Refresh Tokens Table (Future Enhancement)
-- Uncomment if you want to implement server-side token revocation
-- ============================================================================

-- CREATE TABLE IF NOT EXISTS refresh_tokens (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL,
--     token VARCHAR(500) UNIQUE NOT NULL,
--     expires_at TIMESTAMP NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW(),
--     CONSTRAINT fk_user_token FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );
-- 
-- CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
-- CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
-- CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Useful database views
-- ============================================================================

-- View: Recent orders with user email
CREATE OR REPLACE VIEW recent_orders AS
SELECT 
    o.order_id,
    o.user_id,
    u.email as user_email,
    o.transaction_id,
    o.amount,
    o.status,
    jsonb_array_length(o.cart) as items_count,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- View: User order statistics
CREATE OR REPLACE VIEW user_order_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.amount), 0) as total_spent,
    COALESCE(AVG(o.amount), 0) as average_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email;

-- ============================================================================
-- FUNCTIONS: Useful database functions
-- ============================================================================

-- Function to get user's total orders
CREATE OR REPLACE FUNCTION get_user_order_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's total spending
CREATE OR REPLACE FUNCTION get_user_total_spending(p_user_id INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- Uncomment to add test data
-- ============================================================================

-- Sample user (password: "password123" hashed with bcrypt)
-- INSERT INTO users (email, password) 
-- VALUES ('test@example.com', '$2a$10$YourHashedPasswordHere')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- GRANTS: Set permissions (if needed)
-- ============================================================================

-- Grant necessary permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- CLEANUP: Remove old data (Optional)
-- ============================================================================

-- Delete orders older than 1 year
-- DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 year';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display table information
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialization complete!';
    RAISE NOTICE '📊 Tables created:';
    RAISE NOTICE '   - users';
    RAISE NOTICE '   - orders';
    RAISE NOTICE '📈 Indexes created for performance optimization';
    RAISE NOTICE '🔄 Triggers created for auto-updating timestamps';
    RAISE NOTICE '👁️  Views created for analytics';
    RAISE NOTICE '⚡ Functions created for common queries';
END $$;

-- Show table counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders;

