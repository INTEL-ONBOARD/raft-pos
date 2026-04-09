import { config } from 'dotenv'
config()

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Role } from '../src/main/models/role.model'
import { User } from '../src/main/models/user.model'
import { Branch } from '../src/main/models/branch.model'
import { ALL_PERMISSIONS } from '../src/shared/types/permissions'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set')

  await mongoose.connect(uri)
  console.log('[Seed] Connected to MongoDB')

  // Create or update admin role with all permissions
  const adminRole = await Role.findOneAndUpdate(
    { name: 'Super Admin' },
    {
      name: 'Super Admin',
      permissions: ALL_PERMISSIONS,
      maxDiscountPercent: 100,
      requiresSupervisorOverride: false
    },
    { upsert: true, new: true }
  )
  console.log('[Seed] Admin role created/updated:', adminRole._id)

  // Create or reuse a real default branch
  let branch = await Branch.findOne({})
  if (!branch) {
    branch = await Branch.create({ name: 'Main Branch', code: 'MAIN', isActive: true })
    console.log('[Seed] Created default branch:', branch._id)
  } else {
    console.log('[Seed] Using existing branch:', branch._id, branch.name)
  }

  // Create admin user if not exists
  const existing = await User.findOne({ email: 'admin@raftpos.com' })
  if (!existing) {
    const seedPassword = process.env.SEED_ADMIN_PASSWORD
    if (!seedPassword || seedPassword.length < 12) {
      throw new Error(
        'Set SEED_ADMIN_PASSWORD env var (min 12 chars) before running this script.\n' +
          'Example: SEED_ADMIN_PASSWORD="MySecurePass#1" npm run seed'
      )
    }
    const passwordHash = await bcrypt.hash(seedPassword, 12)
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@raftpos.com',
      passwordHash,
      supervisorPin: null,
      roleId: adminRole._id,
      branchId: branch._id,
      isActive: true
    })
    console.log('[Seed] Admin user created:', admin._id)
    console.log('[Seed] Login email: admin@raftpos.com')
  } else {
    console.log('[Seed] Admin user already exists, skipping')
  }

  await mongoose.disconnect()
  console.log('[Seed] Done')
}

seed().catch((err) => {
  console.error('[Seed] Error:', err)
  process.exit(1)
})
