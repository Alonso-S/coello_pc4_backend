const jwt = require("jsonwebtoken")
const { PrismaClient } = require("../generated/prisma")

const prisma = new PrismaClient()

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nombre: true, apellido: true, rol: true, activo: true },
    })

    if (!user || !user.activo) {
      return res.status(401).json({ message: "Invalid or inactive user" })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.rol !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

module.exports = { authenticateToken, requireAdmin }
