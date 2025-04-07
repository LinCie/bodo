/*
  Warnings:

  - You are about to alter the column `type` on the `Player` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `size` on the `Player` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `Player` MODIFY `type` ENUM('space', 'user') NULL,
    MODIFY `size` ENUM('person', 'group') NULL,
    MODIFY `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `Space` MODIFY `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE `Person` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NULL,
    `birth_date` DATETIME(3) NULL,
    `death_date` DATETIME(3) NULL,
    `sex` VARCHAR(191) NULL,
    `address` JSON NULL,
    `phone_number` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Person_number_key`(`number`),
    UNIQUE INDEX `Person_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
