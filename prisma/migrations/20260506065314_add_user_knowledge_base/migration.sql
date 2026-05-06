-- AlterTable
ALTER TABLE `userprofile` ADD COLUMN `brandKeywords` VARCHAR(512) NULL,
    ADD COLUMN `contentStyle` VARCHAR(64) NULL,
    ADD COLUMN `defaultAudience` VARCHAR(128) NULL;

-- CreateTable
CREATE TABLE `productprofile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userProfileId` INTEGER NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` VARCHAR(64) NULL,
    `price` VARCHAR(32) NULL,
    `sellingPoints` VARCHAR(512) NULL,
    `targetAudience` VARCHAR(256) NULL,
    `platform` VARCHAR(64) NULL,
    `notes` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `productprofile_userProfileId_idx`(`userProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productprofile` ADD CONSTRAINT `productprofile_userProfileId_fkey` FOREIGN KEY (`userProfileId`) REFERENCES `userprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
