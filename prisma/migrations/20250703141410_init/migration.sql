-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `rol` VARCHAR(191) NOT NULL DEFAULT 'user',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcionMed` VARCHAR(191) NULL,
    `fechaFabricacion` DATETIME(3) NULL,
    `fechaVencimiento` DATETIME(3) NULL,
    `Presentacion` VARCHAR(191) NULL,
    `stock` INTEGER NULL,
    `precioVentaUni` DECIMAL(10, 2) NULL,
    `precioVentaPres` DECIMAL(10, 2) NULL,
    `CodTipoMed` INTEGER NULL,
    `Marca` VARCHAR(191) NULL,
    `CodEspec` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleOrdenVta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `NroOrdenVta` INTEGER NULL,
    `CodMedicamento` INTEGER NULL,
    `descripcionMed` VARCHAR(191) NULL,
    `cantidadRequerida` INTEGER NULL,
    `precioUnitario` DECIMAL(10, 2) NULL,
    `subtotal` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenVenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaEmision` DATETIME(3) NULL,
    `Motivo` VARCHAR(191) NULL,
    `Situacion` VARCHAR(191) NULL DEFAULT 'Pendiente',
    `total` DECIMAL(10, 2) NULL,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoMedic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Especialidad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcionEsp` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Medicamento` ADD CONSTRAINT `Medicamento_CodTipoMed_fkey` FOREIGN KEY (`CodTipoMed`) REFERENCES `TipoMedic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicamento` ADD CONSTRAINT `Medicamento_CodEspec_fkey` FOREIGN KEY (`CodEspec`) REFERENCES `Especialidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleOrdenVta` ADD CONSTRAINT `DetalleOrdenVta_NroOrdenVta_fkey` FOREIGN KEY (`NroOrdenVta`) REFERENCES `OrdenVenta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleOrdenVta` ADD CONSTRAINT `DetalleOrdenVta_CodMedicamento_fkey` FOREIGN KEY (`CodMedicamento`) REFERENCES `Medicamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenVenta` ADD CONSTRAINT `OrdenVenta_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
