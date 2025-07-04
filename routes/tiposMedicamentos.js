const express = require("express")
const { PrismaClient } = require("../generated/prisma")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Get all medication types
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tipos = await prisma.tipoMedic.findMany({
      orderBy: { descripcion: "asc" },
    })
    res.json(tipos)
  } catch (error) {
    console.error("Get medication types error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
