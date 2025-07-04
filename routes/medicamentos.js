const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("../generated/prisma");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all medications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
        OR: [{ descripcionMed: { contains: search } }, {
          Marca: { contains: search },
        }],
      }
      : {};

    const [medicamentos, total] = await Promise.all([
      prisma.medicamento.findMany({
        where,
        include: {
          tipoMedic: true,
          especialidad: true,
        },
        skip: Number.parseInt(skip),
        take: Number.parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicamento.count({ where }),
    ]);

    res.json({
      medicamentos,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get medications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get medication by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        tipoMedic: true,
        especialidad: true,
      },
    });

    if (!medicamento) {
      return res.status(404).json({ message: "Medication not found" });
    }

    res.json(medicamento);
  } catch (error) {
    console.error("Get medication error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create medication (Admin only)
router.post(
  "/",
  [authenticateToken, requireAdmin],
  [
    body("descripcionMed").trim().isLength({ min: 1 }),
    body("stock").isInt({ min: 0 }),
    body("precioVentaUni").isDecimal({ decimal_digits: "0,2" }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const medicamento = await prisma.medicamento.create({
        data: req.body,
        include: {
          tipoMedic: true,
          especialidad: true,
        },
      });

      res.status(201).json(medicamento);
    } catch (error) {
      console.error("Create medication error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update medication (Admin only)
router.put("/:id", [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    // Filtrar solo los campos permitidos para actualizar
    const {
      descripcionMed,
      fechaFabricacion,
      fechaVencimiento,
      Presentacion,
      stock,
      precioVentaUni,
      precioVentaPres,
      CodTipoMed,
      Marca,
      CodEspec,
    } = req.body;

    // Convertir fechas a formato ISO si existen
    const data = {
      ...(descripcionMed !== undefined && { descripcionMed }),
      ...(fechaFabricacion !== undefined &&
        {
          fechaFabricacion: fechaFabricacion
            ? new Date(fechaFabricacion).toISOString()
            : undefined,
        }),
      ...(fechaVencimiento !== undefined &&
        {
          fechaVencimiento: fechaVencimiento
            ? new Date(fechaVencimiento).toISOString()
            : undefined,
        }),
      ...(Presentacion !== undefined && { Presentacion }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(precioVentaUni !== undefined &&
        { precioVentaUni: Number(precioVentaUni) }),
      ...(precioVentaPres !== undefined &&
        { precioVentaPres: Number(precioVentaPres) }),
      ...(CodTipoMed !== undefined && { CodTipoMed: Number(CodTipoMed) }),
      ...(Marca !== undefined && { Marca }),
      ...(CodEspec !== undefined && { CodEspec: Number(CodEspec) }),
    };

    const medicamento = await prisma.medicamento.update({
      where: { id: Number.parseInt(id) },
      data,
      include: {
        tipoMedic: true,
        especialidad: true,
      },
    });

    res.json(medicamento);
  } catch (error) {
    console.error("Update medication error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Medication not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Delete medication (Admin only)
router.delete("/:id", [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.medicamento.delete({
      where: { id: Number.parseInt(id) },
    });

    res.json({ message: "Medication deleted successfully" });
  } catch (error) {
    console.error("Delete medication error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Medication not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
