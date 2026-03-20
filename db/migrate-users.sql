-- Migration: Create AdminUsers table
-- Run this script once against PeterAllesweterdb

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AdminUsers' AND xtype='U')
BEGIN
  CREATE TABLE AdminUsers (
    id                 INT           IDENTITY(1,1) PRIMARY KEY,
    name               NVARCHAR(100) NOT NULL,
    email              NVARCHAR(150) NOT NULL,
    passwordHash       NVARCHAR(255) NOT NULL,
    role               NVARCHAR(20)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
    isActive           BIT           NOT NULL DEFAULT 1,
    forcePasswordReset BIT           NOT NULL DEFAULT 0,
    lastLogin          DATETIME      NULL,
    createdAt          DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_AdminUsers_email UNIQUE (email)
  );
  PRINT 'AdminUsers table created.';
END
ELSE
  PRINT 'AdminUsers table already exists — skipped.';

-- Seed dummy users (run scripts/seed-users.mjs to insert with real bcrypt hashes)
-- Passwords shown here are placeholders; actual hashed values come from the seed script.
