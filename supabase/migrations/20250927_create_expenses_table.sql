-- Create expenses table for trip expense tracking
-- Supports receipt scanning and manual expense entry

-- Create expense category enum
CREATE TYPE expense_category AS ENUM (
  'transport',
  'accommodation',
  'meals',
  'activities',
  'business',
  'other'
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  category expense_category NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  expense_location VARCHAR,
  card_last_four VARCHAR(4),
  card_type VARCHAR(50),
  receipt_image_url VARCHAR,
  receipt_data JSONB,
  is_personal_card BOOLEAN DEFAULT false,
  requires_reimbursement BOOLEAN DEFAULT false,
  reimbursement_status VARCHAR CHECK (reimbursement_status IN ('pending', 'approved', 'paid', 'denied')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_reimbursement ON expenses(requires_reimbursement, reimbursement_status);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "expenses_wolthers_staff_all" ON expenses
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u
      WHERE u.role IN ('wolthers_staff', 'global_admin', 'wolthers_finance')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "expenses_trip_participants" ON expenses
  FOR ALL USING (
    trip_id IN (
      SELECT tp.trip_id FROM trip_participants tp
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "expenses_own_expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE expenses IS 'Trip expenses with receipt scanning and reimbursement tracking';
COMMENT ON COLUMN expenses.receipt_data IS 'JSON data from OCR processing including confidence scores';
COMMENT ON COLUMN expenses.card_last_four IS 'Last 4 digits of payment card for tracking';
COMMENT ON COLUMN expenses.card_type IS 'Type of payment card (Visa, Mastercard, etc.)';