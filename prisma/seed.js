// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt"); // เรียกใช้ bcrypt

async function main() {
  // สมมติว่าเราอยากสร้าง User testuser
  const plainPasswordUser = "1234";
  const plainCitizenNum = "1234567890123"; // citizenNumber ที่ไม่ซ้ำกัน

  const hashedCitizenNum = await bcrypt.hash(plainCitizenNum, 10); // hash citizenNumber
  const hashedPasswordUser = await bcrypt.hash(plainPasswordUser, 10);

  await prisma.user.create({
    data: {
      username: "testuser",
      password: hashedPasswordUser, // เก็บค่า hash
      citizenNumber: hashedCitizenNum, // เก็บค่า hash
      fullname: "User For Test",
    },
  });

  // สร้าง Admin admin
  const plainPasswordAdmin = "admin";
  const hashedPasswordAdmin = await bcrypt.hash(plainPasswordAdmin, 10);
  
  await prisma.admin.create({
    data: {
      username: "admin",
      password: hashedPasswordAdmin, // เก็บค่า hash
      fullname: "Administrator",
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
