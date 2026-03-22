import sql from 'mssql';
import {
  Vehicle, RentalLocation, Conversation, Message,
  VehicleFilters, Rental, CreateRentalInput, AdminUser,
} from '@/types';

const dbConfig: sql.config = {
  server: process.env.DB_SERVER?.split('\\')[0] || 'localhost',
  database: process.env.DB_DATABASE || 'VerhuurFirmaDB',
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
      v.VoertuigID   AS id,
      v.Nummerplaat  AS licensePlate,
      v.ModelID      AS modelId,
      v.Kleur        AS color,
      v.Opties       AS options,
      v.LocatieID    AS locationId,
      v.Status       AS availabilityStatus,
      v.StatusID     AS statusId,
      v.StatusOpmerking AS statusNote,
      m.Type         AS type,
      m.Merk         AS brand,
      m.ModelNaam    AS model,
      m.AantalZitplaatsen AS seats,
      m.MotorInhoud  AS engineCC,
      l.Naam         AS locationName,
      l.Gemeente     AS locationCity,
      s.IsBeschikbaar AS isAvailable,
      p.HalfDagPrijs AS halfDayPrice,
      p.DagPrijs     AS fullDayPrice,
      p.WeekPrijs    AS weekPrice,
      p.MaandPrijs   AS monthPrice
    FROM Voertuigen v
    LEFT JOIN Modellen          m ON v.ModelID   = m.ModelID
    LEFT JOIN Locaties          l ON v.LocatieID = l.LocatieID
    LEFT JOIN VoertuigStatussen s ON v.StatusID  = s.StatusID
    LEFT JOIN ModelPrijzen      p ON m.ModelID   = p.ModelID
    WHERE 1=1
  `;

  if (filters?.type) {
    query += ' AND LOWER(m.Type) = @type';
    req.input('type', sql.NVarChar, filters.type.toLowerCase());
  }
  if (filters?.brand) {
    query += ' AND m.Merk = @brand';
    req.input('brand', sql.NVarChar, filters.brand);
  }
  if (filters?.seats) {
    query += ' AND m.AantalZitplaatsen >= @seats';
    req.input('seats', sql.Int, filters.seats);
  }
  if (filters?.locationId) {
    query += ' AND v.LocatieID = @locationId';
    req.input('locationId', sql.Int, filters.locationId);
  }
  if (filters?.availableFrom && filters?.availableTo) {
    query += `
      AND s.IsBeschikbaar = 1
      AND NOT EXISTS (
        SELECT 1 FROM Verhuringen r
        WHERE r.VoertuigID = v.VoertuigID
          AND r.StartDatum < @availableTo
          AND r.EindDatum  > @availableFrom
      )
    `;
    req.input('availableFrom', sql.DateTime, new Date(filters.availableFrom));
    req.input('availableTo',   sql.DateTime, new Date(filters.availableTo));
  }

  query += ' ORDER BY m.Merk, m.ModelNaam';

  const result = await req.query(query);
  return result.recordset as Vehicle[];
}

export async function getVehicleById(id: number): Promise<Vehicle | null> {
  const db = await getPool();
  const result = await db.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        v.VoertuigID   AS id,
        v.Nummerplaat  AS licensePlate,
        v.ModelID      AS modelId,
        v.Kleur        AS color,
        v.Opties       AS options,
        v.LocatieID    AS locationId,
        v.Status       AS availabilityStatus,
        v.StatusID     AS statusId,
        v.StatusOpmerking AS statusNote,
        m.Type         AS type,
        m.Merk         AS brand,
        m.ModelNaam    AS model,
        m.AantalZitplaatsen AS seats,
        m.MotorInhoud  AS engineCC,
        l.Naam         AS locationName,
        l.Gemeente     AS locationCity,
        s.IsBeschikbaar AS isAvailable,
        p.HalfDagPrijs AS halfDayPrice,
        p.DagPrijs     AS fullDayPrice,
        p.WeekPrijs    AS weekPrice,
        p.MaandPrijs   AS monthPrice
      FROM Voertuigen v
      LEFT JOIN Modellen          m ON v.ModelID   = m.ModelID
      LEFT JOIN Locaties          l ON v.LocatieID = l.LocatieID
      LEFT JOIN VoertuigStatussen s ON v.StatusID  = s.StatusID
      LEFT JOIN ModelPrijzen      p ON m.ModelID   = p.ModelID
      WHERE v.VoertuigID = @id
    `);
  return result.recordset[0] || null;
}

