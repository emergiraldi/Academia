import { eq, and, or, isNull, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import {
  gyms, InsertGym,
  gymPayments, InsertGymPayment,
  gymBillingCycles, InsertGymBillingCycle,
  saasPlans, InsertSaasPlan,
  superAdminSettings, InsertSuperAdminSettings,
  users, InsertUser,
  students, InsertStudent,
  staff, InsertStaff,
  professors, InsertProfessor,
  plans, InsertPlan,
  subscriptions, InsertSubscription,
  payments, InsertPayment,
  medicalExams, InsertMedicalExam,
  workouts, InsertWorkout,
  exercises, InsertExercise,
  exercisePhotos, InsertExercisePhoto,
  exerciseVideos, InsertExerciseVideo,
  workoutExercises, InsertWorkoutExercise,
  physicalAssessments, InsertPhysicalAssessment,
  workoutLogs, InsertWorkoutLog,
  workoutLogExercises, InsertWorkoutLogExercise,
  personalRecords, InsertPersonalRecord,
  accessLogs, InsertAccessLog,
  classBookings, InsertClassBooking,
  controlIdDevices, InsertControlIdDevice,
  toletusDevices, InsertToletusDevice,
  pixWebhooks, InsertPixWebhook,
  passwordResetTokens, InsertPasswordResetToken,
  bankAccounts, InsertBankAccount,
  landingPageScreenshots, InsertLandingPageScreenshot,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db) {
    try {
      // Parse DATABASE_URL
      const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
      console.log("[Database] 🔍 DATABASE_URL from env:", process.env.DATABASE_URL);
      console.log("[Database] 🔍 Using connection string:", dbUrl);
      const url = new URL(dbUrl);

      // Create connection pool
      if (!_pool) {
        console.log("[Database] Creating connection pool...");
        console.log("[Database] 🔍 Connection details:", {
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username || 'root',
          database: url.pathname.substring(1),
          hasPassword: !!url.password
        });
        _pool = mysql.createPool({
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username || 'root',
          password: url.password || '',
          database: url.pathname.substring(1), // Remove leading /
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        // Test connection
        try {
          const connection = await _pool.getConnection();
          console.log("[Database] ✅ Connection pool created successfully!");
          connection.release();
        } catch (testError) {
          console.error("[Database] ❌ Failed to get connection from pool:", testError);
          _pool = null;
          throw testError;
        }
      }

      _db = drizzle(_pool);
      console.log("[Database] ✅ Drizzle ORM initialized successfully!");
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ GYMS ============

export async function createGym(gym: InsertGym) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gyms).values(gym);
  return { insertId: Number(result[0].insertId) };
}

export async function getGymById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gyms).where(eq(gyms.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGymBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gyms).where(eq(gyms.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listGyms() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gyms);
}

export async function updateGym(id: number, data: Partial<InsertGym>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gyms).set(data).where(eq(gyms.id, id));
}

// ============ GYM PAYMENTS ============

export async function createGymPayment(payment: InsertGymPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gymPayments).values(payment);
  return { insertId: Number(result[0].insertId) };
}

export async function listGymPayments(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gymPayments).where(eq(gymPayments.gymId, gymId));
}

export async function getGymPaymentById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymPayments)
    .where(and(eq(gymPayments.id, id), eq(gymPayments.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGymPaymentByPixTxId(txId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymPayments)
    .where(eq(gymPayments.pixTxId, txId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGymPayment(id: number, gymId: number, data: Partial<InsertGymPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gymPayments).set(data).where(and(eq(gymPayments.id, id), eq(gymPayments.gymId, gymId)));
}

export async function getGymPaymentByReferenceMonth(gymId: number, referenceMonth: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymPayments)
    .where(and(eq(gymPayments.gymId, gymId), eq(gymPayments.referenceMonth, referenceMonth)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingGymPayments() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(gymPayments)
    .where(eq(gymPayments.status, "pending"))
    .orderBy(asc(gymPayments.createdAt));
  return result;
}

// ============ GYM BILLING CYCLES ============

export async function createBillingCycle(cycle: InsertGymBillingCycle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gymBillingCycles).values(cycle);
  return { insertId: Number(result[0].insertId) };
}

export async function getBillingCyclesByGym(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.gymId, gymId))
    .orderBy(desc(gymBillingCycles.dueDate));
}

export async function getBillingCycleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBillingCycleByGymAndMonth(gymId: number, referenceMonth: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymBillingCycles)
    .where(and(
      eq(gymBillingCycles.gymId, gymId),
      eq(gymBillingCycles.referenceMonth, referenceMonth)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBillingCycle(id: number, data: Partial<InsertGymBillingCycle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gymBillingCycles).set(data).where(eq(gymBillingCycles.id, id));
}

export async function getPendingBillingCycles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.status, "pending"))
    .orderBy(asc(gymBillingCycles.dueDate));
}

export async function getOverdueBillingCycles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.status, "overdue"))
    .orderBy(asc(gymBillingCycles.dueDate));
}

export async function getBillingCyclesByStatus(status: "pending" | "paid" | "overdue" | "canceled") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.status, status))
    .orderBy(asc(gymBillingCycles.dueDate));
}

export async function getAllBillingCyclesWithGym() {
  const db = await getDb();
  if (!db) return [];

  // Join billing cycles with gym information
  const result = await db
    .select({
      id: gymBillingCycles.id,
      gymId: gymBillingCycles.gymId,
      gymName: gyms.name,
      gymSlug: gyms.slug,
      gymPlan: gyms.plan,
      gymStatus: gyms.status,
      referenceMonth: gymBillingCycles.referenceMonth,
      dueDate: gymBillingCycles.dueDate,
      amountCents: gymBillingCycles.amountCents,
      status: gymBillingCycles.status,
      paidAt: gymBillingCycles.paidAt,
      paymentId: gymBillingCycles.paymentId,
      blockedAt: gymBillingCycles.blockedAt,
      createdAt: gymBillingCycles.createdAt,
    })
    .from(gymBillingCycles)
    .innerJoin(gyms, eq(gymBillingCycles.gymId, gyms.id))
    .orderBy(desc(gymBillingCycles.createdAt));

  return result;
}

