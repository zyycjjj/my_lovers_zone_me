-- CreateTable
CREATE TABLE `ContentAsset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `workspaceId` INTEGER NULL,
    `toolKey` VARCHAR(32) NOT NULL,
    `title` VARCHAR(128) NULL,
    `content` LONGTEXT NOT NULL,
    `sourcePrompt` LONGTEXT NULL,
    `status` ENUM('saved', 'completed', 'archived') NOT NULL DEFAULT 'saved',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentAsset_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ContentAsset_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `ContentAsset_workspaceId_createdAt_idx`(`workspaceId`, `createdAt`),
    INDEX `ContentAsset_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContentAsset` ADD CONSTRAINT `ContentAsset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentAsset` ADD CONSTRAINT `ContentAsset_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentAsset` ADD CONSTRAINT `ContentAsset_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
