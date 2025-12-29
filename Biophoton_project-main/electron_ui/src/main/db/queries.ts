import { db } from './database'
import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { User, NewUser, DatabaseUser } from '@shared/types/user'
import { FilterRemedy, NewDatabaseRemedy, Remedy } from '@shared/types/remedy'
import { users } from '../data/users'
import { remedies } from '../data/remedies'
import { Session, NewSession, ShortSession, SessionData } from '@shared/types/session'
import path from 'node:path'
import fsp from 'node:fs/promises'
import { categories } from '../data/categories'
import { subcategories } from '../data/subcategories'
import { meridians } from '../data/meridians'
import { Category } from '@shared/types/category'
import { Subcategory } from '@shared/types/subcategory'
import { Meridian } from '@shared/types/meridian'
import { Program } from '../../../shared/types/program'
import { programs } from '../data/programs'
import { Step } from '@shared/types/step'
import { steps } from '../data/steps'
import { Static } from '@shared/types/static'

// Run migrations
const migrationsPath = app.isPackaged
  ? join(process.resourcesPath, 'db', 'migrations.sql')
  : join(process.cwd(), 'resources/db/migrations.sql') // for dev

const migrations = fs.readFileSync(migrationsPath, 'utf-8')
db.exec(migrations)

const INSERT_USER_SQL = `
  INSERT INTO clients (
    first_name, last_name, photo_file, gender, date_of_birth,
    blood_frequency, saliva_frequency, photo_frequency,
    symptoms, active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

const mapUserToParams = (user: NewUser): (string | number | null)[] => [
  user.firstName,
  user.lastName,
  user.photoFile || null,
  user.gender,
  user.dateOfBirth,
  user.blood || null,
  user.saliva || null,
  user.photo || null,
  user.symptoms || null,
  user.active ? 1 : 0
]

// Seed clients
const insertUser = db.prepare(INSERT_USER_SQL)

// Check if table already has users to avoid duplicates
const count = db.prepare(`SELECT COUNT(*) as total FROM clients`).get().total

if (count === 0) {
  // Insert two users

  const insertMany = db.transaction((rows: NewUser[]) => {
    for (const u of rows) {
      insertUser.run(...mapUserToParams(u))
    }
  })

  insertMany(users)
}

const countCategories = db.prepare(`SELECT COUNT(*) as total FROM categories`).get().total

if (countCategories === 0) {
  // Seed categories
  const insertCategories = db.prepare(`INSERT INTO categories (id, name) VALUES (?, ?)`)

  const insertMany = db.transaction((rows: Category[]) => {
    for (const category of rows) {
      insertCategories.run(category.id, category.name)
    }
  })

  insertMany(categories)
}

const countSubategories = db.prepare(`SELECT COUNT(*) as total FROM subcategories`).get().total

if (countSubategories === 0) {
  // Seed subcategories
  const insertSubCategories = db.prepare(
    `INSERT INTO subcategories (id, name, category_id) VALUES (?, ?, ?)`
  )

  const insertMany = db.transaction((rows: Subcategory[]) => {
    for (const sub of rows) {
      insertSubCategories.run(sub.id, sub.name, sub.category_id)
    }
  })

  insertMany(subcategories)
}

const countMeridians = db.prepare(`SELECT COUNT(*) as total FROM meridians`).get().total

if (countMeridians === 0) {
  // Seed meridians
  const insertMeridians = db.prepare(`INSERT INTO meridians (id, name) VALUES (?, ?)`)

  const insertMany = db.transaction((rows: Meridian[]) => {
    for (const meridian of rows) {
      insertMeridians.run(meridian.id, meridian.name)
    }
  })

  insertMany(meridians)
}

const INSERT_REMEDIES_SQL = `
  INSERT INTO remedies (name, category_id, subcategory_id, frequency, description, components)
  VALUES (?, ?, ?, ?, ?, ?)
