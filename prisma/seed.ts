/** Buat (atau update) akun Owner pertama. Aman dijalankan berulang kali.
 *  Jalankan: npx tsx prisma/seed.ts <email> <password> [nama] */
import { hashPassword } from "../src/lib/auth"
import { prisma } from "../src/lib/prisma"

async function main() {
  const [email, password, name] = process.argv.slice(2)
  if (!email || !password) {
    console.error("Pakai: npx tsx prisma/seed.ts <email> <password> [nama]")
    process.exit(1)
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), role: "owner" },
    create: { email, name: name || "Owner", passwordHash: hashPassword(password), role: "owner" },
  })

  console.log("Owner siap:", user.email, "role:", user.role)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