export async function getBillingCyclesByPaymentId(paymentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gymBillingCycles)
    .where(eq(gymBillingCycles.paymentId, paymentId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ SAAS PLANS ============

export async function listSaasPlans(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];

  if (activeOnly) {
    return await db.select().from(saasPlans)
      .where(eq(saasPlans.active, true))
      .orderBy(asc(saasPlans.displayOrder));
  }

  return await db.select().from(saasPlans).orderBy(asc(saasPlans.displayOrder));
}

export async function getSaasPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(saasPlans)
    .where(eq(saasPlans.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSaasPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(saasPlans)
    .where(eq(saasPlans.slug, slug))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSaasPlan(plan: InsertSaasPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(saasPlans).values(plan);
  return { insertId: Number(result[0].insertId) };
}

export async function updateSaasPlan(id: number, data: Partial<InsertSaasPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(saasPlans).set(data).where(eq(saasPlans.id, id));
}

export async function deleteSaasPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(saasPlans).where(eq(saasPlans.id, id));
}

// ============ SUPER ADMIN SETTINGS ============

export async function getSuperAdminSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(superAdminSettings).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSuperAdminSettings(settings: InsertSuperAdminSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(superAdminSettings).values(settings);
  return { insertId: Number(result[0].insertId) };
}

export async function updateSuperAdminSettings(data: Partial<InsertSuperAdminSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get existing settings or create if not exists
  const existing = await getSuperAdminSettings();

  if (existing) {
    await db.update(superAdminSettings)
      .set(data)
      .where(eq(superAdminSettings.id, existing.id));
    return existing.id;
  } else {
    const result = await createSuperAdminSettings(data as InsertSuperAdminSettings);
    return result.insertId;
  }
}

// ============ USERS ============

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(user);
  return { insertId: Number(result[0].insertId) };
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmailAndGym(email: string, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(
    and(eq(users.email, email), eq(users.gymId, gymId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByRole(gymId: number, role: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(users).where(
    and(eq(users.gymId, gymId), eq(users.role, role as any))
  );
  return result;
}

export async function updateUser(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

    if (user.name !== undefined) {
      values.name = user.name;
      updateSet.name = user.name;
    }
    if (user.loginMethod !== undefined) {
      values.loginMethod = user.loginMethod;
      updateSet.loginMethod = user.loginMethod;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (user.gymId !== undefined) {
      values.gymId = user.gymId;
      updateSet.gymId = user.gymId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// ============ STUDENTS ============

export async function createStudent(student: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(student);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentByUserId(userId: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      ...students,
      userName: users.name,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.userId, userId), eq(students.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: students.id,
      gymId: students.gymId,
      userId: students.userId,
      professorId: students.professorId,
      registrationNumber: students.registrationNumber,
      cpf: students.cpf,
      phone: students.phone,
      birthDate: students.birthDate,
      address: students.address,
      number: students.number,
      complement: students.complement,
      neighborhood: students.neighborhood,
      city: students.city,
      state: students.state,
      zipCode: students.zipCode,
      membershipStatus: students.membershipStatus,
      controlIdUserId: students.controlIdUserId,
      faceEnrolled: students.faceEnrolled,
      faceImageUrl: students.faceImageUrl,
      cardImageUrl: students.cardImageUrl,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
      name: users.name,
      email: users.email,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.id, id), eq(students.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listStudents(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: students.id,
      gymId: students.gymId,
      userId: students.userId,
      professorId: students.professorId,
      registrationNumber: students.registrationNumber,
      cpf: students.cpf,
      phone: students.phone,
      birthDate: students.birthDate,
      dateOfBirth: students.birthDate, // Alias para compatibilidade com frontend
      address: students.address,
      number: students.number,
      complement: students.complement,
      neighborhood: students.neighborhood,
      city: students.city,
      state: students.state,
      zipCode: students.zipCode,
      membershipStatus: students.membershipStatus,
      controlIdUserId: students.controlIdUserId,
      faceEnrolled: students.faceEnrolled,
      faceImageUrl: students.faceImageUrl,
      cardImageUrl: students.cardImageUrl,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
      name: users.name,
      email: users.email,
      planId: subscriptions.planId,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(subscriptions, and(
      eq(subscriptions.studentId, students.id),
      eq(subscriptions.status, 'active')
    ))
    .where(eq(students.gymId, gymId));
  return result;
}

// Lista apenas alunos vinculados a um professor específico
export async function listStudentsByProfessor(professorId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: students.id,
      gymId: students.gymId,
      userId: students.userId,
      professorId: students.professorId,
      registrationNumber: students.registrationNumber,
      cpf: students.cpf,
      phone: students.phone,
      birthDate: students.birthDate,
      dateOfBirth: students.birthDate,
      address: students.address,
      number: students.number,
      complement: students.complement,
      neighborhood: students.neighborhood,
      city: students.city,
      state: students.state,
      zipCode: students.zipCode,
      membershipStatus: students.membershipStatus,
      controlIdUserId: students.controlIdUserId,
      faceEnrolled: students.faceEnrolled,
      faceImageUrl: students.faceImageUrl,
      cardImageUrl: students.cardImageUrl,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
      name: users.name,
      email: users.email,
      planId: subscriptions.planId,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(subscriptions, and(
      eq(subscriptions.studentId, students.id),
      eq(subscriptions.status, 'active')
    ))
    .where(and(
      eq(students.gymId, gymId),
      eq(students.professorId, professorId)
    ));
  return result;
}

export async function updateStudent(id: number, gymId: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set(data).where(and(eq(students.id, id), eq(students.gymId, gymId)));
}

export async function checkStudentHasFinancialHistory(studentId: number, gymId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if student has any payment records (active, paid, pending, or failed)
  const studentPayments = await db.select().from(payments)
    .where(and(eq(payments.studentId, studentId), eq(payments.gymId, gymId)))
    .limit(1);

  return studentPayments.length > 0;
}

export async function deleteStudent(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(students).where(and(eq(students.id, id), eq(students.gymId, gymId)));
}

/**
 * Deleta um aluno completamente, incluindo todos os dados relacionados
 * Use com cuidado! Esta operação é irreversível.
 */
export async function deleteStudentCompletely(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get student data first
  const studentResult = await db.select().from(students)
    .where(and(eq(students.id, studentId), eq(students.gymId, gymId)))
    .limit(1);

  if (studentResult.length === 0) {
    throw new Error("Student not found");
  }

  const studentData = studentResult[0];
  const userId = studentData.userId;

  console.log(`[Delete Student] 🗑️  Iniciando exclusão completa do aluno ID ${studentId}`);

  // Delete all related records in order (child tables first)
  try {
    // 1. Delete workout related data (using raw SQL for workout_day_completions)
    await db.execute(sql`DELETE FROM workout_day_completions WHERE studentId = ${studentId}`);
    console.log(`[Delete Student] ✅ Workout day completions deletados`);

    await db.delete(workoutLogs).where(eq(workoutLogs.studentId, studentId));
    console.log(`[Delete Student] ✅ Workout logs deletados`);

    await db.delete(workouts).where(eq(workouts.studentId, studentId));
    console.log(`[Delete Student] ✅ Workouts deletados`);

    // 2. Delete assessments and records
    await db.delete(physicalAssessments).where(eq(physicalAssessments.studentId, studentId));
    console.log(`[Delete Student] ✅ Physical assessments deletados`);

    await db.delete(personalRecords).where(eq(personalRecords.studentId, studentId));
    console.log(`[Delete Student] ✅ Personal records deletados`);

    await db.delete(medicalExams).where(eq(medicalExams.studentId, studentId));
    console.log(`[Delete Student] ✅ Medical exams deletados`);

    // 3. Delete class bookings
    await db.delete(classBookings).where(eq(classBookings.studentId, studentId));
    console.log(`[Delete Student] ✅ Class bookings deletados`);

    // 4. Delete access logs
    await db.delete(accessLogs).where(eq(accessLogs.studentId, studentId));
    console.log(`[Delete Student] ✅ Access logs deletados`);

    // 5. Delete financial records (payments and subscriptions)
    await db.delete(payments).where(and(
      eq(payments.studentId, studentId),
      eq(payments.gymId, gymId)
    ));
    console.log(`[Delete Student] ✅ Payments deletados`);

    await db.delete(subscriptions).where(and(
      eq(subscriptions.studentId, studentId),
      eq(subscriptions.gymId, gymId)
    ));
    console.log(`[Delete Student] ✅ Subscriptions deletados`);

    // 6. Delete student record
    await db.delete(students).where(and(
      eq(students.id, studentId),
      eq(students.gymId, gymId)
    ));
    console.log(`[Delete Student] ✅ Student record deletado`);

    // 7. Delete user record
    await db.delete(users).where(eq(users.id, userId));
    console.log(`[Delete Student] ✅ User record deletado`);

    console.log(`[Delete Student] ✅ Exclusão completa do aluno ID ${studentId} finalizada com sucesso`);

    return {
      success: true,
      deletedStudentId: studentId,
      deletedUserId: userId,
      controlIdUserId: studentData.controlIdUserId
    };
  } catch (error: any) {
    console.error(`[Delete Student] ❌ Erro ao deletar aluno:`, error);
    throw new Error(`Erro ao deletar aluno: ${error.message}`);
  }
}

// ============ STAFF ============

export async function createStaff(staffData: InsertStaff) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(staff).values(staffData);
  return { insertId: Number(result[0].insertId) };
}

export async function getStaffByUserId(userId: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStaffById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listStaff(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: staff.id,
      userId: staff.userId,
      registrationNumber: staff.registrationNumber,
      cpf: staff.cpf,
      phone: staff.phone,
      birthDate: staff.birthDate,
      address: staff.address,
      number: staff.number,
      complement: staff.complement,
      neighborhood: staff.neighborhood,
      city: staff.city,
      state: staff.state,
      zipCode: staff.zipCode,
      position: staff.position,
      department: staff.department,
      hireDate: staff.hireDate,
      salary: staff.salary,
      accessStatus: staff.accessStatus,
      controlIdUserId: staff.controlIdUserId,
      faceEnrolled: staff.faceEnrolled,
      faceImageUrl: staff.faceImageUrl,
      photoUrl: staff.photoUrl,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(staff)
    .leftJoin(users, eq(staff.userId, users.id))
    .where(eq(staff.gymId, gymId))
    .orderBy(desc(staff.createdAt));
}

export async function updateStaff(id: number, gymId: number, data: Partial<InsertStaff>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(staff).set(data).where(and(eq(staff.id, id), eq(staff.gymId, gymId)));
}

export async function deleteStaff(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.gymId, gymId)));
}

export async function updateStaffAccessStatus(
  id: number,
  gymId: number,
  accessStatus: "active" | "inactive" | "suspended" | "blocked"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(staff).set({ accessStatus }).where(and(eq(staff.id, id), eq(staff.gymId, gymId)));
}

export async function enrollStaffFace(
  id: number,
  gymId: number,
  controlIdUserId: number,
  faceImageUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(staff)
    .set({
      controlIdUserId,
      faceImageUrl,
      faceEnrolled: true,
    })
    .where(and(eq(staff.id, id), eq(staff.gymId, gymId)));
}

// ============ PROFESSORS ============

export async function createProfessor(professorData: InsertProfessor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(professors).values(professorData);
  return { insertId: Number(result[0].insertId) };
}

export async function getProfessorByUserId(userId: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(professors)
    .where(and(eq(professors.userId, userId), eq(professors.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProfessorById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(professors)
    .where(and(eq(professors.id, id), eq(professors.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listProfessors(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: professors.id,
      userId: professors.userId,
      registrationNumber: professors.registrationNumber,
      cpf: professors.cpf,
      phone: professors.phone,
      birthDate: professors.birthDate,
      address: professors.address,
      number: professors.number,
      complement: professors.complement,
      neighborhood: professors.neighborhood,
      city: professors.city,
      state: professors.state,
      zipCode: professors.zipCode,
      specialty: professors.specialty,
      certifications: professors.certifications,
      hireDate: professors.hireDate,
      cref: professors.cref,
      bio: professors.bio,
      accessStatus: professors.accessStatus,
      controlIdUserId: professors.controlIdUserId,
      faceEnrolled: professors.faceEnrolled,
      faceImageUrl: professors.faceImageUrl,
      photoUrl: professors.photoUrl,
      createdAt: professors.createdAt,
      updatedAt: professors.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(professors)
    .leftJoin(users, eq(professors.userId, users.id))
    .where(eq(professors.gymId, gymId))
    .orderBy(desc(professors.createdAt));
}

export async function updateProfessor(id: number, gymId: number, data: Partial<InsertProfessor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(professors).set(data).where(and(eq(professors.id, id), eq(professors.gymId, gymId)));
}

export async function deleteProfessor(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(professors).where(and(eq(professors.id, id), eq(professors.gymId, gymId)));
}

export async function updateProfessorAccessStatus(
  id: number,
  gymId: number,
  accessStatus: "active" | "inactive" | "suspended" | "blocked"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(professors).set({ accessStatus }).where(and(eq(professors.id, id), eq(professors.gymId, gymId)));
}

export async function enrollProfessorFace(
  id: number,
  gymId: number,
  controlIdUserId: number,
  faceImageUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(professors)
    .set({
      controlIdUserId,
      faceImageUrl,
      faceEnrolled: true,
    })
    .where(and(eq(professors.id, id), eq(professors.gymId, gymId)));
}

// ============ PLANS ============

export async function createPlan(plan: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(plan);
  return { insertId: Number(result[0].insertId) };
}

export async function listPlans(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(plans).where(eq(plans.gymId, gymId));
}

export async function getPlanById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans)
    .where(and(eq(plans.id, id), eq(plans.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePlan(planId: number, updates: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(updates).where(eq(plans.id, planId));
}

export async function deletePlan(planId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(plans).where(eq(plans.id, planId));
}

// ============ SUBSCRIPTIONS ============

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptions).values(subscription);
  return { insertId: Number(result[0].insertId) };
}

export async function getActiveSubscription(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.studentId, studentId),
      eq(subscriptions.gymId, gymId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listSubscriptions(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(subscriptions).where(eq(subscriptions.gymId, gymId));
}

// ============ PAYMENTS ============

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(payment);
  return { insertId: Number(result[0].insertId) };
}

export async function listPayments(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).where(eq(payments.gymId, gymId));
}

export async function listPaymentsWithStudents(gymId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: payments.id,
    gymId: payments.gymId,
    subscriptionId: payments.subscriptionId,
    studentId: payments.studentId,
    amountInCents: payments.amountInCents,
    status: payments.status,
    paymentMethod: payments.paymentMethod,
    pixTxId: payments.pixTxId,
    pixQrCode: payments.pixQrCode,
    pixQrCodeImage: payments.pixQrCodeImage,
    receiptUrl: payments.receiptUrl,
    dueDate: payments.dueDate,
    paidAt: payments.paidAt,
    createdAt: payments.createdAt,
    updatedAt: payments.updatedAt,
    isInstallment: payments.isInstallment,
    installmentPlanId: payments.installmentPlanId,
    installmentNumber: payments.installmentNumber,
    totalInstallments: payments.totalInstallments,
    originalPaymentIds: payments.originalPaymentIds,
    interestForgiven: payments.interestForgiven,
    studentId_join: students.id,
    studentUserId: students.userId,
    studentName: students.name,
    studentRegistrationNumber: students.registrationNumber,
    studentCpf: students.cpf,
    studentPhone: students.phone,
    studentDateOfBirth: students.dateOfBirth,
    studentAddress: students.address,
    studentNumber: students.number,
    studentComplement: students.complement,
    studentNeighborhood: students.neighborhood,
    studentCity: students.city,
    studentState: students.state,
    studentZipCode: students.zipCode,
    studentMembershipStatus: students.membershipStatus,
    studentPlanId: students.planId,
    studentProfessorId: students.professorId,
    studentGymId: students.gymId,
  })
  .from(payments)
  .leftJoin(students, eq(payments.studentId, students.id))
  .where(eq(payments.gymId, gymId));

  // Transform the flat structure into nested structure
  return result.map(row => ({
    id: row.id,
    gymId: row.gymId,
    subscriptionId: row.subscriptionId,
    studentId: row.studentId,
    amountInCents: row.amountInCents,
    status: row.status,
    paymentMethod: row.paymentMethod,
    pixTxId: row.pixTxId,
    pixQrCode: row.pixQrCode,
    pixQrCodeImage: row.pixQrCodeImage,
    receiptUrl: row.receiptUrl,
    dueDate: row.dueDate,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isInstallment: row.isInstallment,
    installmentPlanId: row.installmentPlanId,
    installmentNumber: row.installmentNumber,
    totalInstallments: row.totalInstallments,
    originalPaymentIds: row.originalPaymentIds,
    interestForgiven: row.interestForgiven,
    student: row.studentId_join ? {
      id: row.studentId_join,
      userId: row.studentUserId,
      name: row.studentName,
      registrationNumber: row.studentRegistrationNumber,
      cpf: row.studentCpf,
      phone: row.studentPhone,
      dateOfBirth: row.studentDateOfBirth,
      address: row.studentAddress,
      number: row.studentNumber,
      complement: row.studentComplement,
      neighborhood: row.studentNeighborhood,
      city: row.studentCity,
      state: row.studentState,
      zipCode: row.studentZipCode,
      membershipStatus: row.studentMembershipStatus,
      planId: row.studentPlanId,
      professorId: row.studentProfessorId,
      gymId: row.studentGymId,
    } : undefined,
  }));
}

export async function getPaymentsByStudent(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(and(eq(payments.studentId, studentId), eq(payments.gymId, gymId)));
}

export async function getPaymentById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments)
    .where(and(eq(payments.id, id), eq(payments.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePayment(id: number, gymId: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments).set(data).where(and(eq(payments.id, id), eq(payments.gymId, gymId)));
}

/**
 * Calculate late fee and interest for an overdue payment
 * Returns calculated amounts without updating database
 */
export async function calculateLateFeeAndInterest(
  payment: Payment,
  gymId: number
): Promise<{
  lateFeeInCents: number;
  interestInCents: number;
  totalAmountInCents: number;
  daysOverdue: number;
}> {
  // Get gym settings
  const settings = await getGymSettings(gymId);
  if (!settings) {
    return {
      lateFeeInCents: 0,
      interestInCents: 0,
      totalAmountInCents: payment.amountInCents,
      daysOverdue: 0,
    };
  }

  // Only calculate if payment is pending/unpaid
  if (payment.status !== 'pending') {
    return {
      lateFeeInCents: 0,
      interestInCents: 0,
      totalAmountInCents: payment.amountInCents,
      daysOverdue: 0,
    };
  }

  // Calculate days overdue
  const now = Date.now();
  const dueDate = new Date(payment.dueDate).getTime();
  const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

  // Not overdue yet
  if (daysOverdue <= 0) {
    return {
      lateFeeInCents: 0,
      interestInCents: 0,
      totalAmountInCents: payment.amountInCents,
      daysOverdue: 0,
    };
  }

  // Get original amount (use originalAmountInCents if available, otherwise amountInCents)
  const originalAmount = payment.originalAmountInCents || payment.amountInCents;

  // Calculate late fee (multa) - applied once
  const lateFeePercentage = settings.lateFeePercentage || 0;
  const lateFeeInCents = Math.round((originalAmount * lateFeePercentage) / 100);

  // Calculate interest (juros) - applied daily after grace period
  const daysToStartInterest = settings.daysToStartInterest || 1;
  const interestRatePerMonth = settings.interestRatePerMonth || 0;

  let interestInCents = 0;
  if (daysOverdue >= daysToStartInterest && interestRatePerMonth > 0) {
    // Convert monthly rate to daily rate
    const dailyRate = interestRatePerMonth / 30; // Aproximação: 1 mês = 30 dias
    const daysForInterest = daysOverdue - daysToStartInterest + 1;

    // Calculate compound interest: amount * (1 + rate)^days - amount
    const interestMultiplier = Math.pow(1 + (dailyRate / 100), daysForInterest);
    interestInCents = Math.round(originalAmount * (interestMultiplier - 1));
  }

  const totalAmountInCents = originalAmount + lateFeeInCents + interestInCents;

  return {
    lateFeeInCents,
    interestInCents,
    totalAmountInCents,
    daysOverdue,
  };
}

/**
 * Apply late fee and interest calculation to a payment and update database
 */
export async function applyLateFeeAndInterestToPayment(
  paymentId: number,
  gymId: number
): Promise<boolean> {
  try {
    // Get payment
    const payment = await getPaymentById(paymentId, gymId);
    if (!payment) {
      console.error(`[Late Fees] Payment ${paymentId} not found`);
      return false;
    }

    // Calculate late fees and interest
    const calculated = await calculateLateFeeAndInterest(payment, gymId);

    // Update payment with calculated values
    await updatePayment(paymentId, gymId, {
      originalAmountInCents: payment.originalAmountInCents || payment.amountInCents,
      lateFeeInCents: calculated.lateFeeInCents,
      interestInCents: calculated.interestInCents,
      totalAmountInCents: calculated.totalAmountInCents,
      amountInCents: calculated.totalAmountInCents, // Update amount to include fees
      lastCalculatedAt: new Date(),
    });

    console.log(
      `[Late Fees] Payment ${paymentId}: Original R$ ${(payment.amountInCents / 100).toFixed(2)}, ` +
      `Late Fee R$ ${(calculated.lateFeeInCents / 100).toFixed(2)}, ` +
      `Interest R$ ${(calculated.interestInCents / 100).toFixed(2)}, ` +
      `Total R$ ${(calculated.totalAmountInCents / 100).toFixed(2)} ` +
      `(${calculated.daysOverdue} days overdue)`
    );

    return true;
  } catch (error) {
    console.error(`[Late Fees] Error applying late fees to payment ${paymentId}:`, error);
    return false;
  }
}

/**
 * Calculate and apply late fees and interest to all overdue payments
 * Should be run daily via cron job
 */
export async function calculateAllOverduePayments(): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> {
  try {
    console.log('[Late Fees] Starting calculation for all overdue payments...');

    const db = await getDb();
    if (!db) {
      console.error('[Late Fees] Database not available');
      return { processed: 0, updated: 0, errors: 0 };
    }

    // Get all pending payments that are overdue
    const allPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'pending'));

    const now = Date.now();
    const overduePayments = allPayments.filter(p => {
      const dueDate = new Date(p.dueDate).getTime();
      return dueDate < now;
    });

    console.log(`[Late Fees] Found ${overduePayments.length} overdue payment(s)`);

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const payment of overduePayments) {
      try {
        processed++;
        const success = await applyLateFeeAndInterestToPayment(payment.id, payment.gymId);
        if (success) {
          updated++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`[Late Fees] Error processing payment ${payment.id}:`, error);
        errors++;
      }
    }

    console.log(
      `[Late Fees] Completed: ${processed} processed, ${updated} updated, ${errors} errors`
    );

    return { processed, updated, errors };
  } catch (error) {
    console.error('[Late Fees] Error in calculateAllOverduePayments:', error);
    return { processed: 0, updated: 0, errors: 0 };
  }
}

export async function generateMonthlyPayments(
  gymId: number,
  referenceMonth: Date,
  options?: {
    studentIds?: number[];
    planId?: number;
    dueDay?: number;
  }
) {
  const conn = await getConnection();

  try {
    // Build query with optional filters
    let query = `
      SELECT s.*, p.priceInCents, st.id as studentId
      FROM subscriptions s
      JOIN plans p ON s.planId = p.id
      JOIN students st ON s.studentId = st.id
      WHERE s.gymId = ? AND s.status = 'active'
    `;
    const params: any[] = [gymId];

    // Filter by specific students
    if (options?.studentIds && options.studentIds.length > 0) {
      query += ` AND st.id IN (${options.studentIds.map(() => '?').join(',')})`;
      params.push(...options.studentIds);
    }

    // Filter by plan
    if (options?.planId) {
      query += ` AND p.id = ?`;
      params.push(options.planId);
    }

    const [activeSubscriptions] = await conn.execute(query, params);

    const year = referenceMonth.getFullYear();
    const month = referenceMonth.getMonth();
    let generatedCount = 0;

    for (const sub of activeSubscriptions as any[]) {
      // Calculate due date - use provided dueDay or subscription start date
      let dueDayToUse: number;
      if (options?.dueDay !== undefined) {
        dueDayToUse = options.dueDay;
      } else {
        const startDate = new Date(sub.startDate);
        dueDayToUse = startDate.getDate();
      }
      const dueDate = new Date(year, month, dueDayToUse);

      // Check if payment already exists for this month
      const [existing] = await conn.execute(`
        SELECT id FROM payments
        WHERE subscriptionId = ?
        AND YEAR(dueDate) = ?
        AND MONTH(dueDate) = ?
      `, [sub.id, year, month + 1]);

      if ((existing as any[]).length === 0) {
        // Create payment
        await conn.execute(`
          INSERT INTO payments
          (gymId, subscriptionId, studentId, amountInCents, status, paymentMethod, dueDate)
          VALUES (?, ?, ?, ?, 'pending', 'pending', ?)
        `, [gymId, sub.id, sub.studentId, sub.priceInCents, dueDate]);
        generatedCount++;
      }
    }

    await conn.end();
    return { generated: generatedCount };
  } catch (error) {
    await conn.end();
    throw error;
  }
}

// ============ MEDICAL EXAMS ============

export async function createMedicalExam(exam: InsertMedicalExam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(medicalExams).values(exam);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentMedicalExams(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(medicalExams)
    .where(and(eq(medicalExams.studentId, studentId), eq(medicalExams.gymId, gymId)));
}

// ============ WORKOUTS ============

export async function createWorkout(workout: InsertWorkout) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workouts).values(workout);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentWorkouts(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workouts)
    .where(and(eq(workouts.studentId, studentId), eq(workouts.gymId, gymId)));
}

export async function getWorkoutById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteWorkout(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // First delete all workout_exercises associated with this workout
  await db.delete(workoutExercises).where(eq(workoutExercises.workoutId, id));
  // Then delete the workout itself
  await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.gymId, gymId)));
  return { success: true };
}

export async function getAllWorkouts(gymId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      description: workouts.description,
      startDate: workouts.startDate,
      endDate: workouts.endDate,
      active: workouts.active,
      createdAt: workouts.createdAt,
      studentId: students.id,
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(workouts)
    .leftJoin(students, eq(workouts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(workouts.gymId, gymId))
    .orderBy(desc(workouts.createdAt));

  return result;
}

// ============ EXERCISES ============

export async function createExercise(exercise: InsertExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exercises).values(exercise);
  return { insertId: Number(result[0].insertId) };
}

export async function listExercises(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  // Busca exercícios GLOBAIS (gymId = NULL) + exercícios da PRÓPRIA academia
  return await db.select().from(exercises).where(
    or(
      isNull(exercises.gymId),        // Biblioteca global (todas academias)
      eq(exercises.gymId, gymId)      // Exercícios customizados da academia
    )
  );
}

export async function getExerciseById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  // Busca exercício global OU da própria academia
  const result = await db.select().from(exercises)
    .where(and(
      eq(exercises.id, id),
      or(
        isNull(exercises.gymId),        // Biblioteca global
        eq(exercises.gymId, gymId)      // Exercício da academia
      )
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateExercise(data: { id: number; name: string; description: string | null; muscleGroup: string | null; equipment: string | null; instructions: string | null; imageUrl?: string; videoUrl: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    name: data.name,
    description: data.description,
    muscleGroup: data.muscleGroup,
    equipment: data.equipment,
    instructions: data.instructions,
    videoUrl: data.videoUrl,
  };

  if (data.imageUrl) {
    updateData.imageUrl = data.imageUrl;
  }

  await db.update(exercises)
    .set(updateData)
    .where(eq(exercises.id, data.id));

  return { success: true };
}

export async function deleteExercise(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.gymId, gymId)));

  return { success: true };
}

// ============ EXERCISE PHOTOS ============

export async function addExercisePhoto(photo: InsertExercisePhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exercisePhotos).values(photo);
  return { insertId: Number(result[0].insertId) };
}

export async function getExercisePhotos(exerciseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercisePhotos)
    .where(eq(exercisePhotos.exerciseId, exerciseId))
    .orderBy(exercisePhotos.orderIndex);
}

export async function getExercisePhotoWithGym(photoId: number, userGymId: number | null) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    photo: exercisePhotos,
    exerciseGymId: exercises.gymId,
  })
    .from(exercisePhotos)
    .innerJoin(exercises, eq(exercisePhotos.exerciseId, exercises.id))
    .where(eq(exercisePhotos.id, photoId))
    .limit(1);

  if (result.length === 0) return null;

  // Validate gym access
  if (userGymId !== null && result[0].exerciseGymId !== userGymId) {
    return null; // Photo belongs to different gym
  }

  return result[0];
}

