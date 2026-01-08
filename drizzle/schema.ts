import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Gyms table - Multi-tenant support
 * Each gym is an independent tenant with isolated data
 */
export const gyms = mysqlTable("gyms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(), // URL-friendly identifier
  cnpj: varchar("cnpj", { length: 18 }).unique(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }), // Email de contato alternativo
  contactPhone: varchar("contactPhone", { length: 20 }), // Telefone de contato alternativo
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  logoUrl: text("logoUrl"), // S3 URL for gym logo
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),

  // SaaS Plan fields
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  planStatus: mysqlEnum("planStatus", ["trial", "active", "suspended", "cancelled"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"), // Data fim do período de teste (14 dias)
  subscriptionStartsAt: timestamp("subscriptionStartsAt"), // Data início da assinatura paga
  nextBillingDate: timestamp("nextBillingDate"), // Próximo vencimento
  blockedReason: text("blockedReason"), // Motivo do bloqueio (inadimplência, etc)

  // Control ID settings
  controlIdDeviceIp: varchar("controlIdDeviceIp", { length: 50 }),
  controlIdUsername: varchar("controlIdUsername", { length: 100 }),
  controlIdPassword: varchar("controlIdPassword", { length: 255 }),

  // PIX settings (Efí Pay)
  pixClientId: varchar("pixClientId", { length: 255 }),
  pixClientSecret: varchar("pixClientSecret", { length: 255 }),
  pixCertificate: text("pixCertificate"),
  pixKey: varchar("pixKey", { length: 255 }), // Chave PIX para pagamentos
  pixKeyType: mysqlEnum("pixKeyType", ["cpf", "cnpj", "email", "phone", "random"]), // Tipo de chave PIX
  merchantName: varchar("merchantName", { length: 200 }), // Nome do beneficiário PIX
  merchantCity: varchar("merchantCity", { length: 100 }), // Cidade do beneficiário PIX

  // Wellhub integration
  wellhubApiKey: varchar("wellhubApiKey", { length: 255 }),
  wellhubWebhookSecret: varchar("wellhubWebhookSecret", { length: 255 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gym = typeof gyms.$inferSelect;
export type InsertGym = typeof gyms.$inferInsert;

/**
 * Core user table backing auth flow.
 * Extended with roles for multi-tenant system
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").references(() => gyms.id, { onDelete: "cascade" }), // null for super_admin
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["super_admin", "gym_admin", "staff", "student", "professor"]).default("student").notNull(),
  permissions: text("permissions"), // JSON string with permissions for staff role
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Students table - extended profile for gym members
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  professorId: int("professorId").references(() => users.id, { onDelete: "set null" }), // Professor responsável
  registrationNumber: varchar("registrationNumber", { length: 50 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  birthDate: timestamp("birthDate"),
  address: text("address"),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  membershipStatus: mysqlEnum("membershipStatus", ["active", "inactive", "suspended", "blocked"]).default("inactive").notNull(),
  controlIdUserId: int("controlIdUserId"),
  faceEnrolled: boolean("faceEnrolled").default(false).notNull(),
  faceImageUrl: text("faceImageUrl"),
  photoUrl: text("photoUrl"),
  cardImageUrl: text("cardImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Plans table - membership plans
 */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceInCents: int("priceInCents").notNull(),
  durationDays: int("durationDays").notNull(),
  features: text("features"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

/**
 * Subscriptions table - links students to plans
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  planId: int("planId").notNull().references(() => plans.id, { onDelete: "restrict" }),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "suspended"]).default("active").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Payments table - payment records
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  subscriptionId: int("subscriptionId").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  amountInCents: int("amountInCents").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  pixTxId: varchar("pixTxId", { length: 255 }),
  pixQrCode: text("pixQrCode"),
  pixQrCodeImage: text("pixQrCodeImage"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  dueDate: timestamp("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isInstallment: boolean("isInstallment").default(false),
  installmentPlanId: varchar("installmentPlanId", { length: 100 }),
  installmentNumber: int("installmentNumber"),
  totalInstallments: int("totalInstallments"),
  originalPaymentIds: text("originalPaymentIds"),
  interestForgiven: boolean("interestForgiven").default(false),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Medical Exams table
 */
export const medicalExams = mysqlTable("medical_exams", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  examDate: timestamp("examDate").notNull(),
  expiryDate: timestamp("expiryDate").notNull(),
  documentUrl: text("documentUrl"),
  status: mysqlEnum("status", ["valid", "expired", "pending"]).default("pending").notNull(),
  termAccepted: boolean("termAccepted").default(false).notNull(),
  termAcceptedAt: timestamp("termAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalExam = typeof medicalExams.$inferSelect;
export type InsertMedicalExam = typeof medicalExams.$inferInsert;

/**
 * Workouts table - training programs
 */
export const workouts = mysqlTable("workouts", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  professorId: int("professorId").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;

/**
 * Exercises table - exercise library
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  muscleGroup: varchar("muscleGroup", { length: 100 }),
  equipment: varchar("equipment", { length: 100 }),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Exercise Photos - multiple instructional photos per exercise
 */
export const exercisePhotos = mysqlTable("exercise_photos", {
  id: int("id").autoincrement().primaryKey(),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  photoUrl: text("photoUrl").notNull(),
  caption: varchar("caption", { length: 200 }), // "Posição inicial", "Execução", etc
  orderIndex: int("orderIndex").notNull().default(0), // ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExercisePhoto = typeof exercisePhotos.$inferSelect;
export type InsertExercisePhoto = typeof exercisePhotos.$inferInsert;

/**
 * Exercise Videos - instructional videos created by professors
 */
export const exerciseVideos = mysqlTable("exercise_videos", {
  id: int("id").autoincrement().primaryKey(),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "restrict" }), // professor que gravou
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  title: varchar("title", { length: 200 }),
  durationSeconds: int("durationSeconds"), // duração do vídeo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExerciseVideo = typeof exerciseVideos.$inferSelect;
export type InsertExerciseVideo = typeof exerciseVideos.$inferInsert;

/**
 * Workout Exercises - links exercises to workouts
 */
export const workoutExercises = mysqlTable("workout_exercises", {
  id: int("id").autoincrement().primaryKey(),
  workoutId: int("workoutId").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id, { onDelete: "restrict" }),
  dayOfWeek: varchar("dayOfWeek", { length: 20 }).notNull(), // "A", "B", "C", etc
  sets: int("sets").notNull(),
  reps: varchar("reps", { length: 50 }).notNull(), // "10-12" ou "15" ou "AMRAP"
  load: varchar("load", { length: 100 }), // "70% 1RM" ou "80kg" ou "corporal"
  restSeconds: int("restSeconds"),
  technique: mysqlEnum("technique", ["normal", "dropset", "superset", "giant_set", "rest_pause", "pyramidal"]).default("normal"),
  supersetWith: int("supersetWith"), // ID do exercício em superset (referência a outro workoutExercise)
  notes: text("notes"),
  orderIndex: int("orderIndex").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = typeof workoutExercises.$inferInsert;

/**
 * Physical Assessments - body measurements and progress tracking
 */
export const physicalAssessments = mysqlTable("physical_assessments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  professorId: int("professorId").notNull().references(() => users.id, { onDelete: "restrict" }),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  assessmentDate: timestamp("assessmentDate").notNull(),

  // Body measurements
  weight: decimal("weight", { precision: 5, scale: 2 }), // kg
  height: decimal("height", { precision: 5, scale: 2 }), // cm
  bodyFat: decimal("bodyFat", { precision: 4, scale: 2 }), // %
  muscleMass: decimal("muscleMass", { precision: 5, scale: 2 }), // kg

  // Circumferences (cm)
  chest: decimal("chest", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  hips: decimal("hips", { precision: 5, scale: 2 }),
  rightArm: decimal("rightArm", { precision: 5, scale: 2 }),
  leftArm: decimal("leftArm", { precision: 5, scale: 2 }),
  rightThigh: decimal("rightThigh", { precision: 5, scale: 2 }),
  leftThigh: decimal("leftThigh", { precision: 5, scale: 2 }),
  rightCalf: decimal("rightCalf", { precision: 5, scale: 2 }),
  leftCalf: decimal("leftCalf", { precision: 5, scale: 2 }),

  // Skinfolds - 7-fold protocol (mm)
  tricepsSkinfold: decimal("tricepsSkinfold", { precision: 4, scale: 2 }),
  subscapularSkinfold: decimal("subscapularSkinfold", { precision: 4, scale: 2 }),
  pectoralSkinfold: decimal("pectoralSkinfold", { precision: 4, scale: 2 }),
  midaxillarySkinfold: decimal("midaxillarySkinfold", { precision: 4, scale: 2 }),
  suprailiacSkinfold: decimal("suprailiacSkinfold", { precision: 4, scale: 2 }),
  abdominalSkinfold: decimal("abdominalSkinfold", { precision: 4, scale: 2 }),
  thighSkinfold: decimal("thighSkinfold", { precision: 4, scale: 2 }),

  // Functional tests
  flexibility: decimal("flexibility", { precision: 5, scale: 2 }), // cm (sit and reach)
  pushups: int("pushups"), // repetitions
  plankSeconds: int("plankSeconds"), // seconds
  vo2max: decimal("vo2max", { precision: 5, scale: 2 }), // ml/kg/min

  // Progress photos
  photoFront: varchar("photoFront", { length: 500 }),
  photoSide: varchar("photoSide", { length: 500 }),
  photoBack: varchar("photoBack", { length: 500 }),

  // Goals and notes
  goals: text("goals"), // JSON array of strings
  notes: text("notes"),

  // Next assessment
  nextAssessmentDate: timestamp("nextAssessmentDate"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type PhysicalAssessment = typeof physicalAssessments.$inferSelect;
export type InsertPhysicalAssessment = typeof physicalAssessments.$inferInsert;

/**
 * Workout Logs - tracks completed workout sessions
 */
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  workoutId: int("workoutId").notNull().references(() => workouts.id, { onDelete: "restrict" }),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  workoutDate: timestamp("workoutDate").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  duration: int("duration"), // minutes
  overallFeeling: int("overallFeeling"), // 1-5 rating (1=muito ruim, 5=excelente)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

/**
 * Workout Log Exercises - tracks individual exercises completed in a workout session
 */
export const workoutLogExercises = mysqlTable("workout_log_exercises", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id, { onDelete: "restrict" }),
  exerciseName: varchar("exerciseName", { length: 200 }).notNull(), // snapshot do nome
  sets: text("sets").notNull(), // JSON array: [{setNumber: 1, reps: 12, weight: 80, completed: true, isPR: false}, ...]
  notes: text("notes"),
  orderIndex: int("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutLogExercise = typeof workoutLogExercises.$inferSelect;
export type InsertWorkoutLogExercise = typeof workoutLogExercises.$inferInsert;

/**
 * Personal Records - tracks strength PRs (1RM, 3RM, 5RM, max reps, max volume)
 */
export const personalRecords = mysqlTable("personal_records", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  recordType: mysqlEnum("recordType", ["1rm", "3rm", "5rm", "max_reps", "max_volume"]).notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }), // kg
  reps: int("reps"),
  volume: decimal("volume", { precision: 8, scale: 2 }), // total volume in kg (weight * reps * sets)
  workoutLogId: int("workoutLogId").references(() => workoutLogs.id, { onDelete: "set null" }),
  achievedDate: timestamp("achievedDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = typeof personalRecords.$inferInsert;

/**
 * Access Logs - entry/exit records
 */
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  deviceId: int("deviceId").references(() => controlIdDevices.id),
  accessType: mysqlEnum("accessType", ["entry", "exit", "denied"]).notNull(),
  denialReason: varchar("denialReason", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

/**
 * Control ID Devices
 */
export const controlIdDevices = mysqlTable("control_id_devices", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 50 }).notNull(),
  port: int("port").default(80).notNull(),
  username: varchar("username", { length: 100 }),
  password: varchar("password", { length: 255 }),
  location: varchar("location", { length: 200 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ControlIdDevice = typeof controlIdDevices.$inferSelect;
export type InsertControlIdDevice = typeof controlIdDevices.$inferInsert;

/**
 * PIX Webhooks - payment notifications
 */
export const pixWebhooks = mysqlTable("pix_webhooks", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  txId: varchar("txId", { length: 255 }).notNull(),
  e2eId: varchar("e2eId", { length: 255 }),
  paymentId: int("paymentId").references(() => payments.id),
  status: varchar("status", { length: 50 }).notNull(),
  amountInCents: int("amountInCents").notNull(),
  payload: text("payload"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PixWebhook = typeof pixWebhooks.$inferSelect;
export type InsertPixWebhook = typeof pixWebhooks.$inferInsert;

/**
 * Password Reset Tokens
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 10 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Categories table - expense and income categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  color: varchar("color", { length: 7 }), // hex color code
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Suppliers table - vendors and service providers
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(), // Razão Social
  tradeName: varchar("tradeName", { length: 200 }), // Nome Fantasia
  cnpjCpf: varchar("cnpjCpf", { length: 18 }),
  category: varchar("category", { length: 100 }), // Categoria do fornecedor
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cellphone: varchar("cellphone", { length: 20 }), // Celular
  website: varchar("website", { length: 255 }), // Website
  address: text("address"), // Logradouro
  number: varchar("number", { length: 20 }), // Número
  complement: varchar("complement", { length: 100 }), // Complemento
  neighborhood: varchar("neighborhood", { length: 100 }), // Bairro
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  bank: varchar("bank", { length: 100 }), // Banco
  bankAgency: varchar("bankAgency", { length: 20 }), // Agência
  bankAccount: varchar("bankAccount", { length: 30 }), // Conta
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Cost Centers table - departmental cost tracking
 */
export const costCenters = mysqlTable("cost_centers", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(), // unique identifier
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

/**
 * Expenses table - business expenses
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").references(() => categories.id, { onDelete: "restrict" }),
  supplierId: int("supplierId").references(() => suppliers.id, { onDelete: "restrict" }),
  costCenterId: int("costCenterId").references(() => costCenters.id, { onDelete: "restrict" }),
  description: varchar("description", { length: 255 }).notNull(),
  amountInCents: int("amountInCents").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  status: mysqlEnum("status", ["pending", "paid", "cancelled", "overdue"]).default("pending").notNull(),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Bank Accounts table - contas bancárias com configuração PIX
 */
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  titularNome: varchar("titular_nome", { length: 200 }),
  banco: int("banco").notNull(),
  agenciaNumero: varchar("agencia_numero", { length: 30 }),
  agenciaDv: varchar("agencia_dv", { length: 10 }),
  contaNumero: varchar("conta_numero", { length: 30 }),
  contaDv: varchar("conta_dv", { length: 10 }),
  // PIX configuration
  pixAtivo: varchar("pix_ativo", { length: 30 }).default("N"),
  pixScope: varchar("pix_scope", { length: 255 }).default("cob.write cob.read pix.read pix.write"),
  pixChave: varchar("pix_chave", { length: 200 }),
  pixTipoChave: varchar("pix_tipo_chave", { length: 30 }),
  pixTipoAmbiente: varchar("pix_tipo_ambiente", { length: 30 }),
  pixClientId: varchar("pix_client_id", { length: 200 }),
  pixClientSecret: varchar("pix_client_secret", { length: 200 }),
  pixAccessToken: varchar("pix_access_token", { length: 200 }),
  pixCertificadoPath: varchar("pix_certificado_path", { length: 200 }),
  pixChavePrivadaPath: varchar("pix_chave_privada_path", { length: 200 }),
  pixCertificado: text("pix_certificado"), // Certificado PIX completo (conteúdo PEM)
  pixChavePrivada: text("pix_chave_privada"), // Chave privada PIX completa (conteúdo PEM)
  pixSenhaCertificado: varchar("pix_senha_certificado", { length: 200 }),
  pixVersaoApi: varchar("pix_versao_api", { length: 30 }),
  pixTimeoutMs: int("pix_timeout_ms").default(90000),
  pixTokenExpiracao: int("pix_token_expiracao").default(3600),
  pixTipoAutenticacao: varchar("pix_tipo_autenticacao", { length: 30 }).default("N"),
  pixUrlBase: varchar("pix_url_base", { length: 255 }),
  pixUrlToken: varchar("pix_url_token", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Site Settings table - configuration for landing page and branding
 * This is a singleton table (should only have one row)
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),

  // Branding
  siteName: varchar("site_name", { length: 200 }).default("SysFit Pro").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#6366f1").notNull(), // hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#8b5cf6").notNull(), // hex color

  // Hero Section
  heroTitle: varchar("hero_title", { length: 255 }).default("Sistema Completo para Academias Modernas").notNull(),
  heroSubtitle: varchar("hero_subtitle", { length: 255 }).default("Gerencie sua academia com eficiência total").notNull(),
  heroDescription: text("hero_description"),

  // Banners
  banner1Title: varchar("banner1_title", { length: 255 }),
  banner1Description: text("banner1_description"),
  banner1Image: text("banner1_image"),
  banner2Title: varchar("banner2_title", { length: 255 }),
  banner2Description: text("banner2_description"),
  banner2Image: text("banner2_image"),

  // Pricing
  basicPrice: int("basic_price").default(149).notNull(), // R$ (inteiro)
  professionalPrice: int("professional_price").default(299).notNull(),
  enterprisePrice: int("enterprise_price").default(599).notNull(),

  // Contact
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),

  // Social Media
  facebookUrl: varchar("facebook_url", { length: 500 }),
  instagramUrl: varchar("instagram_url", { length: 500 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

/**
 * Class Schedules - Aulas agendadas (horários de aulas coletivas)
 */
export const classSchedules = mysqlTable("class_schedules", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  professorId: int("professorId").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 200 }).notNull(), // Nome da aula (Yoga, Spinning, etc)
  type: varchar("type", { length: 50 }).notNull(), // Tipo de aula (Yoga, Spinning, Pilates, etc)
  description: text("description"),
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("startTime", { length: 5 }).notNull(), // "08:00"
  durationMinutes: int("durationMinutes").notNull().default(60), // Duração em minutos
  capacity: int("capacity").notNull().default(20), // Capacidade máxima
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassSchedule = typeof classSchedules.$inferSelect;
export type InsertClassSchedule = typeof classSchedules.$inferInsert;

/**
 * Class Bookings - Reservas de alunos em aulas coletivas
 */
export const classBookings = mysqlTable("class_bookings", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull().references(() => classSchedules.id, { onDelete: "cascade" }),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  bookingDate: timestamp("bookingDate").notNull(), // Data específica da aula
  status: mysqlEnum("status", ["confirmed", "cancelled", "attended", "missed"]).default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassBooking = typeof classBookings.$inferSelect;
export type InsertClassBooking = typeof classBookings.$inferInsert;

/**
 * Visitor Bookings - Agendamento de visitantes/aulas experimentais
 */
export const visitorBookings = mysqlTable("visitor_bookings", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  scheduleId: int("scheduleId").references(() => classSchedules.id, { onDelete: "set null" }), // Aula agendada (opcional)
  visitorName: varchar("visitorName", { length: 200 }).notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }).notNull(),
  visitorPhone: varchar("visitorPhone", { length: 20 }).notNull(),
  bookingDate: timestamp("bookingDate").notNull(), // Data/hora da visita
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  notes: text("notes"),
  leadId: int("leadId"), // ID do lead (se aplicável)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisitorBooking = typeof visitorBookings.$inferSelect;
export type InsertVisitorBooking = typeof visitorBookings.$inferInsert;

/**
 * Payment Methods - Métodos de pagamento personalizados por academia
 */
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull().references(() => gyms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // "Dinheiro", "Débito", "Crédito", etc
  type: mysqlEnum("type", ["cash", "bank_transfer", "credit_card", "debit_card", "pix", "check", "other"]).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
