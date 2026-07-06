// Seeds a demo admin user into JPMDO so you can log into the Minda frontend
// locally (your local DB has no users). The User model hashes the password and
// lowercases the email automatically (beforeCreate/beforeUpdate hooks).
//
// Usage:  node scripts/cng-seed-user.js
// Then log in with the EMAIL / PASSWORD printed at the end.

import { sequelize } from "../src/sequelize.js";
import { UserModel } from "../src/models/user.modal.js";

const EMAIL = "demo@cng.local";
const PASSWORD = "Demo@12345";

async function run() {
  await sequelize.authenticate();

  let user = await UserModel.findOne({ where: { email: EMAIL } });
  if (user) {
    user.password = PASSWORD; // beforeUpdate re-hashes
    user.terminate = false;
    user.in_bin = false;
    user.is_admin = true;
    await user.save();
    console.log("✓ Updated existing demo user.");
  } else {
    user = await UserModel.create({
      full_name: "Demo Admin",
      email: EMAIL,
      password: PASSWORD, // beforeCreate hashes
      desigination: "Administrator",
      user_id: "DEMO-001",
      is_admin: true,
      terminate: false,
      in_bin: false,
    });
    console.log("✓ Created demo user.");
  }

  console.log("\n================ LOGIN ================");
  console.log("  Email:    " + EMAIL);
  console.log("  Password: " + PASSWORD);
  console.log("======================================\n");

  await sequelize.close();
  process.exit(0);
}

run().catch((e) => {
  console.error("Seed failed:");
  console.error("  name    :", e?.name);
  console.error("  message :", e?.message);
  console.error("  original:", e?.original?.message);
  console.error("  errors  :", JSON.stringify(e?.errors));
  console.error("  stack   :", e?.stack?.split("\n").slice(0, 4).join("\n"));
  process.exit(1);
});
