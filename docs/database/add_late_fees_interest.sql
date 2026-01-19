-- Migration: Add late fees and interest calculation fields to payments table
-- Date: 2026-01-19
-- Description: Adds fields to store late fees, interest, and calculated amounts for overdue payments

ALTER TABLE payments
ADD COLUMN originalAmountInCents INT NULL COMMENT 'Valor original da mensalidade sem acréscimos',
ADD COLUMN lateFeeInCents INT DEFAULT 0 NOT NULL COMMENT 'Valor da multa por atraso (calculado)',
ADD COLUMN interestInCents INT DEFAULT 0 NOT NULL COMMENT 'Valor dos juros acumulados (calculado)',
ADD COLUMN totalAmountInCents INT NULL COMMENT 'Valor total com multa e juros (calculado)',
ADD COLUMN lastCalculatedAt TIMESTAMP NULL COMMENT 'Última vez que juros/multa foram calculados';

-- Update existing payments to set originalAmountInCents = amountInCents
UPDATE payments
SET originalAmountInCents = amountInCents,
    totalAmountInCents = amountInCents
WHERE originalAmountInCents IS NULL;

-- Create index for performance on overdue payments queries
CREATE INDEX idx_payments_status_duedate ON payments(status, dueDate);

-- Comments
ALTER TABLE payments
MODIFY COLUMN amountInCents INT NOT NULL COMMENT 'Valor da mensalidade (pode incluir acréscimos se calculado)';
