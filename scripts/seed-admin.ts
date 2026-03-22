import { config } from 'dotenv'
config()

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Role } from '../src/main/models/role.model'
import { User } from '../src/main/models/user.model'
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

  // Create a default branch placeholder ObjectId
  // (real branches created via app — we just need a valid ObjectId for seeding)
  // NOTE: This admin user's branchId will point to a non-existent branch document.
  // After first login, go to Settings → Branches, create your branch, then update
  // the admin user's branchId in User Management to point to the real branch.
  const placeholderBranchId = new mongoose.Types.ObjectId()

  // Create admin user if not exists
  const existing = await User.findOne({ email: 'admin@raftpos.com' })
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@raftpos.com',
      passwordHash,
      supervisorPin: null,
      roleId: adminRole._id,
      branchId: placeholderBranchId,
      isActive: true
    })
    console.log('[Seed] Admin user created:', admin._id)
    console.log('[Seed] Login: admin@raftpos.com / admin123')
    console.log('[Seed] IMPORTANT: Update admin branchId after creating a real branch in Settings')
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
