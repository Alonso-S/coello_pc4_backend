const { PrismaClient } = require("../generated/prisma")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pharmacy.com" },
    update: {},
    create: {
      email: "admin@pharmacy.com",
      password: hashedPassword,
      nombre: "Admin",
      apellido: "System",
      rol: "admin",
    },
  })

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 12)
  const regularUser = await prisma.user.upsert({
    where: { email: "user@pharmacy.com" },
    update: {},
    create: {
      email: "user@pharmacy.com",
      password: userPassword,
      nombre: "Juan",
      apellido: "Pérez",
      rol: "user",
    },
  })

  // Create medication types
  const tipoAnalgesico = await prisma.tipoMedic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      descripcion: "Analgésico",
    },
  })

  const tipoAntibiotico = await prisma.tipoMedic.upsert({
    where: { id: 2 },
    update: {},
    create: {
      descripcion: "Antibiótico",
    },
  })

  // Create specialties
  const espCardiologia = await prisma.especialidad.upsert({
    where: { id: 1 },
    update: {},
    create: {
      descripcionEsp: "Cardiología",
    },
  })

  const espNeurologia = await prisma.especialidad.upsert({
    where: { id: 2 },
    update: {},
    create: {
      descripcionEsp: "Neurología",
    },
  })

  // Create medications
  await prisma.medicamento.createMany({
    data: [
      {
        descripcionMed: "Paracetamol 500mg",
        fechaFabricacion: new Date("2024-01-01"),
        fechaVencimiento: new Date("2026-01-01"),
        Presentacion: "Tabletas",
        stock: 100,
        precioVentaUni: 0.5,
        precioVentaPres: 12.0,
        CodTipoMed: tipoAnalgesico.id,
        Marca: "Genérico",
        CodEspec: espNeurologia.id,
      },
      {
        descripcionMed: "Amoxicilina 500mg",
        fechaFabricacion: new Date("2024-02-01"),
        fechaVencimiento: new Date("2026-02-01"),
        Presentacion: "Cápsulas",
        stock: 50,
        precioVentaUni: 1.2,
        precioVentaPres: 24.0,
        CodTipoMed: tipoAntibiotico.id,
        Marca: "Laboratorio ABC",
        CodEspec: espCardiologia.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log("Seed completed successfully!")
  console.log("Admin user: admin@pharmacy.com / admin123")
  console.log("Regular user: user@pharmacy.com / user123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
