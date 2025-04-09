/*
  Warnings:

  - You are about to drop the column `birth_date` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `death_date` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `Person` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Person` DROP COLUMN `birth_date`,
    DROP COLUMN `death_date`,
    DROP COLUMN `full_name`,
    DROP COLUMN `phone_number`,
    ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `deathDate` DATETIME(3) NULL,
    ADD COLUMN `fullName` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL;