export async function deleteExercisePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exercisePhotos).where(eq(exercisePhotos.id, id));
}

// ============ EXERCISE VIDEOS ============

export async function addExerciseVideo(video: InsertExerciseVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exerciseVideos).values(video);
  return { insertId: Number(result[0].insertId) };
}

export async function getExerciseVideos(exerciseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exerciseVideos)
    .where(eq(exerciseVideos.exerciseId, exerciseId))
    .orderBy(desc(exerciseVideos.createdAt));
}

export async function getExerciseVideoWithGym(videoId: number, userGymId: number | null) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    video: exerciseVideos,
    exerciseGymId: exercises.gymId,
  })
    .from(exerciseVideos)
    .innerJoin(exercises, eq(exerciseVideos.exerciseId, exercises.id))
    .where(eq(exerciseVideos.id, videoId))
    .limit(1);

  if (result.length === 0) return null;

  // Validate gym access
  if (userGymId !== null && result[0].exerciseGymId !== userGymId) {
    return null; // Video belongs to different gym
  }

  return result[0];
}

export async function deleteExerciseVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exerciseVideos).where(eq(exerciseVideos.id, id));
}

// ============ WORKOUT EXERCISES ============

export async function addExerciseToWorkout(workoutExercise: InsertWorkoutExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutExercises).values(workoutExercise);
  return { insertId: Number(result[0].insertId) };
}

export async function getWorkoutExercises(workoutId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));
}

export async function getWorkoutExerciseWithGym(exerciseId: number, userGymId: number | null) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    exercise: workoutExercises,
    workoutGymId: workouts.gymId,
  })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(workoutExercises.id, exerciseId))
    .limit(1);

  if (result.length === 0) return null;

  // Validate gym access (super_admin can access any gym, but we check in the router)
  if (userGymId !== null && result[0].workoutGymId !== userGymId) {
    return null; // Exercise belongs to different gym
  }

  return result[0];
}

export async function markExerciseComplete(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutExercises)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(workoutExercises.id, id));
}

export async function updateWorkoutExercise(id: number, updates: Partial<InsertWorkoutExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutExercises)
    .set(updates)
    .where(eq(workoutExercises.id, id));
}

export async function deleteWorkoutExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workoutExercises).where(eq(workoutExercises.id, id));
}

export async function getWorkoutWithExercises(workoutId: number, gymId: number) {
  const db = await getDb();
  if (!db) return null;

  const [workout] = await db.select().from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.gymId, gymId)))
    .limit(1);

  if (!workout) return null;

  const workoutExs = await db.select({
    id: workoutExercises.id,
    workoutId: workoutExercises.workoutId,
    exerciseId: workoutExercises.exerciseId,
    dayOfWeek: workoutExercises.dayOfWeek,
    sets: workoutExercises.sets,
    reps: workoutExercises.reps,
    load: workoutExercises.load,
    restSeconds: workoutExercises.restSeconds,
    notes: workoutExercises.notes,
    orderIndex: workoutExercises.orderIndex,
    exerciseName: exercises.name,
    exerciseMuscleGroup: exercises.muscleGroup,
    exerciseImageUrl: exercises.imageUrl,
    exerciseDescription: exercises.description,
    exerciseVideoUrl: exercises.videoUrl,
  })
    .from(workoutExercises)
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(workoutExercises.dayOfWeek, workoutExercises.orderIndex);

  return {
    ...workout,
    exercises: workoutExs,
  };
}

// ============ PHYSICAL ASSESSMENTS ============

export async function createPhysicalAssessment(assessment: InsertPhysicalAssessment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(physicalAssessments).values(assessment);
  return { insertId: Number(result[0].insertId) };
}

export async function getPhysicalAssessmentById(assessmentId: number, gymId: number | null) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(physicalAssessments)
    .where(eq(physicalAssessments.id, assessmentId))
    .limit(1);

  if (result.length === 0) return null;

  // Validate gym access (super_admin can access any gym)
  if (gymId !== null && result[0].gymId !== gymId) {
    return null; // Assessment belongs to different gym
  }

  return result[0];
}

