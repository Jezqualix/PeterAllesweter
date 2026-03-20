-- ============================================================
-- PeterAllesweter Database Initialization Script
-- Database: PeterAllesweterdb
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PeterAllesweterdb')
  CREATE DATABASE PeterAllesweterdb;
GO

USE PeterAllesweterdb;
GO

-- ─── Drop tables in dependency order ───────────────────────

IF OBJECT_ID('VehicleQueries','U') IS NOT NULL DROP TABLE VehicleQueries;
IF OBJECT_ID('Messages','U')       IS NOT NULL DROP TABLE Messages;
IF OBJECT_ID('Rentals','U')        IS NOT NULL DROP TABLE Rentals;
IF OBJECT_ID('Conversations','U')  IS NOT NULL DROP TABLE Conversations;
IF OBJECT_ID('VehiclePricing','U') IS NOT NULL DROP TABLE VehiclePricing;
IF OBJECT_ID('Vehicles','U')       IS NOT NULL DROP TABLE Vehicles;
IF OBJECT_ID('RentalLocations','U')IS NOT NULL DROP TABLE RentalLocations;
IF OBJECT_ID('EngineTypes','U')    IS NOT NULL DROP TABLE EngineTypes;
GO

-- ─── EngineTypes ────────────────────────────────────────────

CREATE TABLE EngineTypes (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(100) NOT NULL,
  fuelType    NVARCHAR(50)  NOT NULL,
  co2Category NVARCHAR(10)  NOT NULL
);
GO

-- ─── RentalLocations ────────────────────────────────────────

CREATE TABLE RentalLocations (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  name       NVARCHAR(200) NOT NULL,
  address    NVARCHAR(300) NOT NULL,
  city       NVARCHAR(100) NOT NULL,
  postalCode NVARCHAR(10)  NOT NULL,
  phone      NVARCHAR(30)  NULL,
  email      NVARCHAR(200) NULL
);
GO

-- ─── Vehicles ───────────────────────────────────────────────

CREATE TABLE Vehicles (
  id                 INT IDENTITY(1,1) PRIMARY KEY,
  make               NVARCHAR(100) NOT NULL,
  model              NVARCHAR(100) NOT NULL,
  type               NVARCHAR(50)  NOT NULL,
  seats              INT           NOT NULL DEFAULT 5,
  licensePlate       NVARCHAR(20)  NOT NULL UNIQUE,
  year               INT           NOT NULL,
  engineTypeId       INT           NOT NULL REFERENCES EngineTypes(id),
  engineCC           INT           NULL,
  powerKW            INT           NULL,
  transmissionType   NVARCHAR(20)  NOT NULL DEFAULT 'Manueel',
  mileage            INT           NOT NULL DEFAULT 0,
  availabilityStatus NVARCHAR(20)  NOT NULL DEFAULT 'available'
                       CHECK (availabilityStatus IN ('available','unavailable')),
  locationId         INT           NOT NULL REFERENCES RentalLocations(id),
  notes              NVARCHAR(MAX) NULL
);
GO

-- ─── VehiclePricing ─────────────────────────────────────────

CREATE TABLE VehiclePricing (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  vehicleId    INT           NOT NULL REFERENCES Vehicles(id),
  halfDayPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
  fullDayPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
  weekendPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
  weekPrice    DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthPrice   DECIMAL(10,2) NOT NULL DEFAULT 0,
  validFrom    DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  validUntil   DATE          NULL  -- NULL = current active price
);
GO

-- ─── Conversations ───────────────────────────────────────────