export async function createVehicle(data: Omit<Vehicle, 'id'>): Promise<number> {
  const db = await getPool();
  const result = await db.request()
    .input('nummerplaat',  sql.NVarChar, data.licensePlate)
    .input('modelId',      sql.Int,      data.modelId)
    .input('kleur',        sql.NVarChar, data.color ?? null)
    .input('opties',       sql.NVarChar, data.options ?? null)
    .input('locatieId',    sql.Int,      data.locationId)
    .input('statusId',     sql.Int,      data.statusId ?? 1)
    .query(`
      INSERT INTO Voertuigen (Nummerplaat, ModelID, Kleur, Opties, LocatieID, StatusID, LaatsteStatusWijziging)
      OUTPUT INSERTED.VoertuigID
      VALUES (@nummerplaat, @modelId, @kleur, @opties, @locatieId, @statusId, GETDATE())
    `);
  return result.recordset[0].VoertuigID;
}

export async function updateVehicle(id: number, data: Partial<Vehicle>): Promise<void> {
  const db = await getPool();
  const req = db.request().input('id', sql.Int, id);
  const fields: string[] = ['LaatsteStatusWijziging = GETDATE()'];

  if (data.licensePlate !== undefined) { fields.push('Nummerplaat = @nummerplaat'); req.input('nummerplaat', sql.NVarChar, data.licensePlate); }
  if (data.modelId      !== undefined) { fields.push('ModelID = @modelId');         req.input('modelId',     sql.Int,      data.modelId); }
  if (data.color        !== undefined) { fields.push('Kleur = @kleur');             req.input('kleur',       sql.NVarChar, data.color); }
  if (data.options      !== undefined) { fields.push('Opties = @opties');           req.input('opties',      sql.NVarChar, data.options); }
  if (data.locationId   !== undefined) { fields.push('LocatieID = @locatieId');     req.input('locatieId',   sql.Int,      data.locationId); }
  if (data.statusId     !== undefined) { fields.push('StatusID = @statusId');       req.input('statusId',    sql.Int,      data.statusId); }
  if (data.statusNote   !== undefined) { fields.push('StatusOpmerking = @statusNote'); req.input('statusNote', sql.NVarChar, data.statusNote); }

  await req.query(`UPDATE Voertuigen SET ${fields.join(', ')} WHERE VoertuigID = @id`);
}

export async function deleteVehicle(id: number): Promise<void> {
  const db = await getPool();
  await db.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Voertuigen WHERE VoertuigID = @id');
}

// ─── Modellen ─────────────────────────────────────────────────────────────────

