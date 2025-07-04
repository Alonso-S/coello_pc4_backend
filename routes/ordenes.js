const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("../generated/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get user orders
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = req.user.rol === "admin" ? {} : { userId: req.user.id };

    const [ordenes, total] = await Promise.all([
      prisma.ordenVenta.findMany({
        where,
        include: {
          detalles: {
            include: {
              medicamento: true,
            },
          },
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
        skip: Number.parseInt(skip),
        take: Number.parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.ordenVenta.count({ where }),
    ]);

    res.json({
      ordenes,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create order
router.post(
  "/",
  authenticateToken,
  [
    body("detalles").isArray({ min: 1 }),
    body("detalles.*.CodMedicamento").isInt(),
    body("detalles.*.cantidadRequerida").isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Motivo, detalles } = req.body;

      // Calculate totals and validate stock
      let total = 0;
      const detallesConPrecios = [];

      for (const detalle of detalles) {
        const medicamento = await prisma.medicamento.findUnique({
          where: { id: detalle.CodMedicamento },
        });

        if (!medicamento) {
          return res.status(400).json({
            message: `Medication with ID ${detalle.CodMedicamento} not found`,
          });
        }

        if (medicamento.stock < detalle.cantidadRequerida) {
          return res.status(400).json({
            message: `Insufficient stock for ${medicamento.descripcionMed}`,
          });
        }

        const subtotal = medicamento.precioVentaUni * detalle.cantidadRequerida;
        total += subtotal;

        detallesConPrecios.push({
          ...detalle,
          descripcionMed: medicamento.descripcionMed,
          precioUnitario: medicamento.precioVentaUni,
          subtotal,
        });
      }

      // Create order with transaction
      const orden = await prisma.$transaction(async (tx) => {
        // Create order
        const nuevaOrden = await tx.ordenVenta.create({
          data: {
            fechaEmision: new Date(),
            Motivo,
            Situacion: "Pendiente",
            total,
            userId: req.user.id,
          },
        });

        // Create order details and update stock
        for (const detalle of detallesConPrecios) {
          await tx.detalleOrdenVta.create({
            data: {
              NroOrdenVta: nuevaOrden.id,
              CodMedicamento: detalle.CodMedicamento,
              descripcionMed: detalle.descripcionMed,
              cantidadRequerida: detalle.cantidadRequerida,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            },
          });

          // Update medication stock
          await tx.medicamento.update({
            where: { id: detalle.CodMedicamento },
            data: {
              stock: {
                decrement: detalle.cantidadRequerida,
              },
            },
          });
        }

        return nuevaOrden;
      });

      // Fetch complete order
      const ordenCompleta = await prisma.ordenVenta.findUnique({
        where: { id: orden.id },
        include: {
          detalles: {
            include: {
              medicamento: true,
            },
          },
        },
      });

      res.status(201).json(ordenCompleta);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update order status (Admin only or order owner)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { Situacion, Motivo } = req.body;

    // Check if user can edit this order
    const existingOrder = await prisma.ordenVenta.findUnique({
      where: { id: Number.parseInt(id) },
      include: { usuario: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only admin or order owner can edit
    if (req.user.rol !== "admin" && existingOrder.userId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to edit this order",
      });
    }

    // Only allow editing if order is still pending
    if (existingOrder.Situacion !== "Pendiente") {
      return res.status(400).json({
        message: "Only pending orders can be edited",
      });
    }

    const updatedOrder = await prisma.ordenVenta.update({
      where: { id: Number.parseInt(id) },
      data: {
        Situacion: Situacion || existingOrder.Situacion,
        Motivo: Motivo || existingOrder.Motivo,
      },
      include: {
        detalles: {
          include: {
            medicamento: true,
          },
        },
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Update order error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Delete order (Admin only or order owner, only if pending)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can delete this order
    const existingOrder = await prisma.ordenVenta.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        detalles: true,
        usuario: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only admin or order owner can delete
    if (req.user.rol !== "admin" && existingOrder.userId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to delete this order",
      });
    }

    // Only allow deleting if order is still pending
    if (existingOrder.Situacion !== "Pendiente") {
      return res.status(400).json({
        message: "Only pending orders can be deleted",
      });
    }

    // Delete order and restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock for each medication
      for (const detalle of existingOrder.detalles) {
        await tx.medicamento.update({
          where: { id: detalle.CodMedicamento },
          data: {
            stock: {
              increment: detalle.cantidadRequerida,
            },
          },
        });
      }

      // Delete order details first
      await tx.detalleOrdenVta.deleteMany({
        where: { NroOrdenVta: Number.parseInt(id) },
      });

      // Delete order
      await tx.ordenVenta.delete({
        where: { id: Number.parseInt(id) },
      });
    });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Get single order by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const where = req.user.rol === "admin"
      ? { id: Number.parseInt(id) }
      : { id: Number.parseInt(id), userId: req.user.id };

    const orden = await prisma.ordenVenta.findUnique({
      where,
      include: {
        detalles: {
          include: {
            medicamento: true,
          },
        },
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(orden);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
