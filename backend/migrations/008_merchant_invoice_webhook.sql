-- Stage 8: Merchant + Invoice + Webhook System

CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    webhook_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT DEFAULT '',
    payer_wallet_id UUID REFERENCES wallets(id),
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    url TEXT NOT NULL,
    payload JSONB NOT NULL,
    status_code INT,
    response TEXT DEFAULT '',
    attempt INT DEFAULT 1,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_invoices_merchant_order ON invoices(merchant_id, order_id);
CREATE INDEX idx_invoices_merchant_id ON invoices(merchant_id);
CREATE INDEX idx_merchants_api_key ON merchants(api_key);
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
