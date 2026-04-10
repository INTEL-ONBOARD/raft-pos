const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://Vercel-Admin-atlas-bole-drum:VdbAV9Wt4XDKbNgs@atlas-bole-drum.81ktiub.mongodb.net/?retryWrites=true&w=majority";
async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected");
  const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    permissions: { type: [String], default: [] },
    maxDiscountPercent: { type: Number, default: 0 },
    requiresSupervisorOverride: { type: Boolean, default: false }
  }, { timestamps: true });
  try {
    const Role = mongoose.model('Role');
  } catch(e) {
    mongoose.model('Role', roleSchema);
  }
  const Role = mongoose.model('Role');
  console.log("Creating role...");
  const role = await Role.create({
    name: 'test-script-role-' + Date.now(),
    permissions: [],
    maxDiscountPercent: 0,
    requiresSupervisorOverride: false
  });
  console.log("Created successfully:", role.name);
  await Role.deleteOne({ _id: role._id });
  console.log("Cleaned up");
  await mongoose.disconnect();
}
test().catch(console.error);
