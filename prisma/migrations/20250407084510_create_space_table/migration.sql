-- CreateTable
CREATE TABLE `Space` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NULL,
    `typeId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` JSON NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
