-- Adicionar campos faltantes na tabela suppliers
-- Execute na VPS: mysql -u academia -p'Academia2026Secure' academia_db < add_missing_columns.sql

ALTER TABLE suppliers
ADD COLUMN tradeName VARCHAR(200) AFTER name,
ADD COLUMN cellphone VARCHAR(20) AFTER phone,
ADD COLUMN website VARCHAR(255) AFTER cellphone,
ADD COLUMN number VARCHAR(20) AFTER address,
ADD COLUMN complement VARCHAR(100) AFTER number,
ADD COLUMN neighborhood VARCHAR(100) AFTER complement,
ADD COLUMN bank VARCHAR(100) AFTER zipCode,
ADD COLUMN bankAgency VARCHAR(20) AFTER bank,
ADD COLUMN bankAccount VARCHAR(30) AFTER bankAgency,
ADD COLUMN category VARCHAR(100) AFTER cnpjCpf;

-- Adicionar campos faltantes na tabela students
ALTER TABLE students
ADD COLUMN number VARCHAR(20) AFTER address,
ADD COLUMN complement VARCHAR(100) AFTER number,
ADD COLUMN neighborhood VARCHAR(100) AFTER complement;
