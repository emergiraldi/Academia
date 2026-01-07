-- Script para RECRIAR as 4 tabelas com estrutura correta
-- Execute: mysql -u root academia_db < recreate_tables.sql

-- ATENÇÃO: Este script remove e recria as tabelas, perdendo todos os dados!

-- 1. Remover tabelas existentes (na ordem correta devido às foreign keys)
DROP TABLE IF EXISTS class_bookings;
DROP TABLE IF EXISTS visitor_bookings;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS class_schedules;

-- 2. Criar tabela class_schedules
CREATE TABLE class_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  professorId INT,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  dayOfWeek VARCHAR(20) NOT NULL,
  startTime VARCHAR(5) NOT NULL,
  durationMinutes INT NOT NULL DEFAULT 60,
  capacity INT NOT NULL DEFAULT 20,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (professorId) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Criar tabela class_bookings
CREATE TABLE class_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheduleId INT NOT NULL,
  studentId INT NOT NULL,
  bookingDate TIMESTAMP NOT NULL,
  status ENUM('confirmed', 'cancelled', 'attended', 'missed') NOT NULL DEFAULT 'confirmed',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduleId) REFERENCES class_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- 4. Criar tabela visitor_bookings
CREATE TABLE visitor_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  scheduleId INT,
  visitorName VARCHAR(200) NOT NULL,
  visitorEmail VARCHAR(320) NOT NULL,
  visitorPhone VARCHAR(20) NOT NULL,
  bookingDate TIMESTAMP NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending',
  notes TEXT,
  leadId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (scheduleId) REFERENCES class_schedules(id) ON DELETE SET NULL
);

-- 5. Criar tabela payment_methods
CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('cash', 'debit', 'credit', 'pix', 'bank_transfer', 'other') NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE
);

SELECT 'Tabelas recriadas com sucesso!' as status;
