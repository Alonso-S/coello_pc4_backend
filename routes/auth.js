const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const { PrismaClient } = require("../generated/prisma")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("nombre").trim().isLength({ min: 2 }),
    body("apellido").trim().isLength({ min: 2 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, nombre, apellido, rol = "user" } = req.body

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido,
          rol,
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          rol: true,
          createdAt: true,
        },
      })

      // Generate token
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" })

      res.status(201).json({
        message: "User created successfully",
        token,
        user,
      })
    } catch (error) {
      console.error("Register error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Login
router.post("/login", [body("email").isEmail().normalizeEmail(), body("password").exists()], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.activo) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
