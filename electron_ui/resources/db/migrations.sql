CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    photo_file TEXT,  -- path of photo file
    gender INTEGER,  -- 1 - 'Male', 2 - 'Female', 3 - 'Non-Binary'
    date_of_birth TEXT,
    blood_frequency REAL,
    saliva_frequency REAL,
    photo_frequency REAL,
    symptoms TEXT,
    active INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meridians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS remedies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER NOT NULL,
    frequency REAL NOT NULL,
    description TEXT,
    components TEXT,
    sort_index INTEGER,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY(subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS remedies_meridians (
    remedy_id INTEGER NOT NULL,
    meridian_id INTEGER NOT NULL,
    PRIMARY KEY(remedy_id, meridian_id),
    FOREIGN KEY(remedy_id) REFERENCES remedies(id) ON DELETE CASCADE,
    FOREIGN KEY(meridian_id) REFERENCES meridians(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    option_title INTEGER
);

CREATE TABLE IF NOT EXISTS program_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    session_type_id INTEGER,   -- 1 - Adult, 2 - Kid, Null - Both
    variant_label TEXT,       -- e.g. "Short" | "Medium" | "Long" if program has options
    -- duration_seconds INTEGER NOT NULL CHECK(duration_seconds >= 0),
    time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_type_id INTEGER NOT NULL,  -- 1 - Adult, 2 - Kid
    step_number INTEGER NOT NULL,
    step_label TEXT NOT NULL,          -- e.g., "Pre Session"
    has_remedies INTEGER DEFAULT 0,
    UNIQUE(session_type_id, step_number)
);

CREATE TABLE IF NOT EXISTS step_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    step_id INTEGER NOT NULL REFERENCES session_steps(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    sort_index INTEGER NOT NULL DEFAULT 1,
    UNIQUE(step_id, program_id, sort_index)
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    recommendation TEXT,
    symptoms TEXT,
    type INTEGER NOT NULL DEFAULT 1,  -- 1 - Session, 2 - Inversion, 3 - Medbed
    session_type_id INTEGER NOT NULL,  -- 1 - Adult, 2 - Kid
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_meridians (
    session_id INTEGER NOT NULL,
    meridian_id INTEGER NOT NULL,
    PRIMARY KEY(session_id, meridian_id),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(meridian_id) REFERENCES meridians(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_programs (
    session_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    program_variant_id INTEGER NOT NULL,
    step_number INTEGER,
    PRIMARY KEY(session_id, program_id, program_variant_id),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY(program_variant_id) REFERENCES program_variants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS program_remedies (
    program_variant_id INTEGER NOT NULL,
    remedy_id INTEGER NOT NULL,
    PRIMARY KEY(program_variant_id, remedy_id),
    FOREIGN KEY(program_variant_id) REFERENCES program_variants(id) ON DELETE CASCADE,
    FOREIGN KEY(remedy_id) REFERENCES remedies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_program_remedies (
  session_id INTEGER NOT NULL,
  program_variant_id INTEGER NOT NULL,
  remedy_id INTEGER NOT NULL,
  PRIMARY KEY (session_id, program_variant_id, remedy_id),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(program_variant_id) REFERENCES program_variants(id) ON DELETE CASCADE,
  FOREIGN KEY(remedy_id) REFERENCES remedies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,
    is_dropping INTEGER DEFAULT 0,
    origin INTEGER NOT NULL,  -- 1 - LH, 2 - RH, 3 - LF, 4 - RF
    is_after INTEGER DEFAULT 0,  -- Measurement is before or after handrod session
    FOREIGN KEY(session_id) REFERENCES sessions(id)
);