export async function getStudentAssessments(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];

  const assessmentsList = await db
    .select({
      id: physicalAssessments.id,
      studentId: physicalAssessments.studentId,
      professorId: physicalAssessments.professorId,
      assessmentDate: physicalAssessments.assessmentDate,
      weight: physicalAssessments.weight,
      height: physicalAssessments.height,
      bodyFat: physicalAssessments.bodyFat,
      muscleMass: physicalAssessments.muscleMass,
      chest: physicalAssessments.chest,
      waist: physicalAssessments.waist,
      hips: physicalAssessments.hips,
      rightArm: physicalAssessments.rightArm,
      leftArm: physicalAssessments.leftArm,
      rightThigh: physicalAssessments.rightThigh,
      leftThigh: physicalAssessments.leftThigh,
      rightCalf: physicalAssessments.rightCalf,
      leftCalf: physicalAssessments.leftCalf,
      tricepsSkinfold: physicalAssessments.tricepsSkinfold,
      subscapularSkinfold: physicalAssessments.subscapularSkinfold,
      pectoralSkinfold: physicalAssessments.pectoralSkinfold,
      midaxillarySkinfold: physicalAssessments.midaxillarySkinfold,
      suprailiacSkinfold: physicalAssessments.suprailiacSkinfold,
      abdominalSkinfold: physicalAssessments.abdominalSkinfold,
      thighSkinfold: physicalAssessments.thighSkinfold,
      flexibility: physicalAssessments.flexibility,
      pushups: physicalAssessments.pushups,
      plankSeconds: physicalAssessments.plankSeconds,
      vo2max: physicalAssessments.vo2max,
      photoFront: physicalAssessments.photoFront,
      photoSide: physicalAssessments.photoSide,
      photoBack: physicalAssessments.photoBack,
      goals: physicalAssessments.goals,
      notes: physicalAssessments.notes,
      nextAssessmentDate: physicalAssessments.nextAssessmentDate,
      createdAt: physicalAssessments.createdAt,
      professorName: users.name,
    })
    .from(physicalAssessments)
    .leftJoin(users, eq(physicalAssessments.professorId, users.id))
    .where(
      and(
        eq(physicalAssessments.studentId, studentId),
        eq(physicalAssessments.gymId, gymId)
      )
    )
    .orderBy(desc(physicalAssessments.assessmentDate));

  // Map to frontend expected format and calculate BMI
  return assessmentsList.map(assessment => {
    const weightKg = assessment.weight || 0;
    const heightCm = assessment.height || 0;
    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

    return {
      ...assessment,
      weightKg,
      heightCm,
      bodyFatPercentage: assessment.bodyFat,
      muscleMassKg: assessment.muscleMass,
      bmi,
      chestCm: assessment.chest,
      waistCm: assessment.waist,
      hipCm: assessment.hips,
      rightArmCm: assessment.rightArm,
      leftArmCm: assessment.leftArm,
      rightThighCm: assessment.rightThigh,
      leftThighCm: assessment.leftThigh,
      rightCalfCm: assessment.rightCalf,
      leftCalfCm: assessment.leftCalf,
    };
  });
}

export async function getLatestAssessment(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return null;

  const [latest] = await db
    .select()
    .from(physicalAssessments)
    .where(
      and(
        eq(physicalAssessments.studentId, studentId),
        eq(physicalAssessments.gymId, gymId)
      )
    )
    .orderBy(desc(physicalAssessments.assessmentDate))
    .limit(1);

  return latest || null;
}

export async function getAllAssessmentsByGym(gymId: number) {
  const db = await getDb();
  if (!db) return [];

  const assessmentsList = await db
    .select({
      id: physicalAssessments.id,
      studentId: physicalAssessments.studentId,
      professorId: physicalAssessments.professorId,
      assessmentDate: physicalAssessments.assessmentDate,
      weight: physicalAssessments.weight,
      height: physicalAssessments.height,
      bodyFat: physicalAssessments.bodyFat,
      muscleMass: physicalAssessments.muscleMass,
      chest: physicalAssessments.chest,
      waist: physicalAssessments.waist,
      hips: physicalAssessments.hips,
      rightArm: physicalAssessments.rightArm,
      leftArm: physicalAssessments.leftArm,
      rightThigh: physicalAssessments.rightThigh,
      leftThigh: physicalAssessments.leftThigh,
      rightCalf: physicalAssessments.rightCalf,
      leftCalf: physicalAssessments.leftCalf,
      tricepsSkinfold: physicalAssessments.tricepsSkinfold,
      subscapularSkinfold: physicalAssessments.subscapularSkinfold,
      pectoralSkinfold: physicalAssessments.pectoralSkinfold,
      midaxillarySkinfold: physicalAssessments.midaxillarySkinfold,
      suprailiacSkinfold: physicalAssessments.suprailiacSkinfold,
      abdominalSkinfold: physicalAssessments.abdominalSkinfold,
      thighSkinfold: physicalAssessments.thighSkinfold,
      flexibility: physicalAssessments.flexibility,
      pushups: physicalAssessments.pushups,
      plankSeconds: physicalAssessments.plankSeconds,
      vo2max: physicalAssessments.vo2max,
      photoFront: physicalAssessments.photoFront,
      photoSide: physicalAssessments.photoSide,
      photoBack: physicalAssessments.photoBack,
      goals: physicalAssessments.goals,
      notes: physicalAssessments.notes,
      nextAssessmentDate: physicalAssessments.nextAssessmentDate,
      createdAt: physicalAssessments.createdAt,
      professorName: users.name,
      studentName: sql<string>`student_user.name`.as('studentName'),
    })
    .from(physicalAssessments)
    .leftJoin(users, eq(physicalAssessments.professorId, users.id))
    .leftJoin(students, eq(physicalAssessments.studentId, students.id))
    .leftJoin(sql`users as student_user`, sql`students.userId = student_user.id`)
    .where(eq(physicalAssessments.gymId, gymId))
    .orderBy(desc(physicalAssessments.assessmentDate));

  // Map to frontend expected format and calculate BMI
  return assessmentsList.map(assessment => {
    const weightKg = assessment.weight || 0;
    const heightCm = assessment.height || 0;
    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

    return {
      ...assessment,
      weightKg,
      heightCm,
      bodyFatPercentage: assessment.bodyFat,
      muscleMassKg: assessment.muscleMass,
      bmi,
      chestCm: assessment.chest,
      waistCm: assessment.waist,
      hipCm: assessment.hips,
      rightArmCm: assessment.rightArm,
      leftArmCm: assessment.leftArm,
      rightThighCm: assessment.rightThigh,
      leftThighCm: assessment.leftThigh,
      rightCalfCm: assessment.rightCalf,
      leftCalfCm: assessment.leftCalf,
    };
  });
}

export async function getAssessmentById(assessmentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return null;

  const [assessment] = await db
    .select({
      id: physicalAssessments.id,
      studentId: physicalAssessments.studentId,
      professorId: physicalAssessments.professorId,
      assessmentDate: physicalAssessments.assessmentDate,
      weight: physicalAssessments.weight,
      height: physicalAssessments.height,
      bodyFat: physicalAssessments.bodyFat,
      muscleMass: physicalAssessments.muscleMass,
      chest: physicalAssessments.chest,
      waist: physicalAssessments.waist,
      hips: physicalAssessments.hips,
      rightArm: physicalAssessments.rightArm,
      leftArm: physicalAssessments.leftArm,
      rightThigh: physicalAssessments.rightThigh,
      leftThigh: physicalAssessments.leftThigh,
      rightCalf: physicalAssessments.rightCalf,
      leftCalf: physicalAssessments.leftCalf,
      tricepsSkinfold: physicalAssessments.tricepsSkinfold,
      subscapularSkinfold: physicalAssessments.subscapularSkinfold,
      pectoralSkinfold: physicalAssessments.pectoralSkinfold,
      midaxillarySkinfold: physicalAssessments.midaxillarySkinfold,
      suprailiacSkinfold: physicalAssessments.suprailiacSkinfold,
      abdominalSkinfold: physicalAssessments.abdominalSkinfold,
      thighSkinfold: physicalAssessments.thighSkinfold,
      flexibility: physicalAssessments.flexibility,
      pushups: physicalAssessments.pushups,
      plankSeconds: physicalAssessments.plankSeconds,
      vo2max: physicalAssessments.vo2max,
      photoFront: physicalAssessments.photoFront,
      photoSide: physicalAssessments.photoSide,
      photoBack: physicalAssessments.photoBack,
      goals: physicalAssessments.goals,
      notes: physicalAssessments.notes,
      nextAssessmentDate: physicalAssessments.nextAssessmentDate,
      createdAt: physicalAssessments.createdAt,
      studentName: sql<string>`student_users.name`.as("studentName"),
      professorName: sql<string>`professor_users.name`.as("professorName"),
    })
    .from(physicalAssessments)
    .leftJoin(students, eq(physicalAssessments.studentId, students.id))
    .leftJoin(
      sql`users AS student_users`,
      sql`student_users.id = ${students.userId}`
    )
    .leftJoin(
      sql`users AS professor_users`,
      sql`professor_users.id = ${physicalAssessments.professorId}`
    )
    .where(
      and(
        eq(physicalAssessments.id, assessmentId),
        eq(physicalAssessments.gymId, gymId)
      )
    )
    .limit(1);

  return assessment || null;
}

export async function updatePhysicalAssessment(
  assessmentId: number,
  gymId: number,
  updates: Partial<InsertPhysicalAssessment>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(physicalAssessments)
    .set(updates)
    .where(
      and(
        eq(physicalAssessments.id, assessmentId),
        eq(physicalAssessments.gymId, gymId)
      )
    );

  return { success: true };
}

export async function deletePhysicalAssessment(assessmentId: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(physicalAssessments)
    .where(
      and(
        eq(physicalAssessments.id, assessmentId),
        eq(physicalAssessments.gymId, gymId)
      )
    );

  return { success: true };
}

export async function getAssessmentProgressData(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return { weightData: [], bodyFatData: [], measurementsData: [] };

  const assessmentsList = await db
    .select({
      date: physicalAssessments.assessmentDate,
      weight: physicalAssessments.weight,
      bodyFat: physicalAssessments.bodyFat,
      chest: physicalAssessments.chest,
      waist: physicalAssessments.waist,
      rightArm: physicalAssessments.rightArm,
      rightThigh: physicalAssessments.rightThigh,
    })
    .from(physicalAssessments)
    .where(
      and(
        eq(physicalAssessments.studentId, studentId),
        eq(physicalAssessments.gymId, gymId)
      )
    )
    .orderBy(physicalAssessments.assessmentDate);

  return {
    weightData: assessmentsList.map((a) => ({
      date: a.date,
      value: a.weight ? Number(a.weight) : null,
    })),
    bodyFatData: assessmentsList.map((a) => ({
      date: a.date,
      value: a.bodyFat ? Number(a.bodyFat) : null,
    })),
    measurementsData: assessmentsList.map((a) => ({
      date: a.date,
      chest: a.chest ? Number(a.chest) : null,
      waist: a.waist ? Number(a.waist) : null,
      arm: a.rightArm ? Number(a.rightArm) : null,
      thigh: a.rightThigh ? Number(a.rightThigh) : null,
    })),
  };
}

// ============ WORKOUT LOGS ============

export async function createWorkoutLog(log: InsertWorkoutLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogs).values(log);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentWorkoutLogs(studentId: number, gymId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select({
      id: workoutLogs.id,
      studentId: workoutLogs.studentId,
      workoutId: workoutLogs.workoutId,
      gymId: workoutLogs.gymId,
      workoutDate: workoutLogs.workoutDate,
      startTime: workoutLogs.startTime,
      endTime: workoutLogs.endTime,
      duration: workoutLogs.duration,
      overallFeeling: workoutLogs.overallFeeling,
      notes: workoutLogs.notes,
      createdAt: workoutLogs.createdAt,
      updatedAt: workoutLogs.updatedAt,
      workoutName: workouts.name,
    })
    .from(workoutLogs)
    .leftJoin(workouts, eq(workoutLogs.workoutId, workouts.id))
    .where(
      and(
        eq(workoutLogs.studentId, studentId),
        eq(workoutLogs.gymId, gymId)
      )
    )
    .orderBy(desc(workoutLogs.workoutDate))
    .limit(limit);

  return logs;
}

