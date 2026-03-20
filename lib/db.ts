import sql from 'mssql';
import {
  Vehicle, EngineType, RentalLocation, Conversation, Message,
  VehicleFilters, Rental, CreateRentalInput, AdminUser,
} from '@/types';

const dbConfig: sql.config = {
  server: process.env.DB_SERVER?.split('\\')[0] || 'localhost',
  database: process.env.DB_DATABASE || 'PeterAllesweterdb',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_SERVER?.split('\\')[1] || 'SQLEXPRESS',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = await new sql.ConnectionPool(dbConfig).connect();
  }
  return pool;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function getVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  const db = await getPool();
  const req = db.request();

  let query = `
    SELECT
      v.id, v.brand, v.model, v.type, v.licensePlate, v.year, v.seats,
      v.engineTypeId, v.engineCC, v.powerKW, v.transmissionType,
      v.availabilityStatus, v.locationId, v.mileage, v.lastUpdated, v.notes,
      e.name  AS engineTypeName,
      e.fuelType,
      e.co2Category,
      l.name  AS locationName,
      l.city  AS locationCity,
      p.halfDayPrice, p.fullDayPrice, p.weekendPrice, p.weekPrice, p.monthPrice
    FROM Vehicles v
    LEFT JOIN EngineTypes     e ON v.engineTypeId = e.id
    LEFT JOIN RentalLocations l ON v.locationId   = l.id
    LEFT JOIN VehiclePricing  p ON v.id           = p.vehicleId AND p.validUntil IS NULL
    WHERE 1=1
  `;

  if (filters?.type) {
    query += ' AND v.type = @type';
    req.input('type', sql.NVarChar, filters.type.toLowerCase());
  }
  if (filters?.brand) {
    query += ' AND v.brand = @brand';
    req.input('brand', sql.NVarChar, filters.brand);
  }
  if (filters?.seats) {
    query += ' AND v.seats >= @seats';
    req.input('seats', sql.Int, filters.seats);
  }
  if (filters?.transmissionType) {
    query += ' AND v.transmissionType = @transmissionType';
    req.input('transmissionType', sql.NVarChar, filters.transmissionType.toLowerCase());
  }
  if (filters?.fuelType) {
    query += ' AND e.fuelType = @fuelType';
    req.input('fuelType', sql.NVarChar, filters.fuelType);
  }
  if (filters?.locationId) {
    query += ' AND v.locationId = @locationId';
    req.input('locationId', sql.Int, filters.locationId);
  }
  if (filters?.availableFrom && filters?.availableTo) {
    query += `
      AND v.availabilityStatus = 'available'
      AND NOT EXISTS (
        SELECT 1 FROM Rentals r
        WHERE r.vehicleId = v.id
          AND r.status IN ('confirmed','active')
          AND r.startDateTime < @availableTo
          AND r.endDateTime   > @availableFrom
      )
    `;
    req.input('availableFrom', sql.DateTime, new Date(filters.availableFrom));
    req.input('availableTo',   sql.DateTime, new Date(filters.availableTo));
  }

  query += ' ORDER BY v.brand, v.model';

  const result = await req.query(query);
  return result.recordset as Vehicle[];
}