CREATE TABLE Conversations (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  sessionId NVARCHAR(100) NOT NULL UNIQUE,
  createdAt DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ─── Rentals ────────────────────────────────────────────────

CREATE TABLE Rentals (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  vehicleId       INT          NOT NULL REFERENCES Vehicles(id),
  conversationId  INT          NOT NULL REFERENCES Conversations(id),
  startDateTime   DATETIME     NOT NULL,
  endDateTime     DATETIME     NOT NULL,
  status          NVARCHAR(20) NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed','active','completed','cancelled'))
);
GO

-- ─── Messages ────────────────────────────────────────────────

CREATE TABLE Messages (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  conversationId INT           NOT NULL REFERENCES Conversations(id),
  role           NVARCHAR(20)  NOT NULL,
  content        NVARCHAR(MAX) NOT NULL,
  createdAt      DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ─── VehicleQueries ──────────────────────────────────────────

CREATE TABLE VehicleQueries (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  conversationId INT           NOT NULL REFERENCES Conversations(id),
  queryType      NVARCHAR(100) NOT NULL,
  params         NVARCHAR(MAX) NULL,
  createdAt      DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════

-- ─── Engine Types ────────────────────────────────────────────

INSERT INTO EngineTypes (name, fuelType, co2Category) VALUES
  ('Benzine 1.0T',       'Benzine',    'B'),
  ('Benzine 1.5T',       'Benzine',    'C'),
  ('Diesel 1.6',         'Diesel',     'B'),
  ('Diesel 2.0',         'Diesel',     'C'),
  ('Hybride benzine',    'Hybride',    'A'),
  ('Volledig elektrisch','Elektrisch', 'A+'),
  ('LPG',                'LPG',        'B');
GO

-- ─── Rental Locations ────────────────────────────────────────

INSERT INTO RentalLocations (name, address, city, postalCode, phone, email) VALUES
  ('PeterAllesweter Antwerpen',  'Meir 1',              'Antwerpen', '2000', '+32 3 123 45 67',  'antwerpen@peterallesweter.be'),
  ('PeterAllesweter Brussel',    'Grote Markt 10',      'Brussel',   '1000', '+32 2 123 45 67',  'brussel@peterallesweter.be'),
  ('PeterAllesweter Gent',       'Korenmarkt 5',        'Gent',      '9000', '+32 9 123 45 67',  'gent@peterallesweter.be'),
  ('PeterAllesweter Brugge',     'Markt 7',             'Brugge',    '8000', '+32 50 123 456',   'brugge@peterallesweter.be'),
  ('PeterAllesweter Leuven',     'Grote Markt 2',       'Leuven',    '3000', '+32 16 123 456',   'leuven@peterallesweter.be'),
  ('PeterAllesweter Mechelen',   'Grote Markt 3',       'Mechelen',  '2800', '+32 15 123 456',   'mechelen@peterallesweter.be'),
  ('PeterAllesweter Hasselt',    'Grote Markt 4',       'Hasselt',   '3500', '+32 11 123 456',   'hasselt@peterallesweter.be'),
  ('PeterAllesweter Liège',      'Place Saint-Lambert 1','Liège',    '4000', '+32 4 123 45 67',  'liege@peterallesweter.be'),
  ('PeterAllesweter Namen',      'Place d''Armes 1',    'Namen',     '5000', '+32 81 123 456',   'namen@peterallesweter.be'),
  ('PeterAllesweter Kortrijk',   'Grote Markt 6',       'Kortrijk',  '8500', '+32 56 123 456',   'kortrijk@peterallesweter.be');
GO

-- ─── Vehicles & Pricing ──────────────────────────────────────
-- 50 vehicles across all locations

DECLARE @v INT;

-- Antwerpen (locationId=1)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','Golf','Hatchback',5,'1-ANT-001',2022,1,999,85,'Manueel',28000,'available',1);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,39,65,120,280,800);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('BMW','3 Serie','Sedan',5,'1-ANT-002',2023,2,1499,120,'Automaat',15000,'available',1);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,59,95,175,420,1200);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Renault','Captur','SUV',5,'1-ANT-003',2021,5,0,67,'Automaat',42000,'available',1);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,49,79,145,340,980);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Mercedes-Benz','Vito','Minivan',8,'1-ANT-004',2020,4,1950,120,'Automaat',88000,'unavailable',1);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,79,129,235,560,1600);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Tesla','Model 3','Sedan',5,'1-ANT-005',2023,6,0,208,'Automaat',22000,'available',1);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,69,115,210,490,1400);