export async function getWorkoutLogById(id: number, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: workoutLogs.id,
      studentId: workoutLogs.studentId,
      workoutId: workoutLogs.workoutId,
      gymId: workoutLogs.gymId,
      workoutDate: workoutLogs.workoutDate,
      startTime: workoutLogs.startTime,
      endTime: workoutLogs.endTime,
      duration: workoutLogs.duration,
      overallFeeling: workoutLogs.overallFeeling,
      notes: workoutLogs.notes,
      createdAt: workoutLogs.createdAt,
      updatedAt: workoutLogs.updatedAt,
      workoutName: workouts.name,
      studentName: users.name,
    })
    .from(workoutLogs)
    .leftJoin(workouts, eq(workoutLogs.workoutId, workouts.id))
    .leftJoin(students, eq(workoutLogs.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(
      and(
        eq(workoutLogs.id, id),
        eq(workoutLogs.gymId, gymId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorkoutLog(id: number, gymId: number, updates: Partial<InsertWorkoutLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(workoutLogs)
    .set(updates)
    .where(
      and(
        eq(workoutLogs.id, id),
        eq(workoutLogs.gymId, gymId)
      )
    );

  return { success: true };
}

export async function deleteWorkoutLog(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(workoutLogs)
    .where(
      and(
        eq(workoutLogs.id, id),
        eq(workoutLogs.gymId, gymId)
      )
    );

  return { success: true };
}

// ============ WORKOUT LOG EXERCISES ============

export async function createWorkoutLogExercise(exercise: InsertWorkoutLogExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogExercises).values(exercise);
  return { insertId: Number(result[0].insertId) };
}

export async function getWorkoutLogExercises(workoutLogId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(workoutLogExercises)
    .where(eq(workoutLogExercises.workoutLogId, workoutLogId))
    .orderBy(workoutLogExercises.orderIndex);
}

export async function updateWorkoutLogExercise(id: number, updates: Partial<InsertWorkoutLogExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(workoutLogExercises)
    .set(updates)
    .where(eq(workoutLogExercises.id, id));

  return { success: true };
}

export async function deleteWorkoutLogExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(workoutLogExercises)
    .where(eq(workoutLogExercises.id, id));

  return { success: true };
}

// ============ PERSONAL RECORDS ============

export async function createPersonalRecord(record: InsertPersonalRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(personalRecords).values(record);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentPersonalRecords(studentId: number, gymId: number, exerciseId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      id: personalRecords.id,
      studentId: personalRecords.studentId,
      exerciseId: personalRecords.exerciseId,
      gymId: personalRecords.gymId,
      recordType: personalRecords.recordType,
      weight: personalRecords.weight,
      reps: personalRecords.reps,
      volume: personalRecords.volume,
      workoutLogId: personalRecords.workoutLogId,
      achievedDate: personalRecords.achievedDate,
      notes: personalRecords.notes,
      createdAt: personalRecords.createdAt,
      updatedAt: personalRecords.updatedAt,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(personalRecords)
    .leftJoin(exercises, eq(personalRecords.exerciseId, exercises.id))
    .where(
      and(
        eq(personalRecords.studentId, studentId),
        eq(personalRecords.gymId, gymId),
        exerciseId ? eq(personalRecords.exerciseId, exerciseId) : undefined
      )
    )
    .orderBy(desc(personalRecords.achievedDate));

  return await query;
}

export async function getExerciseCurrentPR(studentId: number, exerciseId: number, recordType: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.studentId, studentId),
        eq(personalRecords.exerciseId, exerciseId),
        eq(personalRecords.recordType, recordType as any)
      )
    )
    .orderBy(desc(personalRecords.achievedDate))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getExerciseProgressData(studentId: number, gymId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return { strengthData: [], volumeData: [] };

  // Get all workout log exercises for this student and exercise
  const logs = await db
    .select({
      date: workoutLogs.workoutDate,
      sets: workoutLogExercises.sets,
    })
    .from(workoutLogExercises)
    .innerJoin(workoutLogs, eq(workoutLogExercises.workoutLogId, workoutLogs.id))
    .where(
      and(
        eq(workoutLogExercises.exerciseId, exerciseId),
        eq(workoutLogs.studentId, studentId),
        eq(workoutLogs.gymId, gymId)
      )
    )
    .orderBy(workoutLogs.workoutDate);

  // Process data for charts
  const strengthData: Array<{ date: Date; maxWeight: number; reps: number }> = [];
  const volumeData: Array<{ date: Date; totalVolume: number }> = [];

  for (const log of logs) {
    const sets = JSON.parse(log.sets as string);
    let maxWeight = 0;
    let maxWeightReps = 0;
    let totalVolume = 0;

    for (const set of sets) {
      if (set.completed && set.weight > maxWeight) {
        maxWeight = set.weight;
        maxWeightReps = set.reps;
      }
      if (set.completed) {
        totalVolume += set.weight * set.reps;
      }
    }

    if (maxWeight > 0) {
      strengthData.push({
        date: log.date!,
        maxWeight,
        reps: maxWeightReps,
      });
    }

    if (totalVolume > 0) {
      volumeData.push({
        date: log.date!,
        totalVolume,
      });
    }
  }

  return { strengthData, volumeData };
}

export async function updatePersonalRecord(id: number, updates: Partial<InsertPersonalRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(personalRecords)
    .set(updates)
    .where(eq(personalRecords.id, id));

  return { success: true };
}

export async function deletePersonalRecord(id: number, gymId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(personalRecords)
    .where(
      and(
        eq(personalRecords.id, id),
        eq(personalRecords.gymId, gymId)
      )
    );

  return { success: true };
}

// ============ ACCESS LOGS ============

export async function createAccessLog(log: InsertAccessLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accessLogs).values(log);
  return { insertId: Number(result[0].insertId) };
}

export async function getStudentAccessLogs(studentId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accessLogs)
    .where(and(eq(accessLogs.studentId, studentId), eq(accessLogs.gymId, gymId)))
    .orderBy(desc(accessLogs.timestamp))
    .limit(10);
}

export async function getStaffAccessLogs(staffId: number, gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accessLogs)
    .where(and(eq(accessLogs.staffId, staffId), eq(accessLogs.gymId, gymId)))
    .orderBy(desc(accessLogs.timestamp))
    .limit(10);
}

export async function getGymAccessLogs(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.query(
    `SELECT al.*,
            u.name as studentName,
            u2.name as staffName
     FROM access_logs al
     LEFT JOIN students s ON al.studentId = s.id
     LEFT JOIN users u ON s.userId = u.id
     LEFT JOIN staff st ON al.staffId = st.id
     LEFT JOIN users u2 ON st.userId = u2.id
     WHERE al.gymId = ?
     ORDER BY al.timestamp DESC
     LIMIT 2000`,
    [gymId]
  );
  await conn.end();
  return rows;
}

// ============ CONTROL ID DEVICES ============

export async function createDevice(device: InsertControlIdDevice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(controlIdDevices).values(device);
  return { insertId: Number(result[0].insertId) };
}

export async function listDevices(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(controlIdDevices).where(eq(controlIdDevices.gymId, gymId));
}

