const express = require("express")
const { PrismaClient } = require("../generated/prisma")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Get all specialties
router.get("/", authenticateToken, async (req, res) => {
  try {
    const especialidades = await prisma.especialidad.findMany({
      orderBy: { descripcionEsp: "asc" },
    })
    res.json(especialidades)
  } catch (error) {
    console.error("Get specialties error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
