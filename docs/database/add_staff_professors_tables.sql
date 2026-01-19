-- Migration: Add complete staff and professors tables with facial recognition support
-- This adds proper employee management with facial access control

-- Staff table (Funcionários)
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  userId INT NOT NULL,
  registrationNumber VARCHAR(50) NOT NULL COMMENT 'Matrícula do funcionário',
  cpf VARCHAR(14) NOT NULL,
  phone VARCHAR(20),
  birthDate TIMESTAMP NULL,

  -- Address fields
  address TEXT,
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zipCode VARCHAR(10),

  -- Employment info
  position VARCHAR(100) COMMENT 'Cargo/Função',
  department VARCHAR(100) COMMENT 'Departamento',
  hireDate TIMESTAMP NULL COMMENT 'Data de admissão',
  salary DECIMAL(10,2) COMMENT 'Salário (opcional)',

  -- Access control
  accessStatus ENUM('active', 'inactive', 'suspended', 'blocked') DEFAULT 'inactive' NOT NULL,
  controlIdUserId INT COMMENT 'ID do usuário no Control ID',
  faceEnrolled BOOLEAN DEFAULT FALSE NOT NULL,
  faceImageUrl TEXT,
  photoUrl TEXT,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_staff_user (userId),
  UNIQUE KEY unique_staff_cpf_gym (cpf, gymId),
  INDEX idx_staff_gym (gymId),
  INDEX idx_staff_status (accessStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Professors table (Professores)
CREATE TABLE IF NOT EXISTS professors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  userId INT NOT NULL,
  registrationNumber VARCHAR(50) NOT NULL COMMENT 'Matrícula do professor',
  cpf VARCHAR(14) NOT NULL,
  phone VARCHAR(20),
  birthDate TIMESTAMP NULL,

  -- Address fields
  address TEXT,
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zipCode VARCHAR(10),

  -- Professional info
  specialty VARCHAR(100) COMMENT 'Especialidade (Musculação, Pilates, etc)',
  certifications TEXT COMMENT 'Certificações/Formações',
  hireDate TIMESTAMP NULL COMMENT 'Data de admissão',
  cref VARCHAR(20) COMMENT 'Registro CREF',
  bio TEXT COMMENT 'Biografia/Apresentação',

  -- Access control
  accessStatus ENUM('active', 'inactive', 'suspended', 'blocked') DEFAULT 'inactive' NOT NULL,
  controlIdUserId INT COMMENT 'ID do usuário no Control ID',
  faceEnrolled BOOLEAN DEFAULT FALSE NOT NULL,
  faceImageUrl TEXT,
  photoUrl TEXT,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_professor_user (userId),
  UNIQUE KEY unique_professor_cpf_gym (cpf, gymId),
  INDEX idx_professor_gym (gymId),
  INDEX idx_professor_status (accessStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing staff users to staff table
INSERT INTO staff (gymId, userId, registrationNumber, cpf, phone, accessStatus, createdAt, updatedAt)
SELECT
  u.gymId,
  u.id as userId,
  CONCAT('FUNC', LPAD(u.id, 6, '0')) as registrationNumber,
  COALESCE(u.phone, '') as cpf, -- Placeholder, needs manual update
  u.phone,
  'active' as accessStatus,
  u.createdAt,
  u.updatedAt
FROM users u
WHERE u.role = 'staff' AND u.gymId IS NOT NULL
ON DUPLICATE KEY UPDATE userId = userId; -- Avoid duplicates

-- Migrate existing professor users to professors table
INSERT INTO professors (gymId, userId, registrationNumber, cpf, phone, accessStatus, createdAt, updatedAt)
SELECT
  u.gymId,
  u.id as userId,
  CONCAT('PROF', LPAD(u.id, 6, '0')) as registrationNumber,
  COALESCE(u.phone, '') as cpf, -- Placeholder, needs manual update
  u.phone,
  'active' as accessStatus,
  u.createdAt,
  u.updatedAt
FROM users u
WHERE u.role = 'professor' AND u.gymId IS NOT NULL
ON DUPLICATE KEY UPDATE userId = userId; -- Avoid duplicates