export async function getDeviceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(controlIdDevices).where(eq(controlIdDevices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveDeviceByGym(gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(controlIdDevices)
    .where(and(eq(controlIdDevices.gymId, gymId), eq(controlIdDevices.active, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDevice(id: number, data: Partial<InsertControlIdDevice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(controlIdDevices).set(data).where(eq(controlIdDevices.id, id));
}

export async function deleteDevice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(controlIdDevices).where(eq(controlIdDevices.id, id));
}

// ============ TOLETUS HUB DEVICES ============

export async function createToletusDevice(device: InsertToletusDevice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(toletusDevices).values(device);
  return { insertId: Number(result[0].insertId) };
}

export async function listToletusDevices(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(toletusDevices).where(eq(toletusDevices.gymId, gymId));
}

export async function getToletusDeviceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(toletusDevices).where(eq(toletusDevices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveToletusDevices(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(toletusDevices)
    .where(and(eq(toletusDevices.gymId, gymId), eq(toletusDevices.active, true)));
}

export async function updateToletusDevice(id: number, data: Partial<InsertToletusDevice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(toletusDevices).set(data).where(eq(toletusDevices.id, id));
}

export async function deleteToletusDevice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(toletusDevices).where(eq(toletusDevices.id, id));
}

// ============ GYM TURNSTILE TYPE ============

export async function updateGymTurnstileType(gymId: number, turnstileType: 'control_id' | 'toletus_hub') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gyms).set({ turnstileType }).where(eq(gyms.id, gymId));
}

export async function getGymTurnstileType(gymId: number): Promise<'control_id' | 'toletus_hub'> {
  const db = await getDb();
  if (!db) return 'control_id';
  const result = await db.select({ turnstileType: gyms.turnstileType }).from(gyms).where(eq(gyms.id, gymId)).limit(1);
  return result.length > 0 ? result[0].turnstileType : 'control_id';
}

// ============ PIX WEBHOOKS ============

export async function createPixWebhook(webhook: InsertPixWebhook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pixWebhooks).values(webhook);
  return { insertId: Number(result[0].insertId) };
}

export async function getPaymentByPixTxId(txId: string, gymId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments)
    .where(and(eq(payments.pixTxId, txId), eq(payments.gymId, gymId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStudentMembershipStatus(studentId: number, gymId: number, status: "active" | "inactive" | "suspended" | "blocked") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students)
    .set({ membershipStatus: status, updatedAt: new Date() })
    .where(and(eq(students.id, studentId), eq(students.gymId, gymId)));
}

// ============ PASSWORD RESET ============

export async function createPasswordResetToken(token: InsertPasswordResetToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(passwordResetTokens).values(token);
  return { insertId: Number(result[0].insertId) };
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markTokenAsUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}

// ============ EXPENSES (CONTAS A PAGAR) ============

import mysql from 'mysql2/promise';

export async function getConnection() {
  // Parse DATABASE_URL to get credentials
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  return await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });
}

export async function createExpense(expense: {
  description: string;
  supplierId: number;
  categoryId?: number;
  costCenterId?: number;
  amountInCents: number;
  dueDate: string;
  paymentMethod?: string | null;
  notes?: string;
  gymId: number;
  createdBy?: number;
}) {
  const conn = await getConnection();
  const [result] = await conn.query(
    `INSERT INTO expenses (description, supplierId, categoryId, costCenterId, amountInCents, dueDate, paymentMethod, notes, gymId, createdBy, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [expense.description, expense.supplierId, expense.categoryId || null, expense.costCenterId || null, expense.amountInCents, expense.dueDate, expense.paymentMethod || null, expense.notes || null, expense.gymId, expense.createdBy || null]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function getExpensesByGym(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.query(
    `SELECT e.*,
            s.name as supplierName,
            c.name as categoryName,
            c.color as categoryColor,
            cc.name as costCenterName,
            cc.code as costCenterCode
     FROM expenses e
     LEFT JOIN suppliers s ON e.supplierId = s.id
     LEFT JOIN categories c ON e.categoryId = c.id
     LEFT JOIN cost_centers cc ON e.costCenterId = cc.id
     WHERE e.gymId = ?
     ORDER BY e.dueDate DESC`,
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function getExpenseById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.query(
    `SELECT e.*,
            s.name as supplierName,
            c.name as categoryName,
            c.color as categoryColor
     FROM expenses e
     LEFT JOIN suppliers s ON e.supplierId = s.id
     LEFT JOIN categories c ON e.categoryId = c.id
     WHERE e.id = ? AND e.gymId = ?`,
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function updateExpense(id: number, gymId: number, updates: {
  description?: string;
  supplier?: string;
  category?: string;
  amountInCents?: number;
  dueDate?: string;
  notes?: string;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (updates.description) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.supplier) { fields.push('supplier = ?'); values.push(updates.supplier); }
  if (updates.category) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.amountInCents) { fields.push('amountInCents = ?'); values.push(updates.amountInCents); }
  if (updates.dueDate) { fields.push('dueDate = ?'); values.push(updates.dueDate); }
  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }

  if (fields.length === 0) {
    await conn.end();
    return;
  }

  values.push(id, gymId);
  await conn.query(
    `UPDATE expenses SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND gymId = ?`,
    values
  );
  await conn.end();
}

export async function markExpenseAsPaid(id: number, gymId: number, paymentMethodId: number, paidDate?: string) {
  const conn = await getConnection();

  // Buscar o nome do método de pagamento
  const [methods]: any = await conn.query(
    'SELECT name FROM payment_methods WHERE id = ?',
    [paymentMethodId]
  );
  const paymentMethodName = methods[0]?.name || 'N/A';

  await conn.query(
    `UPDATE expenses SET status = 'paid', paymentDate = ?, paymentMethod = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND gymId = ?`,
    [paidDate || new Date(), paymentMethodName, id, gymId]
  );
  await conn.end();
}

export async function deleteExpense(id: number, gymId: number) {
  const conn = await getConnection();
  await conn.query('DELETE FROM expenses WHERE id = ? AND gymId = ?', [id, gymId]);
  await conn.end();
}

// ============ PAYMENT METHODS (FORMAS DE PAGAMENTO) ============

export async function getPaymentMethods(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.query('SELECT * FROM payment_methods WHERE gymId = ? AND active = TRUE ORDER BY name', [gymId]);
  await conn.end();
  return rows;
}

export async function createPaymentMethod(method: {
  gymId: number;
  name: string;
  type: string;
  description?: string;
}) {
  const conn = await getConnection();
  const [result] = await conn.query(
    'INSERT INTO payment_methods (gymId, name, type, description) VALUES (?, ?, ?, ?)',
    [method.gymId, method.name, method.type, method.description || null]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function updatePaymentMethod(id: number, method: {
  name?: string;
  type?: string;
  description?: string;
  active?: boolean;
}) {
  const conn = await getConnection();
  const updates: string[] = [];
  const values: any[] = [];

  if (method.name !== undefined) {
    updates.push('name = ?');
    values.push(method.name);
  }
  if (method.type !== undefined) {
    updates.push('type = ?');
    values.push(method.type);
  }
  if (method.description !== undefined) {
    updates.push('description = ?');
    values.push(method.description);
  }
  if (method.active !== undefined) {
    updates.push('active = ?');
    values.push(method.active);
  }

  if (updates.length === 0) {
    await conn.end();
    return;
  }

  values.push(id);
  await conn.query(
    `UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  await conn.end();
}

// ============ LEADS (CRM) ============

export async function createLead(lead: {
  name: string;
  email?: string;
  phone: string;
  source: string;
  notes?: string;
  gymId: number;
  assignedTo?: number;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'INSERT INTO leads (name, email, phone, source, notes, gymId, assignedTo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [lead.name, lead.email || null, lead.phone, lead.source, lead.notes || null, lead.gymId, lead.assignedTo || null, 'new']
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function getLeadsByGym(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT l.*, u.name as assignedToName
     FROM leads l
     LEFT JOIN users u ON l.assignedTo = u.id
     WHERE l.gymId = ?
     ORDER BY l.createdAt DESC`,
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function getLeadById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT l.*, u.name as assignedToName
     FROM leads l
     LEFT JOIN users u ON l.assignedTo = u.id
     WHERE l.id = ? AND l.gymId = ?`,
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0] || null;
}

export async function updateLead(id: number, gymId: number, updates: {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  assignedTo?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.source !== undefined) { fields.push('source = ?'); values.push(updates.source); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
  if (updates.assignedTo !== undefined) { fields.push('assignedTo = ?'); values.push(updates.assignedTo); }
  if (updates.lastContactDate !== undefined) { fields.push('lastContactDate = ?'); values.push(updates.lastContactDate); }
  if (updates.nextFollowUpDate !== undefined) { fields.push('nextFollowUpDate = ?'); values.push(updates.nextFollowUpDate); }

  if (fields.length === 0) {
    await conn.end();
    return { affectedRows: 0 };
  }

  values.push(id, gymId);
  const [result] = await conn.execute(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND gymId = ?`,
    values
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

export async function deleteLead(id: number, gymId: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'DELETE FROM leads WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

// ============ CLASS SCHEDULES ============

export async function createClassSchedule(schedule: {
  name: string;
  type: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  professorId?: number;
  gymId: number;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'INSERT INTO class_schedules (name, type, dayOfWeek, startTime, durationMinutes, capacity, professorId, gymId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [schedule.name, schedule.type, schedule.dayOfWeek, schedule.startTime, schedule.durationMinutes, schedule.capacity, schedule.professorId || null, schedule.gymId]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function getClassSchedulesByGym(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT cs.*, u.name as professorName,
     (
       (SELECT COUNT(*) FROM class_bookings cb WHERE cb.scheduleId = cs.id AND cb.status IN ('confirmed', 'attended')) +
       (SELECT COUNT(*) FROM visitor_bookings vb WHERE vb.scheduleId = cs.id AND vb.status IN ('confirmed', 'attended'))
     ) as enrolledCount
     FROM class_schedules cs
     LEFT JOIN users u ON cs.professorId = u.id
     WHERE cs.gymId = ? AND cs.active = TRUE
     ORDER BY
       FIELD(cs.dayOfWeek, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
       cs.startTime`,
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function getClassScheduleById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT cs.*, u.name as professorName,
     (
       (SELECT COUNT(*) FROM class_bookings cb WHERE cb.scheduleId = cs.id AND cb.status IN ('confirmed', 'attended')) +
       (SELECT COUNT(*) FROM visitor_bookings vb WHERE vb.scheduleId = cs.id AND vb.status IN ('confirmed', 'attended'))
     ) as enrolledCount
     FROM class_schedules cs
     LEFT JOIN users u ON cs.professorId = u.id
     WHERE cs.id = ? AND cs.gymId = ?`,
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0] || null;
}

export async function updateClassSchedule(id: number, gymId: number, updates: {
  name?: string;
  type?: string;
  dayOfWeek?: string;
  startTime?: string;
  durationMinutes?: number;
  capacity?: number;
  professorId?: number;
  active?: boolean;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.dayOfWeek !== undefined) { fields.push('dayOfWeek = ?'); values.push(updates.dayOfWeek); }
  if (updates.startTime !== undefined) { fields.push('startTime = ?'); values.push(updates.startTime); }
  if (updates.durationMinutes !== undefined) { fields.push('durationMinutes = ?'); values.push(updates.durationMinutes); }
  if (updates.capacity !== undefined) { fields.push('capacity = ?'); values.push(updates.capacity); }
  if (updates.professorId !== undefined) { fields.push('professorId = ?'); values.push(updates.professorId); }
  if (updates.active !== undefined) { fields.push('active = ?'); values.push(updates.active); }

  if (fields.length === 0) {
    await conn.end();
    return { affectedRows: 0 };
  }

  values.push(id, gymId);
  const [result] = await conn.execute(
    `UPDATE class_schedules SET ${fields.join(', ')} WHERE id = ? AND gymId = ?`,
    values
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

export async function deleteClassSchedule(id: number, gymId: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE class_schedules SET active = FALSE WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

// ============ CLASS BOOKINGS (Reservas/Agendamentos) ============

export async function createClassBooking(booking: {
  scheduleId: number;
  studentId: number;
  bookingDate: string;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'INSERT INTO class_bookings (scheduleId, studentId, bookingDate, status) VALUES (?, ?, ?, ?)',
    [booking.scheduleId, booking.studentId, booking.bookingDate, 'confirmed']
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function getClassBookingsBySchedule(scheduleId: number, bookingDate?: string) {
  const conn = await getConnection();
  let query = `
    SELECT cb.*,
           s.id as studentTableId,
           u.name as studentName,
           u.email as studentEmail,
           s.phone as studentPhone
    FROM class_bookings cb
    INNER JOIN users u ON cb.studentId = u.id
    LEFT JOIN students s ON s.userId = u.id
    WHERE cb.scheduleId = ?
  `;
  const params: any[] = [scheduleId];

  if (bookingDate) {
    query += ' AND cb.bookingDate = ?';
    params.push(bookingDate);
  }

  query += ' ORDER BY cb.bookingDate DESC, u.name';

  const [rows] = await conn.execute(query, params);
  await conn.end();
  return rows;
}

export async function getClassBookingsByStudent(studentId: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT cb.*,
            cs.name as className,
            cs.type as classType,
            cs.dayOfWeek,
            cs.startTime,
            cs.durationMinutes,
            u.name as professorName
     FROM class_bookings cb
     INNER JOIN class_schedules cs ON cb.scheduleId = cs.id
     LEFT JOIN users u ON cs.professorId = u.id
     WHERE cb.studentId = ? AND cs.gymId = ?
     ORDER BY cb.bookingDate DESC, cs.startTime`,
    [studentId, gymId]
  );
  await conn.end();
  return rows;
}

export async function getUpcomingClassBookings(gymId: number, limit: number = 50) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT cb.*,
            cs.name as className,
            cs.type as classType,
            cs.startTime,
            cs.durationMinutes,
            u1.name as studentName,
            u2.name as professorName
     FROM class_bookings cb
     INNER JOIN class_schedules cs ON cb.scheduleId = cs.id
     INNER JOIN users u1 ON cb.studentId = u1.id
     LEFT JOIN users u2 ON cs.professorId = u2.id
     WHERE cs.gymId = ? AND cb.bookingDate >= CURDATE() AND cb.status != 'cancelled'
     ORDER BY cb.bookingDate, cs.startTime
     LIMIT ?`,
    [gymId, limit]
  );
  await conn.end();
  return rows;
}

export async function updateClassBookingStatus(id: number, status: 'confirmed' | 'cancelled' | 'attended' | 'no_show') {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE class_bookings SET status = ? WHERE id = ?',
    [status, id]
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

export async function cancelClassBooking(id: number, studentId: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE class_bookings SET status = ? WHERE id = ? AND studentId = ?',
    ['cancelled', id, studentId]
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

export async function checkBookingExists(scheduleId: number, studentId: number, bookingDate: string) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT id, status FROM class_bookings WHERE scheduleId = ? AND studentId = ? AND bookingDate = ?',
    [scheduleId, studentId, bookingDate]
  );
  await conn.end();
  return (rows as any[])[0] || null;
}

export async function getBookingCountForDate(scheduleId: number, bookingDate: string) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT
       (SELECT COUNT(*) FROM class_bookings WHERE scheduleId = ? AND bookingDate = ? AND status IN ('confirmed', 'attended')) +
       (SELECT COUNT(*) FROM visitor_bookings WHERE scheduleId = ? AND bookingDate = ? AND status IN ('confirmed', 'attended'))
     as count`,
    [scheduleId, bookingDate, scheduleId, bookingDate]
  );
  await conn.end();
  return ((rows as any[])[0]?.count || 0);
}

// ============ VISITOR BOOKINGS (Agendamentos de Visitantes) ============

export async function createVisitorBooking(booking: {
  gymId: number;
  scheduleId: number;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  bookingDate: string;
  notes?: string;
  leadId?: number;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO visitor_bookings
    (gymId, scheduleId, visitorName, visitorPhone, visitorEmail, bookingDate, notes, leadId, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [
      booking.gymId,
      booking.scheduleId,
      booking.visitorName,
      booking.visitorPhone,
      booking.visitorEmail || null,
      booking.bookingDate,
      booking.notes || null,
      booking.leadId || null,
    ]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function getVisitorBookingsBySchedule(scheduleId: number, bookingDate?: string) {
  const conn = await getConnection();
  let query = `
    SELECT vb.*,
           cs.name as className,
           cs.startTime
    FROM visitor_bookings vb
    INNER JOIN class_schedules cs ON vb.scheduleId = cs.id
    WHERE vb.scheduleId = ?
  `;
  const params: any[] = [scheduleId];

  if (bookingDate) {
    query += ' AND vb.bookingDate = ?';
    params.push(bookingDate);
  }

  query += ' ORDER BY vb.bookingDate DESC, vb.visitorName';

  const [rows] = await conn.execute(query, params);
  await conn.end();
  return rows;
}

export async function updateVisitorBookingStatus(
  id: number,
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show' | 'converted'
) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE visitor_bookings SET status = ? WHERE id = ?',
    [status, id]
  );
  await conn.end();
  return { affectedRows: (result as any).affectedRows };
}

export async function getUpcomingVisitorBookings() {
  const conn = await getConnection();
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [rows] = await conn.execute(
    `SELECT vb.*,
            cs.name as className,
            cs.startTime
     FROM visitor_bookings vb
     INNER JOIN class_schedules cs ON vb.scheduleId = cs.id
     WHERE vb.bookingDate BETWEEN ? AND ?
       AND vb.status IN ('confirmed', 'attended')
     ORDER BY vb.bookingDate, cs.startTime`,
    [today, futureDate]
  );
  await conn.end();
  return rows;
}

// ============ CATEGORIES ============
export async function listCategories(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM categories WHERE gymId = ? ORDER BY type, name',
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function createCategory(data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'INSERT INTO categories (gymId, name, description, type, color, active) VALUES (?, ?, ?, ?, ?, ?)',
    [data.gymId, data.name, data.description, data.type, data.color, data.active]
  );
  await conn.end();
  return result;
}

export async function updateCategory(id: number, data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE categories SET name = ?, description = ?, type = ?, color = ? WHERE id = ?',
    [data.name, data.description, data.type, data.color, id]
  );
  await conn.end();
  return result;
}

export async function deleteCategory(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute('DELETE FROM categories WHERE id = ?', [id]);
  await conn.end();
  return result;
}

export async function toggleCategoryActive(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE categories SET active = NOT active WHERE id = ?',
    [id]
  );
  await conn.end();
  return result;
}

// ============ SUPPLIERS ============
export async function listSuppliers(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM suppliers WHERE gymId = ? ORDER BY name',
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function getSupplierById(id: number) {
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    'SELECT * FROM suppliers WHERE id = ?',
    [id]
  );
  await conn.end();
  return rows[0];
}

export async function createSupplier(data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO suppliers (
      gymId, name, tradeName, cnpjCpf, email, phone, cellphone, website,
      address, number, complement, neighborhood, city, state, zipCode,
      bank, bankAgency, bankAccount, category, notes, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.gymId, data.name, data.tradeName, data.cnpjCpf, data.email,
      data.phone, data.cellphone, data.website, data.address, data.number,
      data.complement, data.neighborhood, data.city, data.state, data.zipCode,
      data.bank, data.bankAgency, data.bankAccount, data.category, data.notes, data.active
    ]
  );
  await conn.end();
  return result;
}

export async function updateSupplier(id: number, data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `UPDATE suppliers SET
      name = ?, tradeName = ?, cnpjCpf = ?, email = ?, phone = ?, cellphone = ?,
      website = ?, address = ?, number = ?, complement = ?, neighborhood = ?,
      city = ?, state = ?, zipCode = ?, bank = ?, bankAgency = ?, bankAccount = ?,
      category = ?, notes = ?
    WHERE id = ?`,
    [
      data.name, data.tradeName, data.cnpjCpf, data.email, data.phone, data.cellphone,
      data.website, data.address, data.number, data.complement, data.neighborhood,
      data.city, data.state, data.zipCode, data.bank, data.bankAgency, data.bankAccount,
      data.category, data.notes, id
    ]
  );
  await conn.end();
  return result;
}

export async function deleteSupplier(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute('DELETE FROM suppliers WHERE id = ?', [id]);
  await conn.end();
  return result;
}

export async function toggleSupplierActive(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE suppliers SET active = NOT active WHERE id = ?',
    [id]
  );
  await conn.end();
  return result;
}

// ============ COST CENTERS ============
export async function listCostCenters(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM cost_centers WHERE gymId = ? ORDER BY code',
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function createCostCenter(data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'INSERT INTO cost_centers (gymId, name, code, description, active) VALUES (?, ?, ?, ?, ?)',
    [data.gymId, data.name, data.code, data.description, data.active]
  );
  await conn.end();
  return result;
}

export async function updateCostCenter(id: number, data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE cost_centers SET name = ?, code = ?, description = ? WHERE id = ?',
    [data.name, data.code, data.description, id]
  );
  await conn.end();
  return result;
}

export async function deleteCostCenter(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute('DELETE FROM cost_centers WHERE id = ?', [id]);
  await conn.end();
  return result;
}

export async function toggleCostCenterActive(id: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    'UPDATE cost_centers SET active = NOT active WHERE id = ?',
    [id]
  );
  await conn.end();
  return result;
}


// ============ GYM SETTINGS (Configurações da Academia) ============
export async function getGymSettings(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM gym_settings WHERE gymId = ? LIMIT 1',
    [gymId]
  );
  await conn.end();
  return (rows as any[])[0] || null;
}