export async function getModellen(): Promise<{
  id: number; type: string; merk: string; modelNaam: string;
  aantalZitplaatsen: number | null; motorInhoud: number | null;
  halfDagPrijs: number | null; dagPrijs: number | null;
  weekPrijs: number | null; maandPrijs: number | null;
}[]> {
  const db = await getPool();
  const result = await db.request().query(`
    SELECT m.ModelID AS id, m.Type AS type, m.Merk AS merk, m.ModelNaam AS modelNaam,
           m.AantalZitplaatsen AS aantalZitplaatsen, m.MotorInhoud AS motorInhoud,
           p.HalfDagPrijs AS halfDagPrijs, p.DagPrijs AS dagPrijs,
           p.WeekPrijs AS weekPrijs, p.MaandPrijs AS maandPrijs
    FROM Modellen m
    LEFT JOIN ModelPrijzen p ON m.ModelID = p.ModelID
    ORDER BY m.Type, m.Merk, m.ModelNaam
  `);
  return result.recordset;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getRentalLocations(): Promise<RentalLocation[]> {
  const db = await getPool();
  const result = await db.request().query(`
    SELECT LocatieID AS id, Naam AS name, Gemeente AS city, Adres AS address,
           Telefoon AS phone, ISNULL(Email, '') AS email, 1 AS isActive,
           Verantwoordelijke AS verantwoordelijke
    FROM Locaties
    ORDER BY Naam
  `);
  return result.recordset as RentalLocation[];
}

// ─── Conversations ───────────────────────────────────────────────────────────

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
  const transaction = new sql.Transaction(db);
  await transaction.begin();

  try {
    // Find or create klant
    let klantId: number;
    const klantResult = await new sql.Request(transaction)
      .input('email', sql.NVarChar, data.customerEmail)
      .query('SELECT KlantID FROM Klanten WHERE Email = @email');

    if (klantResult.recordset.length > 0) {
      klantId = klantResult.recordset[0].KlantID;
    } else {
      const nameParts = data.customerName.split(' ');
      const voornaam = nameParts[0] || data.customerName;
      const achternaam = nameParts.slice(1).join(' ') || '';
      const newKlant = await new sql.Request(transaction)
        .input('voornaam',   sql.NVarChar, voornaam)
        .input('achternaam', sql.NVarChar, achternaam)
        .input('email',      sql.NVarChar, data.customerEmail)
        .query(`
          INSERT INTO Klanten (Voornaam, Achternaam, Email)
          OUTPUT INSERTED.KlantID
          VALUES (@voornaam, @achternaam, @email)
        `);
      klantId = newKlant.recordset[0].KlantID;
    }

    const rentalResult = await new sql.Request(transaction)
      .input('voertuigId',  sql.Int,           data.vehicleId)
      .input('klantId',     sql.Int,            klantId)
      .input('locatieId',   sql.Int,            data.locationId)
      .input('startDatum',  sql.DateTime,       new Date(data.startDateTime))
      .input('eindDatum',   sql.DateTime,       new Date(data.endDateTime))
      .input('duurType',    sql.NVarChar,       data.rentalPeriodType)
      .input('prijs',       sql.Decimal(10, 2), data.totalPrice)
      .query(`
        INSERT INTO Verhuringen (VoertuigID, KlantID, LocatieID, StartDatum, EindDatum, DuurType, Prijs)
        OUTPUT INSERTED.VerhuurID
        VALUES (@voertuigId, @klantId, @locatieId, @startDatum, @eindDatum, @duurType, @prijs)
      `);

    await transaction.commit();
    return rentalResult.recordset[0].VerhuurID;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getRentals(vehicleId?: number): Promise<Rental[]> {
  const db = await getPool();
  const req = db.request();
  let query = `
    SELECT
      r.VerhuurID    AS id,
      r.VoertuigID   AS vehicleId,
      r.LocatieID    AS locationId,
      k.Voornaam + ' ' + k.Achternaam AS customerName,
      k.Email        AS customerEmail,
      r.StartDatum   AS startDateTime,
      r.EindDatum    AS endDateTime,
      r.DuurType     AS rentalPeriodType,
      r.Prijs        AS totalPrice,
      'confirmed'    AS status,
      r.StartDatum   AS createdAt
    FROM Verhuringen r
    LEFT JOIN Klanten k ON r.KlantID = k.KlantID
    WHERE 1=1
  `;
  if (vehicleId) {
    query += ' AND r.VoertuigID = @vehicleId';
    req.input('vehicleId', sql.Int, vehicleId);
  }
  query += ' ORDER BY r.StartDatum DESC';
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
    .input('conversationId', sql.NVarChar,          conversationId)
    .input('vehicleId',      sql.Int,               vehicleId ?? null)
    .input('queryType',      sql.NVarChar,          queryType)
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

  if (data.name               !== undefined) { fields.push('name = @name');                             req.input('name',               sql.NVarChar, data.name); }
  if (data.email              !== undefined) { fields.push('email = @email');                           req.input('email',              sql.NVarChar, data.email); }
  if (data.passwordHash       !== undefined) { fields.push('passwordHash = @passwordHash');             req.input('passwordHash',       sql.NVarChar, data.passwordHash); }
  if (data.role               !== undefined) { fields.push('role = @role');                             req.input('role',               sql.NVarChar, data.role); }
  if (data.isActive           !== undefined) { fields.push('isActive = @isActive');                     req.input('isActive',           sql.Bit,      data.isActive ? 1 : 0); }
  if (data.forcePasswordReset !== undefined) { fields.push('forcePasswordReset = @forcePasswordReset'); req.input('forcePasswordReset', sql.Bit,      data.forcePasswordReset ? 1 : 0); }

  if (fields.length === 0) return;
  await req.query(`UPDATE AdminUsers SET ${fields.join(', ')} WHERE id = @id`);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getPool();
  await db.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM AdminUsers WHERE id = @id');
}