`

// Check if table already has remedies to avoid duplicates
const countRemedies = db.prepare(`SELECT COUNT(*) as total FROM remedies`).get().total

if (countRemedies === 0) {
  // Seed remedies
  const insertRemedies = db.prepare(INSERT_REMEDIES_SQL)
  const insertRemedyMerdians = db.prepare(
    `INSERT INTO remedies_meridians (remedy_id, meridian_id) VALUES (?, ?)`
  )
  // Insert predefined remedies
  const insertMany = db.transaction((rows: NewDatabaseRemedy[]) => {
    for (const remedy of rows) {
      const result = insertRemedies.run(
        remedy.name,
        remedy.category_id,
        remedy.subcategory_id,
        remedy.frequency,
        remedy.description,
        remedy.components
      )
      const remedyId = result.lastInsertRowid
      for (const m of remedy.meridians) {
        insertRemedyMerdians.run(remedyId, m)
      }
    }
  })

  insertMany(remedies)
}

const INSERT_PROGRAMS_SQL = `
  INSERT INTO programs (id, name, icon, option_title)
  VALUES (?, ?, ?, ?)
`

const countPrograms = db.prepare(`SELECT COUNT(*) as total FROM programs`).get().total

if (countPrograms === 0) {
  // Seed programs
  const insertPrograms = db.prepare(INSERT_PROGRAMS_SQL)
  const insertProgramVariant = db.prepare(
    `INSERT INTO program_variants (program_id, session_type_id, variant_label, time) VALUES (?, ?, ?, ?)`
  )
  // Insert predefined programs
  const insertMany = db.transaction((rows: Program[]) => {
    for (const p of rows) {
      const result = insertPrograms.run(p.id, p.name, p.icon, p.optionTitle)
      const programId = result.lastInsertRowid
      if (Array.isArray(p.totalTime)) {
        if (Array.isArray(p.options)) {
          p.totalTime.forEach((time, index) => {
            insertProgramVariant.run(programId, null, p.options![index], time)
          })
        } else {
          p.totalTime.forEach((time, index) => {
            insertProgramVariant.run(programId, index + 1, null, time)
          })
        }
      } else {
        insertProgramVariant.run(programId, null, null, p.totalTime)
      }
    }
  })

  insertMany(programs)

  const INSERT_STEPS_SQL = `
    INSERT INTO session_steps (id, session_type_id, step_number, step_label, has_remedies)
    VALUES (?, ?, ?, ?, ?)
  `
  const insertSteps = db.prepare(INSERT_STEPS_SQL)
  const insertStepPrograms = db.prepare(
    `INSERT INTO step_programs (step_id, program_id, sort_index) VALUES (?, ?, ?)`
  )
  // Insert predefined programs
  const insertMany2 = db.transaction((rows: Step[]) => {
    for (const s of rows) {
      const result = insertSteps.run(s.id, s.type, s.stepNumber, s.label, s.showRemedies ? 1 : 0)
      const stepId = result.lastInsertRowid
      s.programs.forEach((p, index) => {
        insertStepPrograms.run(stepId, p, index + 1)
      })
    }
  })

  insertMany2(steps)
}

// Get categories, subcategories, meridians, programs, steps
export const getStaticData = (): Static => {
  const stmtCategories = db.prepare(`
    SELECT * FROM categories
  `)
  const stmtSubcategories = db.prepare(`
    SELECT * FROM subcategories
  `)
  const stmtMeridians = db.prepare(`
    SELECT * FROM meridians
  `)
  const stmtPrograms = db.prepare(`
    SELECT * FROM programs
  `)
  const stmtProgramVariants = db.prepare(`
    SELECT * FROM program_variants WHERE program_id = ?
  `)
  const stmSteps = db.prepare(`
    SELECT * FROM session_steps
  `)
  const stmStepPrograms = db.prepare(`
    SELECT * FROM step_programs WHERE step_id = ?
  `)

  const categories = stmtCategories.all()
  const subcategories = stmtSubcategories.all()
  const meridians = stmtMeridians.all()
  const programs = stmtPrograms.all().map((p) => {
    const variants = stmtProgramVariants.all(p.id)
    let options = [] as string[] | undefined
    let totalTime = [] as string[]
    const programVariantIds = [] as number[]
    if (variants.length > 1) {
      variants.forEach((v) => {
        totalTime.push(v.time)
        programVariantIds.push(v.id)
        if (v.variant_label) options!.push(v.variant_label)
      })
    } else {
      options = undefined
      totalTime = variants[0].time
      programVariantIds.push(variants[0].id)
    }
    if (options?.length == 0) options = undefined
    return {
      id: p.id,
      label: p.name,
      icon: p.icon,
      optionTitle: p.option_title,
      options,
      totalTime,
      programVariantIds
    }
  })
  const steps = stmSteps.all().map((s) => {
    const stepPrograms = stmStepPrograms.all(s.id)
    return {
      id: s.id,
      label: s.step_label,
      isAdult: s.session_type_id == 1,
      showRemedies: !!s.has_remedies,
      stepNumber: s.step_number,
      programs: stepPrograms.map((p) => p.program_id)
    }
  })

  return {
    categories,
    subcategories,
    meridians,
    programs,
    steps
  }
}

//CLIENTS
const mapUser = (row: DatabaseUser): User => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  photoFile: row.photo_file,
  gender: row.gender,
  dateOfBirth: row.date_of_birth,
  blood: row.blood_frequency,
  saliva: row.saliva_frequency,
  photo: row.photo_frequency,
  symptoms: row.symptoms || '',
  active: !!row.active
})

export const createClient = (user: NewUser): number => {
  const stmt = db.prepare(INSERT_USER_SQL)

  const result = stmt.run(...mapUserToParams(user))

  return result.lastInsertRowid as number
}

export const createClientsMany = db.transaction((rows: NewUser[]): number[] => {
  const ids: number[] = []
  const stmt = db.prepare(INSERT_USER_SQL)
  for (const u of rows) {
    const res = stmt.run(...mapUserToParams(u))
    ids.push(Number(res.lastInsertRowid))
  }
  return ids
})

export const deleteClientsMany = (ids: number[]): void => {
  if (!ids?.length) return
  const avatarsDir = path.join(app.getPath('userData'), 'avatars')
  const getPhoto = db.prepare(`SELECT photo_file FROM clients WHERE id = ?`)
  const delClient = db.prepare(`DELETE FROM clients WHERE id = ?`)

  // 1) do DB delete in a transaction (cascades will clear sessions/session_programs/session_program_remedies)
  const photos: string[] = []
  db.transaction((arr: number[]) => {
    for (const id of arr) {
      const row = getPhoto.get(id) as { photo_file?: string } | undefined
      if (row?.photo_file) photos.push(path.basename(row.photo_file)) // store only filename
      delClient.run(id)
    }
  })(ids)

  // 2) best-effort delete avatar files on disk (outside SQL tx)
  for (const file of photos) {
    const full = path.join(avatarsDir, file)
    fsp.unlink(full).catch(() => {})
  }
}

export const updateClient = (id: number, user: NewUser): void => {
  const stmt = db.prepare(`
        UPDATE clients SET
            first_name=?, last_name=?, photo_file=?, gender=?, date_of_birth=?,
            blood_frequency=?, saliva_frequency=?, photo_frequency=?,
            symptoms=?, active=?
        WHERE id=?
    `)

  return stmt.run(
    user.firstName,
    user.lastName,
    user.photoFile,
    user.gender,
    user.dateOfBirth,
    user.blood,
    user.saliva,
    user.photo,
    user.symptoms,
    user.active ? 1 : 0,
    id
  )
}

export const getClients = (
  search = ''
): (User & { lastSession?: string; daysSinceLastSession?: number })[] => {
  const stmt = db.prepare(`
    SELECT c.*, COALESCE(MAX(s.date_time), '') AS last_session
    FROM clients c
    LEFT JOIN sessions s ON c.id = s.client_id
    WHERE c.first_name LIKE ? OR c.last_name LIKE ?
    GROUP BY c.id
    ORDER BY c.first_name ASC
  `)

  const rows = stmt.all(`%${search}%`, `%${search}%`)

  return rows.map((row: DatabaseUser) => {
    const user = mapUser(row)
    const lastSession = row.last_session || null
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      ...user,
      lastSession,
      daysSinceLastSession
    }
  })
}

export const getClientById = (id: number): User | null => {
  const row = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id)
  return row ? mapUser(row) : null
}

export const deleteClient = (id: number): void => {
  db.prepare(`DELETE FROM clients WHERE id = ?`).run(id)
}

// REMEDIES
export const createRemedy = (remedy: Remedy): number => {
  const stmt = db.prepare(INSERT_REMEDIES_SQL)
  const result = stmt.run(
    remedy.name,
    remedy.categoryId,
    remedy.subcategoryId,
    remedy.frequency,
    remedy.description,
    remedy.components
  )
  const remedyId = result.lastInsertRowid
  const insertRemedyMerdians = db.prepare(
    `INSERT INTO remedies_meridians (remedy_id, meridian_id) VALUES (?, ?)`
  )
  for (const m of remedy.meridianIds) {
    insertRemedyMerdians.run(remedyId, m)
  }
  return remedyId
}

export const createRemediesMany = db.transaction((rows: Remedy[]): number[] => {
  const stmt = db.prepare(INSERT_REMEDIES_SQL)
  const ids: number[] = []
  for (const r of rows) {
    const res = stmt.run(
      r.name,
      r.categoryId,
      r.subcategoryId,
      r.frequency,
      r.description,
      r.components
    )
    const remedyId = res.lastInsertRowid
    const insertRemedyMerdians = db.prepare(
      `INSERT INTO remedies_meridians (remedy_id, meridian_id) VALUES (?, ?)`
    )
    for (const m of r.meridianIds) {
      insertRemedyMerdians.run(remedyId, m)
    }
    ids.push(Number(remedyId))
  }
  return ids
})

export const updateRemedy = (id: number, r: Remedy): void => {
  const stmt = db.prepare(`
    UPDATE remedies
       SET name = ?,
           category_id = ?,
           subcategory_id = ?,
           frequency = ?,
           description = ?,
           components = ?
     WHERE id = ?
  `)
  stmt.run(r.name, r.categoryId, r.subcategoryId, r.frequency, r.description, r.components, id)
  // Step 1: Delete old meridians not in new list
  const placeholders = r.meridianIds.map(() => '?').join(',')
  if (r.meridianIds.length > 0) {
    db.prepare(
      `DELETE FROM remedies_meridians 
       WHERE remedy_id = ? AND meridian_id NOT IN (${placeholders})`
    ).run(r.id, ...r.meridianIds)
  } else {
    // If list is empty, remove all
    db.prepare(`DELETE FROM remedies_meridians WHERE remedy_id = ?`).run(r.id)
  }

  // Step 2: Insert new meridians not in table
  const existing = db
    .prepare(`SELECT meridian_id FROM remedies_meridians WHERE remedy_id = ?`)
    .all(r.id)
    .map((r) => r.meridian_id.toString())

  const toInsert = r.meridianIds.filter((id) => !existing.includes(id))
  for (const id of toInsert) {
    db.prepare(`INSERT INTO remedies_meridians (remedy_id, meridian_id) VALUES (?, ?)`).run(
      r.id,
      id
    )
  }
}

export const deleteRemediesMany = db.transaction((ids: number[]): void => {
  if (!ids?.length) return
  const del = db.prepare(`DELETE FROM remedies WHERE id = ?`)
  const delMeridians = db.prepare(`DELETE FROM remedies_meridians WHERE remedy_id = ?`)
  for (const id of ids) {
    del.run(id)
    delMeridians.run(id)
  }
})

export const getRemedies = (filters: FilterRemedy): Remedy[] => {
  let query = `
    SELECT r.*, c.name AS category, s.name as subcategory
    FROM remedies r JOIN categories c ON r.category_id=c.id JOIN subcategories s ON r.subcategory_id=s.id
    WHERE 1=1
  `
  const params: (string | number)[] = []
  if (filters.meridian_id) {
    query = `SELECT r.* FROM remedies r JOIN remedies_meridians rm ON rm.remedy_id=r.id WHERE meridian_id = ?`
    params.push(filters.meridian_id)
  }
  if (filters.category_id) {
    query += ` AND category = ?`
    params.push(filters.category_id)
  }
  if (filters.subcategory_id) {
    query += ` AND subcategory_id = ?`
    params.push(filters.subcategory_id)
  }
  const prepare = db.prepare(
    `SELECT m.name, m.id FROM remedies_meridians rm JOIN meridians m ON rm.meridian_id = m.id WHERE rm.remedy_id = ?`
  )
  return db
    .prepare(query)
    .all(...params)
    .map((r) => {
      const meridians = prepare.all(r.id)
      return {
        id: r.id,
        name: r.name,
        frequency: r.frequency,
        category: r.category,
        categoryId: r.category_id,
        subcategory: r.subcategory,
        subcategoryId: r.subcategory_id,
        meridians: meridians.map((m) => m.name),
        meridianIds: meridians.map((m) => m.id.toString()),
        description: r.description,
        components: r.components
      }
    })
}

// SESSIONS
export const createSession = (sessionData: NewSession): number => {
  const insertSession = db.prepare(`
    INSERT INTO sessions (client_id, recommendation, symptoms, type, session_type_id)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertSessionMeridians = db.prepare(`
    INSERT INTO session_meridians (session_id, meridian_id) VALUES (?, ?)
  `)

  const insertSessionProgram = db.prepare(`
    INSERT INTO session_programs (session_id, program_id, program_variant_id, step_number) VALUES (?, ?, ?, ?)
  `)

  const insertSessionProgramRemedy = db.prepare(`
    INSERT INTO session_program_remedies (session_id, program_variant_id, remedy_id) VALUES (?, ?, ?)
  `)

  const insertMeasurements = db.prepare(`
    INSERT INTO measurements (session_id, point_id, is_dropping, origin, is_after)
    VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((data: Session) => {
    // 1. Insert session
    const sessionResult = insertSession.run(
      data.userId ?? null,
      data.recommendation || null,
      data.symptoms ?? null,
      data.type,
      data.isAdult ? 1 : 2
    )

    const sessionId = sessionResult.lastInsertRowid as number

    // 2. Insert programs & remedies
    for (const program of data.programs) {
      // Link program to session
      insertSessionProgram.run(sessionId, program.programId, program.programVariantId, program.step)

      // Add remedies for this program
      for (const remedy of program.remedies) {
        insertSessionProgramRemedy.run(sessionId, program.programVariantId, remedy.id)
      }
    }

    // 3. Insert focus meridians
    for (const meridian of data.meridians || []) {
      insertSessionMeridians.run(sessionId, meridian)
    }

    for (const point of data.droppingPoints.lh || []) {
      insertMeasurements.run(sessionId, point, 1, 1, 0)
    }

    for (const point of data.droppingPoints.rh || []) {
      insertMeasurements.run(sessionId, point, 1, 2, 0)
    }

    for (const point of data.droppingPoints.lf || []) {
      insertMeasurements.run(sessionId, point, 1, 3, 0)
    }

    for (const point of data.droppingPoints.rf || []) {
      insertMeasurements.run(sessionId, point, 1, 4, 0)
    }

    for (const point of data.droppingAfterPoints.lh || []) {
      insertMeasurements.run(sessionId, point, 1, 1, 1)
    }

    for (const point of data.droppingAfterPoints.rh || []) {
      insertMeasurements.run(sessionId, point, 1, 2, 1)
    }

    for (const point of data.droppingAfterPoints.lf || []) {
      insertMeasurements.run(sessionId, point, 1, 3, 1)
    }

    for (const point of data.droppingAfterPoints.rf || []) {
      insertMeasurements.run(sessionId, point, 1, 4, 1)
    }

    return sessionId
  })

  return transaction(sessionData)
}

export const getSessionsByClientId = (clientId: number): ShortSession[] => {
  const sessions = db
    .prepare(`SELECT id, date_time FROM sessions WHERE client_id = ? ORDER BY date_time ASC`)
    .all(clientId) as { id: number; date_time: string }[]

  return sessions.map((s) => ({
    id: s.id,
    dateTime: s.date_time
  }))
}

export const getSessionById = (sessionId: number): SessionData | null => {
  // 1. Fetch session info
  const session = db
    .prepare(
      `SELECT client_id, recommendation, date_time, symptoms, type, session_type_id FROM sessions WHERE id = ?`
    )
    .get(sessionId)
  if (!session) return null

  // 2. Fetch client info
  const user = db
    .prepare(`SELECT first_name, last_name FROM clients WHERE id = ?`)
    .get(session.client_id) as { first_name: string; last_name: string }

  // 3. Fetch programs linked to the session
  const programs = db
    .prepare(
      `
      SELECT p.id, p.name, pv.id AS program_variant_id, pv.time, pv.variant_label, sp.step_number
      FROM programs p
      JOIN program_variants pv ON p.id = pv.program_id
      JOIN session_programs sp ON pv.id = sp.program_variant_id
      WHERE sp.session_id = ?
    `
    )
    .all(sessionId) as {
    id: number
    program_variant_id: number
    name: string
    time: string
    variant_label: string | null
    step_number: number | null
  }[]

  // 4. For each program, fetch remedies
  const programsWithRemedies = programs.map((program) => {
    const remedies = db
      .prepare(
        `
        SELECT r.*
        FROM remedies r
        JOIN session_program_remedies spr ON r.id = spr.remedy_id
        WHERE spr.session_id = ? AND spr.program_variant_id = ?
      `
      )
      .all(sessionId, program.program_variant_id) as Remedy[]

    return {
      programId: program.id,
      programVariantId: program.program_variant_id,
      programLabel: program.name,
      time: program.time,
      programOption: program.variant_label ?? '',
      step: program.step_number ?? 1,
      remedies
    }
  })

  // 5. Fetch focus meridians
  const meridians = db
    .prepare(
      `
      SELECT m.name
      FROM session_meridians sm
      JOIN meridians m ON m.id = sm.meridian_id
      WHERE sm.session_id = ?
    `
    )
    .all(sessionId)
    .map((row: { name: string }) => row.name)

  // 6. Fetch points
  const pointsLH = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 1 AND is_after = 0
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsRH = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 2 AND is_after = 0
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsLF = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 3 AND is_after = 0
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsRF = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 4 AND is_after = 0
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)

  const pointsAfterLH = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 1 AND is_after = 1
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsAfterRH = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 2 AND is_after = 1
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsAfterLF = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 3 AND is_after = 1
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)
  const pointsAfterRF = db
    .prepare(
      `
      SELECT point_id
      FROM measurements
      WHERE session_id = ? AND origin = 4 AND is_after = 1
    `
    )
    .all(sessionId)
    .map((row: { point_id: number }) => row.point_id)

  // 7. Return formatted session detail
  return {
    user: {
      firstName: user.first_name,
      lastName: user.last_name
    },
    programs: programsWithRemedies,
    meridians,
    recommendation: session.recommendation || '',
    dateTime: session.date_time,
    type: session.type,
    isAdult: session.session_type_id == 1,
    symptoms: session.symptoms,
    droppingPoints: {
      lh: pointsLH,
      rh: pointsRH,
      lf: pointsLF,
      rf: pointsRF
    },
    droppingAfterPoints: {
      lh: pointsAfterLH,
      rh: pointsAfterRH,
      lf: pointsAfterLF,
      rf: pointsAfterRF
    }
  }
}