export async function updateGymSettings(gymId: number, settings: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `UPDATE gym_settings SET
      daysToBlockAfterDue = ?,
      blockOnExpiredExam = ?,
      examValidityDays = ?,
      minimumAge = ?,
      daysToStartInterest = ?,
      interestRatePerMonth = ?,
      lateFeePercentage = ?,
      allowInstallments = ?,
      maxInstallments = ?,
      minimumInstallmentValue = ?,
      smtpHost = ?,
      smtpPort = ?,
      smtpUser = ?,
      smtpPassword = ?,
      smtpFromEmail = ?,
      smtpFromName = ?,
      smtpUseTls = ?,
      smtpUseSsl = ?
    WHERE gymId = ?`,
    [
      settings.daysToBlockAfterDue,
      settings.blockOnExpiredExam,
      settings.examValidityDays,
      settings.minimumAge,
      settings.daysToStartInterest,
      settings.interestRatePerMonth,
      settings.lateFeePercentage,
      settings.allowInstallments,
      settings.maxInstallments,
      settings.minimumInstallmentValue,
      settings.smtpHost || null,
      settings.smtpPort || 587,
      settings.smtpUser || null,
      settings.smtpPassword || null,
      settings.smtpFromEmail || null,
      settings.smtpFromName || 'Academia',
      settings.smtpUseTls ?? true,
      settings.smtpUseSsl ?? false,
      gymId
    ]
  );
  await conn.end();
  return result;
}

export async function createGymSettings(gymId: number) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO gym_settings (
      gymId, daysToBlockAfterDue, blockOnExpiredExam, examValidityDays, minimumAge,
      daysToStartInterest, interestRatePerMonth, lateFeePercentage,
      allowInstallments, maxInstallments, minimumInstallmentValue
    ) VALUES (?, 7, 1, 90, 16, 1, 2.00, 2.00, 1, 6, 5000)`,
    [gymId]
  );
  await conn.end();
  return result;
}

// ============ INSTALLMENTS ============

export async function createInstallmentPayments(
  gymId: number,
  studentId: number,
  originalPaymentIds: number[],
  numInstallments: number,
  totalAmount: number,
  interestForgiven: boolean,
  firstDueDate: Date
) {
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // Get subscriptionId from the first original payment
    const [originalPayments] = await conn.execute(
      `SELECT subscriptionId FROM payments WHERE id = ? LIMIT 1`,
      [originalPaymentIds[0]]
    );

    if (!originalPayments || (originalPayments as any[]).length === 0) {
      throw new Error('Pagamento original não encontrado');
    }

    const subscriptionId = (originalPayments as any[])[0].subscriptionId;

    // Generate a unique installment plan ID
    const installmentPlanId = `INST-${Date.now()}-${studentId}`;

    // Calculate installment amount
    const installmentAmount = Math.ceil(totalAmount / numInstallments);

    // Create installment payments
    const createdPayments = [];
    for (let i = 0; i < numInstallments; i++) {
      // Calculate due date for this installment (monthly)
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Adjust the amount for the last installment to account for rounding
      const amount = i === numInstallments - 1
        ? totalAmount - (installmentAmount * (numInstallments - 1))
        : installmentAmount;

      const [result] = await conn.execute(
        `INSERT INTO payments (
          studentId,
          gymId,
          subscriptionId,
          amountInCents,
          dueDate,
          status,
          paymentMethod,
          isInstallment,
          installmentPlanId,
          installmentNumber,
          totalInstallments,
          originalPaymentIds,
          interestForgiven
        ) VALUES (?, ?, ?, ?, ?, 'pending', 'pending', true, ?, ?, ?, ?, ?)`,
        [
          studentId,
          gymId,
          subscriptionId,
          amount,
          dueDate.toISOString().split('T')[0],
          installmentPlanId,
          i + 1,
          numInstallments,
          JSON.stringify(originalPaymentIds),
          interestForgiven
        ]
      );

      createdPayments.push({
        id: (result as any).insertId,
        installmentNumber: i + 1,
        amount,
        dueDate
      });
    }

    // Mark original payments as "installmented" (cancelled)
    if (originalPaymentIds.length > 0) {
      const placeholders = originalPaymentIds.map(() => '?').join(',');
      await conn.execute(
        `UPDATE payments
         SET status = 'cancelled'
         WHERE id IN (${placeholders}) AND gymId = ?`,
        [...originalPaymentIds, gymId]
      );
    }

    await conn.commit();
    await conn.end();

    return {
      success: true,
      installmentPlanId,
      payments: createdPayments
    };
  } catch (error) {
    await conn.rollback();
    await conn.end();
    throw error;
  }
}

export async function getInstallmentsByPlanId(planId: string, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT * FROM payments
     WHERE installmentPlanId = ? AND gymId = ?
     ORDER BY installmentNumber ASC`,
    [planId, gymId]
  );
  await conn.end();
  return rows;
}

export async function getInstallmentsByStudent(studentId: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT * FROM payments
     WHERE studentId = ? AND gymId = ? AND isInstallment = true
     ORDER BY installmentPlanId DESC, installmentNumber ASC`,
    [studentId, gymId]
  );
  await conn.end();
  return rows;
}

export async function getMedicalExamsByStudent(studentId: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT * FROM medical_exams
     WHERE studentId = ? AND gymId = ?
     ORDER BY examDate DESC`,
    [studentId, gymId]
  );
  await conn.end();
  return rows;
}

// ============ BANK ACCOUNTS ============

export async function listBankAccounts(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM bank_accounts WHERE gymId = ? AND active = TRUE ORDER BY titular_nome',
    [gymId]
  );
  await conn.end();
  return rows;
}