-- Brussel (locationId=2)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Audi','A4','Sedan',5,'1-BXL-001',2022,4,1968,110,'Automaat',31000,'available',2);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,65,105,195,450,1300);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Toyota','Corolla','Hatchback',5,'1-BXL-002',2021,5,1798,90,'Manueel',54000,'available',2);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,44,72,132,310,890);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Peugeot','2008','SUV',5,'1-BXL-003',2023,3,1499,73,'Manueel',12000,'available',2);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,45,74,135,315,900);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','Transporter','Minivan',9,'1-BXL-004',2020,4,1968,146,'Manueel',97000,'available',2);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,85,139,255,590,1700);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Mini','Cooper S','Hatchback',4,'1-BXL-005',2022,2,1499,131,'Automaat',18000,'available',2);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,55,89,165,380,1100);

-- Gent (locationId=3)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Ford','Focus','Hatchback',5,'1-GNT-001',2021,1,999,74,'Manueel',39000,'available',3);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,38,62,114,265,760);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volvo','XC60','SUV',5,'1-GNT-002',2022,4,1969,120,'Automaat',27000,'available',3);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,75,122,225,520,1500);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Citroën','C3','Hatchback',5,'1-GNT-003',2023,1,1199,60,'Manueel',8000,'available',3);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,32,52,95,220,630);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Skoda','Octavia Combi','Combi',5,'1-GNT-004',2022,3,1499,85,'Manueel',33000,'available',3);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,47,77,140,330,950);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Porsche','Macan','SUV',5,'1-GNT-005',2023,2,1984,180,'Automaat',9000,'available',3);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,119,195,360,850,2500);

-- Brugge (locationId=4)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Opel','Astra','Hatchback',5,'1-BRU-001',2021,3,1499,77,'Manueel',47000,'available',4);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,36,59,108,250,720);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Hyundai','Tucson','SUV',5,'1-BRU-002',2022,5,1598,104,'Automaat',25000,'available',4);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,55,89,165,380,1100);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Kia','Sportage','SUV',5,'1-BRU-003',2023,5,1598,104,'Manueel',11000,'available',4);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,52,84,155,360,1040);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('BMW','5 Serie','Sedan',5,'1-BRU-004',2022,4,1995,140,'Automaat',23000,'available',4);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,79,129,235,560,1600);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Mazda','CX-5','SUV',5,'1-BRU-005',2021,3,2184,110,'Automaat',44000,'unavailable',4);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,58,94,173,400,1150);

-- Leuven (locationId=5)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','Polo','Hatchback',5,'1-LEU-001',2023,1,999,70,'Manueel',6000,'available',5);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,33,54,99,230,660);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Tesla','Model Y','SUV',5,'1-LEU-002',2023,6,0,220,'Automaat',14000,'available',5);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,79,129,235,560,1600);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Seat','Leon','Hatchback',5,'1-LEU-003',2022,1,999,85,'Manueel',29000,'available',5);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,40,66,121,280,800);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Audi','Q5','SUV',5,'1-LEU-004',2022,4,1984,140,'Automaat',21000,'available',5);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,89,145,265,620,1800);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Dacia','Sandero','Hatchback',5,'1-LEU-005',2022,1,999,67,'Manueel',35000,'available',5);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,28,45,83,192,550);

-- Mechelen (locationId=6)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','Tiguan','SUV',5,'1-MEC-001',2022,3,1968,110,'Automaat',26000,'available',6);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,62,100,185,430,1250);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Renault','Zoe','Hatchback',5,'1-MEC-002',2022,6,0,100,'Automaat',31000,'available',6);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,42,68,125,290,840);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Ford','Kuga','SUV',5,'1-MEC-003',2021,5,2488,112,'Automaat',48000,'available',6);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,58,94,173,400,1150);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Mercedes-Benz','CLA','Coupé',5,'1-MEC-004',2023,2,1332,120,'Automaat',7000,'available',6);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,75,122,225,520,1500);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Skoda','Superb Combi','Combi',5,'1-MEC-005',2022,3,1968,110,'Automaat',34000,'available',6);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,55,89,165,380,1100);

-- Hasselt (locationId=7)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Opel','Mokka','SUV',5,'1-HAS-001',2022,6,0,100,'Automaat',19000,'available',7);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,48,78,143,330,950);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Toyota','RAV4','SUV',5,'1-HAS-002',2022,5,2487,131,'Automaat',32000,'available',7);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,65,105,195,450,1300);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','ID.4','SUV',5,'1-HAS-003',2023,6,0,150,'Automaat',11000,'available',7);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,72,118,215,500,1450);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Fiat','500','Hatchback',4,'1-HAS-004',2022,1,1242,51,'Manueel',22000,'available',7);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,30,49,90,208,600);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Nissan','Qashqai','SUV',5,'1-HAS-005',2021,3,1332,85,'Manueel',51000,'unavailable',7);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,52,84,155,360,1040);