export async function getVehicleById(id: number): Promise<Vehicle | null> {
  const db = await getPool();
  const result = await db.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        v.id, v.brand, v.model, v.type, v.licensePlate, v.year, v.seats,
        v.engineTypeId, v.engineCC, v.powerKW, v.transmissionType,
        v.availabilityStatus, v.locationId, v.mileage, v.lastUpdated, v.notes,
        e.name  AS engineTypeName, e.fuelType, e.co2Category,
        l.name  AS locationName,  l.city AS locationCity,
        p.halfDayPrice, p.fullDayPrice, p.weekendPrice, p.weekPrice, p.monthPrice
      FROM Vehicles v
      LEFT JOIN EngineTypes     e ON v.engineTypeId = e.id
      LEFT JOIN RentalLocations l ON v.locationId   = l.id
      LEFT JOIN VehiclePricing  p ON v.id           = p.vehicleId AND p.validUntil IS NULL
      WHERE v.id = @id
    `);
  return result.recordset[0] || null;
}

export async function createVehicle(data: Omit<Vehicle, 'id' | 'lastUpdated'>): Promise<number> {
  const db = await getPool();
  const transaction = new sql.Transaction(db);
  await transaction.begin();

  try {
    const vehicleResult = await new sql.Request(transaction)
      .input('brand',              sql.NVarChar, data.brand)
      .input('model',              sql.NVarChar, data.model)
      .input('type',               sql.NVarChar, data.type.toLowerCase())
      .input('licensePlate',       sql.NVarChar, data.licensePlate)
      .input('year',               sql.Int,      data.year)
      .input('seats',              sql.Int,      data.seats)
      .input('engineTypeId',       sql.Int,      data.engineTypeId)
      .input('engineCC',           sql.Int,      data.engineCC ?? null)
      .input('powerKW',            sql.Int,      data.powerKW ?? null)
      .input('transmissionType',   sql.NVarChar, (data.transmissionType || 'manual').toLowerCase())
      .input('availabilityStatus', sql.NVarChar, data.availabilityStatus)
      .input('locationId',         sql.Int,      data.locationId)
      .input('mileage',            sql.Int,      data.mileage || 0)
      .input('notes',              sql.NVarChar, data.notes ?? null)
      .query(`
        INSERT INTO Vehicles
          (brand, model, type, licensePlate, year, seats, engineTypeId, engineCC, powerKW,
           transmissionType, availabilityStatus, locationId, mileage, notes, lastUpdated)
        OUTPUT INSERTED.id
        VALUES
          (@brand, @model, @type, @licensePlate, @year, @seats, @engineTypeId, @engineCC, @powerKW,
           @transmissionType, @availabilityStatus, @locationId, @mileage, @notes, GETDATE())
      `);

    const vehicleId = vehicleResult.recordset[0].id;

    if (data.halfDayPrice || data.fullDayPrice) {
      await new sql.Request(transaction)
        .input('vehicleId',    sql.Int,          vehicleId)
        .input('halfDayPrice', sql.Decimal(10,2), data.halfDayPrice || 0)
        .input('fullDayPrice', sql.Decimal(10,2), data.fullDayPrice || 0)
        .input('weekendPrice', sql.Decimal(10,2), data.weekendPrice || 0)
        .input('weekPrice',    sql.Decimal(10,2), data.weekPrice    || 0)
        .input('monthPrice',   sql.Decimal(10,2), data.monthPrice   || 0)
        .query(`
          INSERT INTO VehiclePricing
            (vehicleId, halfDayPrice, fullDayPrice, weekendPrice, weekPrice, monthPrice, validFrom, lastUpdated)
          VALUES
            (@vehicleId, @halfDayPrice, @fullDayPrice, @weekendPrice, @weekPrice, @monthPrice,
             CAST(GETDATE() AS DATE), GETDATE())
        `);
    }

    await transaction.commit();
    return vehicleId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function updateVehicle(id: number, data: Partial<Vehicle>): Promise<void> {
  const db = await getPool();
  const transaction = new sql.Transaction(db);
  await transaction.begin();

  try {
    const req = new sql.Request(transaction).input('id', sql.Int, id);
    const fields: string[] = ['lastUpdated = GETDATE()'];

    if (data.brand             !== undefined) { fields.push('brand = @brand');                         req.input('brand',              sql.NVarChar, data.brand); }
    if (data.model             !== undefined) { fields.push('model = @model');                         req.input('model',              sql.NVarChar, data.model); }
    if (data.type              !== undefined) { fields.push('type = @type');                           req.input('type',               sql.NVarChar, data.type.toLowerCase()); }
    if (data.licensePlate      !== undefined) { fields.push('licensePlate = @licensePlate');           req.input('licensePlate',       sql.NVarChar, data.licensePlate); }
    if (data.year              !== undefined) { fields.push('year = @year');                           req.input('year',               sql.Int,      data.year); }
    if (data.seats             !== undefined) { fields.push('seats = @seats');                         req.input('seats',              sql.Int,      data.seats); }
    if (data.engineTypeId      !== undefined) { fields.push('engineTypeId = @engineTypeId');           req.input('engineTypeId',       sql.Int,      data.engineTypeId); }
    if (data.engineCC          !== undefined) { fields.push('engineCC = @engineCC');                   req.input('engineCC',           sql.Int,      data.engineCC); }
    if (data.powerKW           !== undefined) { fields.push('powerKW = @powerKW');                     req.input('powerKW',            sql.Int,      data.powerKW); }
    if (data.transmissionType  !== undefined) { fields.push('transmissionType = @transmissionType');   req.input('transmissionType',   sql.NVarChar, data.transmissionType.toLowerCase()); }
    if (data.availabilityStatus!== undefined) { fields.push('availabilityStatus = @availabilityStatus'); req.input('availabilityStatus', sql.NVarChar, data.availabilityStatus); }
    if (data.locationId        !== undefined) { fields.push('locationId = @locationId');               req.input('locationId',         sql.Int,      data.locationId); }
    if (data.mileage           !== undefined) { fields.push('mileage = @mileage');                     req.input('mileage',            sql.Int,      data.mileage); }
    if (data.notes             !== undefined) { fields.push('notes = @notes');                         req.input('notes',              sql.NVarChar, data.notes); }

    await req.query(`UPDATE Vehicles SET ${fields.join(', ')} WHERE id = @id`);

    // Update pricing: close old row, insert new
    if (data.halfDayPrice !== undefined || data.fullDayPrice !== undefined) {
      await new sql.Request(transaction)
        .input('vehicleId', sql.Int, id)
        .query(`
          UPDATE VehiclePricing
          SET validUntil = CAST(GETDATE() AS DATE)
          WHERE vehicleId = @vehicleId AND validUntil IS NULL
        `);

      await new sql.Request(transaction)
        .input('vehicleId',    sql.Int,          id)
        .input('halfDayPrice', sql.Decimal(10,2), data.halfDayPrice || 0)
        .input('fullDayPrice', sql.Decimal(10,2), data.fullDayPrice || 0)
        .input('weekendPrice', sql.Decimal(10,2), data.weekendPrice || 0)
        .input('weekPrice',    sql.Decimal(10,2), data.weekPrice    || 0)
        .input('monthPrice',   sql.Decimal(10,2), data.monthPrice   || 0)
        .query(`
          INSERT INTO VehiclePricing
            (vehicleId, halfDayPrice, fullDayPrice, weekendPrice, weekPrice, monthPrice, validFrom, lastUpdated)
          VALUES
            (@vehicleId, @halfDayPrice, @fullDayPrice, @weekendPrice, @weekPrice, @monthPrice,
             CAST(GETDATE() AS DATE), GETDATE())
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function deleteVehicle(id: number): Promise<void> {
  const db = await getPool();
  const transaction = new sql.Transaction(db);
  await transaction.begin();

  try {
    // Delete VehiclePricing first (FK constraint)
    await new sql.Request(transaction)
      .input('vehicleId', sql.Int, id)
      .query('DELETE FROM VehiclePricing WHERE vehicleId = @vehicleId');

    await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('DELETE FROM Vehicles WHERE id = @id');

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ─── Engine Types & Locations ────────────────────────────────────────────────

export async function getEngineTypes(): Promise<EngineType[]> {
  const db = await getPool();
  const result = await db.request().query('SELECT * FROM EngineTypes ORDER BY name');
  return result.recordset as EngineType[];
}

export async function getRentalLocations(): Promise<RentalLocation[]> {
  const db = await getPool();
  const result = await db.request()
    .query('SELECT * FROM RentalLocations WHERE isActive = 1 ORDER BY name');
  return result.recordset as RentalLocation[];
}

// ─── Conversations ───────────────────────────────────────────────────────────
// conversationId is a string PK (e.g. "conv_1773937888165_0t8hfdb")
// userId is used instead of sessionId

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createConversation(userId: string): Promise<string> {
  const db = await getPool();
  const conversationId = generateConversationId();
  await db.request()
    .input('conversationId', sql.NVarChar, conversationId)
    .input('userId',         sql.NVarChar, userId)
    .query(`
      INSERT INTO Conversations (conversationId, userId, timestamp)
      VALUES (@conversationId, @userId, GETDATE())
    `);
  return conversationId;
}

export async function getConversationByUser(userId: string): Promise<Conversation | null> {
  const db = await getPool();
  // Get the most recent conversation for this user
  const result = await db.request()
    .input('userId', sql.NVarChar, userId)
    .query(`
      SELECT TOP 1 *
      FROM Conversations
      WHERE userId = @userId
      ORDER BY timestamp DESC
    `);
  return result.recordset[0] || null;
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const db = await getPool();
  const result = await db.request()
    .input('conversationId', sql.NVarChar, conversationId)
    .query('SELECT * FROM Conversations WHERE conversationId = @conversationId');
  return result.recordset[0] || null;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  llmModelUsed?: string
): Promise<void> {
  const db = await getPool();
  await db.request()
    .input('conversationId', sql.NVarChar,       conversationId)
    .input('role',           sql.NVarChar,       role)
    .input('content',        sql.NVarChar(sql.MAX), content)
    .input('llmModelUsed',   sql.NVarChar,       llmModelUsed ?? null)
    .query(`
      INSERT INTO Messages (conversationId, role, content, timestamp, llmModelUsed)
      VALUES (@conversationId, @role, @content, GETDATE(), @llmModelUsed)
    `);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const db = await getPool();
  const result = await db.request()
    .input('conversationId', sql.NVarChar, conversationId)
    .query(`
      SELECT messageId, conversationId, role, content, timestamp, llmModelUsed
      FROM Messages
      WHERE conversationId = @conversationId
      ORDER BY timestamp ASC
    `);
  return result.recordset as Message[];
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getPool();
  const result = await db.request().query(`
    SELECT c.conversationId, c.userId, c.timestamp, COUNT(m.messageId) AS messageCount
    FROM Conversations c
    LEFT JOIN Messages m ON m.conversationId = c.conversationId
    GROUP BY c.conversationId, c.userId, c.timestamp
    ORDER BY c.timestamp DESC
  `);
  return result.recordset as Conversation[];
}

// ─── Rentals ─────────────────────────────────────────────────────────────────

export async function createRental(data: CreateRentalInput): Promise<number> {
  const db = await getPool();
  const result = await db.request()
    .input('vehicleId',        sql.Int,          data.vehicleId)
    .input('locationId',       sql.Int,          data.locationId)
    .input('customerName',     sql.NVarChar,     data.customerName)
    .input('customerEmail',    sql.NVarChar,     data.customerEmail)
    .input('startDateTime',    sql.DateTime,     new Date(data.startDateTime))
    .input('endDateTime',      sql.DateTime,     new Date(data.endDateTime))
    .input('rentalPeriodType', sql.NVarChar,     data.rentalPeriodType)
    .input('totalPrice',       sql.Decimal(10,2),data.totalPrice)
    .query(`
      INSERT INTO Rentals
        (vehicleId, locationId, customerName, customerEmail,
         startDateTime, endDateTime, rentalPeriodType, totalPrice, status, createdAt)
      OUTPUT INSERTED.id
      VALUES
        (@vehicleId, @locationId, @customerName, @customerEmail,
         @startDateTime, @endDateTime, @rentalPeriodType, @totalPrice, 'confirmed', GETDATE())
    `);
  return result.recordset[0].id;
}

export async function getRentals(vehicleId?: number): Promise<Rental[]> {
  const db = await getPool();
  const req = db.request();
  let query = 'SELECT * FROM Rentals WHERE 1=1';
  if (vehicleId) {
    query += ' AND vehicleId = @vehicleId';
    req.input('vehicleId', sql.Int, vehicleId);
  }
  query += ' ORDER BY startDateTime DESC';
  const result = await req.query(query);
  return result.recordset as Rental[];
}

// ─── Vehicle Queries ──────────────────────────────────────────────────────────

export async function logVehicleQuery(
  conversationId: string,
  queryType: string,
  vehicleId?: number,
  response?: string
): Promise<void> {
  const db = await getPool();
  await db.request()
    .input('conversationId', sql.NVarChar,       conversationId)
    .input('vehicleId',      sql.Int,            vehicleId ?? null)
    .input('queryType',      sql.NVarChar,       queryType)
    .input('response',       sql.NVarChar(sql.MAX), response ?? null)
    .query(`
      INSERT INTO VehicleQueries (conversationId, vehicleId, queryType, response, timestamp)
      VALUES (@conversationId, @vehicleId, @queryType, @response, GETDATE())
    `);
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function getUsers(filters?: { search?: string; role?: string }): Promise<AdminUser[]> {
  const db = await getPool();
  const req = db.request();
  let query = `
    SELECT id, name, email, role, isActive, forcePasswordReset, lastLogin, createdAt
    FROM AdminUsers WHERE 1=1
  `;
  if (filters?.search) {
    query += ' AND (name LIKE @search OR email LIKE @search)';
    req.input('search', sql.NVarChar, `%${filters.search}%`);
  }
  if (filters?.role) {
    query += ' AND role = @role';
    req.input('role', sql.NVarChar, filters.role);
  }
  query += ' ORDER BY createdAt DESC';
  const result = await req.query(query);
  return result.recordset as AdminUser[];
}

export async function getUserById(id: number): Promise<AdminUser | null> {
  const db = await getPool();
  const result = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT id, name, email, role, isActive, forcePasswordReset, lastLogin, createdAt FROM AdminUsers WHERE id = @id');
  return result.recordset[0] || null;
}

export async function getUserByEmail(email: string): Promise<(AdminUser & { passwordHash: string }) | null> {
  const db = await getPool();
  const result = await db.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id, name, email, role, isActive, forcePasswordReset, lastLogin, createdAt, passwordHash FROM AdminUsers WHERE email = @email');
  return result.recordset[0] || null;
}

export async function createUser(data: {
  name: string; email: string; passwordHash: string; role: 'admin' | 'user';
}): Promise<number> {
  const db = await getPool();
  const result = await db.request()
    .input('name',         sql.NVarChar, data.name)
    .input('email',        sql.NVarChar, data.email)
    .input('passwordHash', sql.NVarChar, data.passwordHash)
    .input('role',         sql.NVarChar, data.role)
    .query(`
      INSERT INTO AdminUsers (name, email, passwordHash, role)
      OUTPUT INSERTED.id
      VALUES (@name, @email, @passwordHash, @role)
    `);
  return result.recordset[0].id;
}

export async function updateUser(id: number, data: Partial<{
  name: string; email: string; passwordHash: string;
  role: string; isActive: boolean; forcePasswordReset: boolean;
}>): Promise<void> {
  const db = await getPool();
  const req = db.request().input('id', sql.Int, id);
  const fields: string[] = [];

  if (data.name             !== undefined) { fields.push('name = @name');                         req.input('name',               sql.NVarChar, data.name); }
  if (data.email            !== undefined) { fields.push('email = @email');                       req.input('email',              sql.NVarChar, data.email); }
  if (data.passwordHash     !== undefined) { fields.push('passwordHash = @passwordHash');         req.input('passwordHash',       sql.NVarChar, data.passwordHash); }
  if (data.role             !== undefined) { fields.push('role = @role');                         req.input('role',               sql.NVarChar, data.role); }
  if (data.isActive         !== undefined) { fields.push('isActive = @isActive');                 req.input('isActive',           sql.Bit,      data.isActive ? 1 : 0); }
  if (data.forcePasswordReset !== undefined) { fields.push('forcePasswordReset = @forcePasswordReset'); req.input('forcePasswordReset', sql.Bit, data.forcePasswordReset ? 1 : 0); }

  if (fields.length === 0) return;
  await req.query(`UPDATE AdminUsers SET ${fields.join(', ')} WHERE id = @id`);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getPool();
  await db.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM AdminUsers WHERE id = @id');
}