export async function getBankAccountById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM bank_accounts WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function getActivePixBankAccount(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT * FROM bank_accounts
     WHERE gymId = ? AND pix_ativo IN ('S', 's', '1', 'SIM', 'sim')
     LIMIT 1`,
    [gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function createBankAccount(data: any) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO bank_accounts (
      gymId, titular_nome, banco, agencia_numero, agencia_dv,
      conta_numero, conta_dv, pix_ativo, pix_provedor, pix_scope, pix_chave,
      pix_tipo_chave, pix_tipo_ambiente, pix_client_id, pix_client_secret,
      pix_certificado_path, pix_chave_privada_path, pix_senha_certificado,
      pix_versao_api, pix_timeout_ms, pix_token_expiracao, pix_tipo_autenticacao,
      pix_url_base, pix_url_token, mp_access_token, mp_public_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.gymId, data.titularNome, data.banco, data.agenciaNumero, data.agenciaDv,
      data.contaNumero, data.contaDv, data.pixAtivo || 'N', data.pixProvedor || 'sicoob',
      data.pixScope || 'cob.write cob.read pix.read pix.write',
      data.pixChave, data.pixTipoChave, data.pixTipoAmbiente, data.pixClientId, data.pixClientSecret,
      data.pixCertificadoPath, data.pixChavePrivadaPath, data.pixSenhaCertificado,
      data.pixVersaoApi, data.pixTimeoutMs || 90000, data.pixTokenExpiracao || 3600,
      data.pixTipoAutenticacao || 'N', data.pixUrlBase, data.pixUrlToken,
      data.mpAccessToken, data.mpPublicKey
    ]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function updateBankAccount(id: number, gymId: number, data: any) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (data.titularNome !== undefined) { fields.push('titular_nome = ?'); values.push(data.titularNome); }
  if (data.banco !== undefined) { fields.push('banco = ?'); values.push(data.banco); }
  if (data.agenciaNumero !== undefined) { fields.push('agencia_numero = ?'); values.push(data.agenciaNumero); }
  if (data.agenciaDv !== undefined) { fields.push('agencia_dv = ?'); values.push(data.agenciaDv); }
  if (data.contaNumero !== undefined) { fields.push('conta_numero = ?'); values.push(data.contaNumero); }
  if (data.contaDv !== undefined) { fields.push('conta_dv = ?'); values.push(data.contaDv); }
  if (data.pixAtivo !== undefined) { fields.push('pix_ativo = ?'); values.push(data.pixAtivo); }
  if (data.pixProvedor !== undefined) { fields.push('pix_provedor = ?'); values.push(data.pixProvedor); }
  if (data.pixScope !== undefined) { fields.push('pix_scope = ?'); values.push(data.pixScope); }
  if (data.pixChave !== undefined) { fields.push('pix_chave = ?'); values.push(data.pixChave); }
  if (data.pixTipoChave !== undefined) { fields.push('pix_tipo_chave = ?'); values.push(data.pixTipoChave); }
  if (data.pixTipoAmbiente !== undefined) { fields.push('pix_tipo_ambiente = ?'); values.push(data.pixTipoAmbiente); }
  if (data.pixClientId !== undefined) { fields.push('pix_client_id = ?'); values.push(data.pixClientId); }
  if (data.pixClientSecret !== undefined) { fields.push('pix_client_secret = ?'); values.push(data.pixClientSecret); }
  if (data.pixCertificadoPath !== undefined) { fields.push('pix_certificado_path = ?'); values.push(data.pixCertificadoPath); }
  if (data.pixChavePrivadaPath !== undefined) { fields.push('pix_chave_privada_path = ?'); values.push(data.pixChavePrivadaPath); }
  if (data.pixSenhaCertificado !== undefined) { fields.push('pix_senha_certificado = ?'); values.push(data.pixSenhaCertificado); }
  if (data.pixVersaoApi !== undefined) { fields.push('pix_versao_api = ?'); values.push(data.pixVersaoApi); }
  if (data.pixTimeoutMs !== undefined) { fields.push('pix_timeout_ms = ?'); values.push(data.pixTimeoutMs); }
  if (data.pixTokenExpiracao !== undefined) { fields.push('pix_token_expiracao = ?'); values.push(data.pixTokenExpiracao); }
  if (data.pixTipoAutenticacao !== undefined) { fields.push('pix_tipo_autenticacao = ?'); values.push(data.pixTipoAutenticacao); }
  if (data.pixUrlBase !== undefined) { fields.push('pix_url_base = ?'); values.push(data.pixUrlBase); }
  if (data.pixUrlToken !== undefined) { fields.push('pix_url_token = ?'); values.push(data.pixUrlToken); }
  if (data.mpAccessToken !== undefined) { fields.push('mp_access_token = ?'); values.push(data.mpAccessToken); }
  if (data.mpPublicKey !== undefined) { fields.push('mp_public_key = ?'); values.push(data.mpPublicKey); }

  if (fields.length === 0) {
    await conn.end();
    return;
  }

  values.push(id, gymId);
  await conn.execute(
    `UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = ? AND gymId = ?`,
    values
  );
  await conn.end();
}

export async function deleteBankAccount(id: number, gymId: number) {
  const conn = await getConnection();
  await conn.execute(
    'UPDATE bank_accounts SET active = FALSE WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
}

// ============ WELLHUB INTEGRATION ============

/**
 * Wellhub Settings
 */
export async function getWellhubSettings(gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM wellhub_settings WHERE gymId = ? AND isActive = TRUE LIMIT 1',
    [gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function createWellhubSettings(data: {
  gymId: number;
  apiToken: string;
  wellhubGymId: string;
  environment?: 'sandbox' | 'production';
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO wellhub_settings (gymId, apiToken, wellhubGymId, environment, isActive)
     VALUES (?, ?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       apiToken = VALUES(apiToken),
       wellhubGymId = VALUES(wellhubGymId),
       environment = VALUES(environment),
       isActive = TRUE,
       updatedAt = CURRENT_TIMESTAMP`,
    [data.gymId, data.apiToken, data.wellhubGymId, data.environment || 'sandbox']
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function updateWellhubSettings(gymId: number, data: {
  apiToken?: string;
  wellhubGymId?: string;
  environment?: 'sandbox' | 'production';
  isActive?: boolean;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (data.apiToken !== undefined) { fields.push('apiToken = ?'); values.push(data.apiToken); }
  if (data.wellhubGymId !== undefined) { fields.push('wellhubGymId = ?'); values.push(data.wellhubGymId); }
  if (data.environment !== undefined) { fields.push('environment = ?'); values.push(data.environment); }
  if (data.isActive !== undefined) { fields.push('isActive = ?'); values.push(data.isActive); }

  if (fields.length === 0) {
    await conn.end();
    return;
  }

  values.push(gymId);
  await conn.execute(
    `UPDATE wellhub_settings SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE gymId = ?`,
    values
  );
  await conn.end();
}

/**
 * Wellhub Members
 */
export async function listWellhubMembers(gymId: number, filters?: {
  status?: 'active' | 'inactive' | 'blocked';
  search?: string;
}) {
  const conn = await getConnection();
  let query = 'SELECT * FROM wellhub_members WHERE gymId = ?';
  const params: any[] = [gymId];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.search) {
    query += ' AND (wellhubId LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY lastCheckIn DESC, name ASC';

  const [rows] = await conn.execute(query, params);
  await conn.end();
  return rows;
}

export async function getWellhubMemberById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM wellhub_members WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function getWellhubMemberByWellhubId(wellhubId: string, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    'SELECT * FROM wellhub_members WHERE wellhubId = ? AND gymId = ?',
    [wellhubId, gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

export async function createWellhubMember(data: {
  gymId: number;
  wellhubId: string;
  name?: string;
  email?: string;
  phone?: string;
  customCode?: string;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO wellhub_members (gymId, wellhubId, name, email, phone, customCode, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    [data.gymId, data.wellhubId, data.name || null, data.email || null, data.phone || null, data.customCode || null]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function updateWellhubMember(id: number, gymId: number, data: {
  name?: string;
  email?: string;
  phone?: string;
  customCode?: string;
  status?: 'active' | 'inactive' | 'blocked';
  faceImageUrl?: string;
  faceEnrolled?: boolean;
  controlIdUserId?: number;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.customCode !== undefined) { fields.push('customCode = ?'); values.push(data.customCode); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.faceImageUrl !== undefined) { fields.push('faceImageUrl = ?'); values.push(data.faceImageUrl); }
  if (data.faceEnrolled !== undefined) { fields.push('faceEnrolled = ?'); values.push(data.faceEnrolled); }
  if (data.controlIdUserId !== undefined) { fields.push('controlIdUserId = ?'); values.push(data.controlIdUserId); }

  if (fields.length === 0) {
    await conn.end();
    return;
  }

  values.push(id, gymId);
  await conn.execute(
    `UPDATE wellhub_members SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND gymId = ?`,
    values
  );
  await conn.end();
}

export async function deleteWellhubMember(id: number, gymId: number) {
  const conn = await getConnection();
  await conn.execute(
    'UPDATE wellhub_members SET status = "inactive" WHERE id = ? AND gymId = ?',
    [id, gymId]
  );
  await conn.end();
}

/**
 * Wellhub Check-ins
 */
export async function createWellhubCheckIn(data: {
  wellhubMemberId: number;
  gymId: number;
  wellhubId: string;
  method?: 'app' | 'custom_code' | 'manual';
  createdBy?: number;
}) {
  const conn = await getConnection();
  const [result] = await conn.execute(
    `INSERT INTO wellhub_checkins (wellhubMemberId, gymId, wellhubId, method, createdBy, validationStatus)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [data.wellhubMemberId, data.gymId, data.wellhubId, data.method || 'app', data.createdBy || null]
  );
  await conn.end();
  return { insertId: (result as any).insertId };
}

export async function updateWellhubCheckIn(id: number, data: {
  validatedAt?: Date;
  validationStatus?: 'pending' | 'validated' | 'rejected' | 'expired';
  validationResponse?: string;
}) {
  const conn = await getConnection();
  const fields = [];
  const values = [];

  if (data.validatedAt !== undefined) { fields.push('validatedAt = ?'); values.push(data.validatedAt); }
  if (data.validationStatus !== undefined) { fields.push('validationStatus = ?'); values.push(data.validationStatus); }
  if (data.validationResponse !== undefined) { fields.push('validationResponse = ?'); values.push(data.validationResponse); }

  if (fields.length === 0) {
    await conn.end();
    return;
  }

  values.push(id);
  await conn.execute(
    `UPDATE wellhub_checkins SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  await conn.end();
}

export async function updateWellhubMemberCheckInStats(wellhubMemberId: number) {
  const conn = await getConnection();

  // Get first visit and last check-in times
  const [stats] = await conn.execute(
    `SELECT
       MIN(checkInTime) as firstVisit,
       MAX(checkInTime) as lastCheckIn,
       COUNT(*) as totalVisits
     FROM wellhub_checkins
     WHERE wellhubMemberId = ? AND validationStatus = 'validated'`,
    [wellhubMemberId]
  );

  const statsData = (stats as any[])[0];

  await conn.execute(
    `UPDATE wellhub_members
     SET firstVisit = ?, lastCheckIn = ?, totalVisits = ?
     WHERE id = ?`,
    [statsData.firstVisit, statsData.lastCheckIn, statsData.totalVisits || 0, wellhubMemberId]
  );

  await conn.end();
}

export async function listWellhubCheckIns(gymId: number, filters?: {
  wellhubMemberId?: number;
  validationStatus?: 'pending' | 'validated' | 'rejected' | 'expired';
  startDate?: Date;
  endDate?: Date;
}) {
  const conn = await getConnection();
  let query = `
    SELECT c.*, m.name as memberName, m.wellhubId, m.email
    FROM wellhub_checkins c
    LEFT JOIN wellhub_members m ON c.wellhubMemberId = m.id
    WHERE c.gymId = ?
  `;
  const params: any[] = [gymId];

  if (filters?.wellhubMemberId) {
    query += ' AND c.wellhubMemberId = ?';
    params.push(filters.wellhubMemberId);
  }

  if (filters?.validationStatus) {
    query += ' AND c.validationStatus = ?';
    params.push(filters.validationStatus);
  }

  if (filters?.startDate) {
    query += ' AND c.checkInTime >= ?';
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ' AND c.checkInTime <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY c.checkInTime DESC';

  const [rows] = await conn.execute(query, params);
  await conn.end();
  return rows;
}

export async function getWellhubCheckInById(id: number, gymId: number) {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT c.*, m.name as memberName, m.wellhubId, m.email
     FROM wellhub_checkins c
     LEFT JOIN wellhub_members m ON c.wellhubMemberId = m.id
     WHERE c.id = ? AND c.gymId = ?`,
    [id, gymId]
  );
  await conn.end();
  return (rows as any[])[0];
}

// ============ PROFESSOR DASHBOARD ============

/**
 * Get dashboard metrics for professor
 */
export async function getProfessorDashboardMetrics(gymId: number) {
  const conn = await getConnection();
  
  // Total students
  const [totalStudentsResult] = await conn.execute(
    `SELECT COUNT(*) as total FROM students WHERE gymId = ?`,
    [gymId]
  );
  const totalStudents = (totalStudentsResult as any[])[0].total;

  // Active students (status = 'active')
  const [activeStudentsResult] = await conn.execute(
    `SELECT COUNT(*) as total FROM students WHERE gymId = ? AND membershipStatus = 'active'`,
    [gymId]
  );
  const activeStudents = (activeStudentsResult as any[])[0].total;

  // Students with active workout
  const [studentsWithWorkoutResult] = await conn.execute(
    `SELECT COUNT(DISTINCT w.studentId) as total
     FROM workouts w
     WHERE w.gymId = ? 
     AND (w.endDate IS NULL OR w.endDate >= CURDATE())
     AND w.startDate <= CURDATE()`,
    [gymId]
  );
  const studentsWithWorkout = (studentsWithWorkoutResult as any[])[0].total;

  // Weekly frequency (average accesses per week in last 30 days)
  const [frequencyResult] = await conn.execute(
    `SELECT COUNT(*) as totalAccesses, COUNT(DISTINCT studentId) as uniqueStudents
     FROM access_logs
     WHERE gymId = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [gymId]
  );
  const frequencyData = (frequencyResult as any[])[0];
  const averageFrequency = frequencyData.uniqueStudents > 0 
    ? (frequencyData.totalAccesses / frequencyData.uniqueStudents / 4.3).toFixed(1) // 4.3 weeks in a month
    : 0;

  await conn.end();

  return {
    totalStudents,
    activeStudents,
    studentsWithWorkout,
    averageFrequency: parseFloat(averageFrequency as string),
  };
}

/**
 * Get recent activities for professor dashboard
 */
export async function getRecentActivities(gymId: number, limit: number = 10) {
  const conn = await getConnection();
  
  const [rows] = await conn.execute(
    `SELECT 
      al.id,
      al.studentId,
      al.timestamp as timestamp,
      u.name as studentName,
      'access' as type
     FROM access_logs al
     INNER JOIN students s ON al.studentId = s.id
     INNER JOIN users u ON s.userId = u.id
     WHERE al.gymId = ?
     ORDER BY al.timestamp DESC
     LIMIT ?`,
    [gymId, limit]
  );

  await conn.end();
  return rows;
}

/**
 * Get student alerts (inactive, expired workouts, etc)
 */
export async function getStudentAlerts(gymId: number) {
  const conn = await getConnection();
  
  // Inactive students (no access in last 7 days)
  const [inactiveStudents] = await conn.execute(
    `SELECT
      s.id,
      u.name as studentName,
      MAX(al.timestamp) as lastAccess,
      'inactive_student' as alertType
     FROM students s
     INNER JOIN users u ON s.userId = u.id
     LEFT JOIN access_logs al ON s.id = al.studentId AND al.gymId = ?
     WHERE s.gymId = ? AND s.membershipStatus = 'active'
     GROUP BY s.id, u.name, u.id
     HAVING lastAccess IS NULL OR lastAccess < DATE_SUB(NOW(), INTERVAL 7 DAY)
     LIMIT 10`,
    [gymId, gymId]
  );

  // Expired workouts (endDate passed)
  const [expiredWorkouts] = await conn.execute(
    `SELECT 
      s.id,
      u.name as studentName,
      w.name as workoutName,
      w.endDate,
      'workout_expired' as alertType
     FROM workouts w
     INNER JOIN students s ON w.studentId = s.id
     INNER JOIN users u ON s.userId = u.id
     WHERE w.gymId = ? AND w.endDate < CURDATE()
     LIMIT 10`,
    [gymId]
  );

  await conn.end();

  return [
    ...(inactiveStudents as any[]),
    ...(expiredWorkouts as any[])
  ];
}

/**
 * Get student profile with detailed information
 */
export async function getStudentProfile(studentId: number, gymId: number) {
  const conn = await getConnection();
  
  // Basic info
  const [studentInfo] = await conn.execute(
    `SELECT 
      s.*,
      u.name,
      u.email,
      u.phone,
      u.createdAt as memberSince,
      p.name as planName,
      sub.startDate as subscriptionStart,
      sub.endDate as subscriptionEnd
     FROM students s
     INNER JOIN users u ON s.userId = u.id
     LEFT JOIN subscriptions sub ON s.id = sub.studentId AND sub.status = 'active'
     LEFT JOIN plans p ON sub.planId = p.id
     WHERE s.id = ? AND s.gymId = ?
     LIMIT 1`,
    [studentId, gymId]
  );

  const student = (studentInfo as any[])[0];
  if (!student) {
    await conn.end();
    return null;
  }

  // Current workout
  const [currentWorkout] = await conn.execute(
    `SELECT * FROM workouts
     WHERE studentId = ? AND gymId = ?
     AND startDate <= CURDATE()
     AND (endDate IS NULL OR endDate >= CURDATE())
     ORDER BY startDate DESC
     LIMIT 1`,
    [studentId, gymId]
  );

  // Workout history (last 30 days)
  const [workoutHistory] = await conn.execute(
    `SELECT
      DATE(al.timestamp) as timestamp,
      COUNT(*) as accessCount
     FROM access_logs al
     WHERE al.studentId = ? AND al.gymId = ?
     AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(al.timestamp)
     ORDER BY DATE(al.timestamp) DESC`,
    [studentId, gymId]
  );

  // Attendance stats
  const [attendanceStats] = await conn.execute(
    `SELECT
      COUNT(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as thisWeek,
      COUNT(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as thisMonth,
      COUNT(*) as total
     FROM access_logs
     WHERE studentId = ? AND gymId = ?`,
    [studentId, gymId]
  );

  const attendance = (attendanceStats as any[])[0] || { thisWeek: 0, thisMonth: 0, total: 0 };

  // Last access date
  const [lastAccess] = await conn.execute(
    `SELECT timestamp FROM access_logs
     WHERE studentId = ? AND gymId = ?
     ORDER BY timestamp DESC
     LIMIT 1`,
    [studentId, gymId]
  );

  const lastAccessDate = (lastAccess as any[])[0]?.timestamp || null;

  // Calculate average weekly frequency based on last 30 days
  const averageWeeklyFrequency = attendance.thisMonth / 4.3; // 4.3 weeks in a month

  await conn.end();

  return {
    ...student,
    currentWorkout: (currentWorkout as any[])[0] || null,
    workoutHistory: workoutHistory || [],
    attendanceThisWeek: attendance.thisWeek,
    attendanceThisMonth: attendance.thisMonth,
    averageWeeklyFrequency: parseFloat(averageWeeklyFrequency.toFixed(1)),
    totalAttendance: attendance.total,
    lastAccessDate,
  };
}

// ============ LANDING PAGE SCREENSHOTS ============

/**
 * List all active landing page screenshots
 */
export async function listLandingPageScreenshots(activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(schema.landingPageScreenshots)
    .orderBy(asc(schema.landingPageScreenshots.displayOrder));

  if (activeOnly) {
    query = query.where(eq(schema.landingPageScreenshots.active, "Y")) as any;
  }

  return await query;
}

/**
 * Get landing page screenshot by ID
 */
export async function getLandingPageScreenshotById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(schema.landingPageScreenshots)
    .where(eq(schema.landingPageScreenshots.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Create landing page screenshot
 */
export async function createLandingPageScreenshot(data: {
  title: string;
  description?: string | null;
  imageUrl: string;
  displayOrder?: number;
  active?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db.insert(schema.landingPageScreenshots).values({
    title: data.title,
    description: data.description || null,
    imageUrl: data.imageUrl,
    displayOrder: data.displayOrder || 0,
    active: data.active || "Y",
  });
}

/**
 * Update landing page screenshot
 */
export async function updateLandingPageScreenshot(
  id: number,
  data: {
    title?: string;
    description?: string | null;
    imageUrl?: string;
    displayOrder?: number;
    active?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db
    .update(schema.landingPageScreenshots)
    .set(data)
    .where(eq(schema.landingPageScreenshots.id, id));
}

/**
 * Delete landing page screenshot
 */
export async function deleteLandingPageScreenshot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db
    .delete(schema.landingPageScreenshots)
    .where(eq(schema.landingPageScreenshots.id, id));
}