-- Liège (locationId=8)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Peugeot','508','Sedan',5,'1-LGE-001',2022,3,1499,96,'Automaat',28000,'available',8);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,58,94,173,400,1150);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Alfa Romeo','Giulia','Sedan',5,'1-LGE-002',2021,2,1995,147,'Automaat',44000,'available',8);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,69,112,205,475,1380);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('BMW','X3','SUV',5,'1-LGE-003',2022,4,1995,135,'Automaat',19000,'available',8);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,85,139,255,590,1700);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Citroën','Berlingo','Minivan',7,'1-LGE-004',2021,3,1499,96,'Manueel',62000,'available',8);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,49,79,145,340,980);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volvo','V60','Combi',5,'1-LGE-005',2023,5,1969,112,'Automaat',8000,'available',8);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,62,100,185,430,1250);

-- Namen (locationId=9)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Renault','Megane','Hatchback',5,'1-NAM-001',2022,5,1332,104,'Automaat',23000,'available',9);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,45,73,134,312,895);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Honda','CR-V','SUV',5,'1-NAM-002',2021,5,2000,135,'Automaat',38000,'available',9);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,59,95,175,405,1170);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Ford','Mustang Mach-E','SUV',5,'1-NAM-003',2023,6,0,198,'Automaat',6000,'available',9);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,85,139,255,590,1700);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','Passat Variant','Combi',5,'1-NAM-004',2021,3,1968,110,'Automaat',57000,'available',9);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,52,84,155,360,1040);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Peugeot','e-208','Hatchback',5,'1-NAM-005',2023,6,0,100,'Automaat',9000,'available',9);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,40,65,120,278,800);

-- Kortrijk (locationId=10)
INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Mercedes-Benz','A-Klasse','Hatchback',5,'1-KOR-001',2022,2,1332,100,'Automaat',21000,'available',10);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,62,100,185,430,1250);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Toyota','C-HR','SUV',5,'1-KOR-002',2022,5,1798,90,'Automaat',27000,'available',10);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,52,84,155,360,1040);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Volkswagen','ID.3','Hatchback',5,'1-KOR-003',2023,6,0,107,'Automaat',8000,'available',10);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,55,89,165,380,1100);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Jaguar','I-Pace','SUV',5,'1-KOR-004',2022,6,0,294,'Automaat',15000,'available',10);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,119,195,360,840,2400);

INSERT INTO Vehicles (make,model,type,seats,licensePlate,year,engineTypeId,engineCC,powerKW,transmissionType,mileage,availabilityStatus,locationId)
VALUES ('Citroën','SpaceTourer','Minivan',9,'1-KOR-005',2020,3,1499,130,'Automaat',73000,'available',10);
SET @v=SCOPE_IDENTITY(); INSERT INTO VehiclePricing(vehicleId,halfDayPrice,fullDayPrice,weekendPrice,weekPrice,monthPrice) VALUES(@v,75,122,225,520,1500);
GO

-- ─── Verification ────────────────────────────────────────────

DECLARE @vehicleCount INT, @pricingCount INT, @locationCount INT, @engineCount INT;
SELECT @vehicleCount  = COUNT(*) FROM Vehicles;
SELECT @pricingCount  = COUNT(*) FROM VehiclePricing;
SELECT @locationCount = COUNT(*) FROM RentalLocations;
SELECT @engineCount   = COUNT(*) FROM EngineTypes;

PRINT 'Database initialized successfully!';
PRINT 'EngineTypes: '    + CAST(@engineCount   AS NVARCHAR);
PRINT 'RentalLocations: '+ CAST(@locationCount AS NVARCHAR);
PRINT 'Vehicles: '       + CAST(@vehicleCount  AS NVARCHAR);
PRINT 'VehiclePricing: ' + CAST(@pricingCount  AS NVARCHAR);
GO
