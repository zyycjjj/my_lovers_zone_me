-- CreateTable
CREATE TABLE `ContentPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `description` VARCHAR(512) NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'weekly',
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentPlan_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    INDEX `ContentPlan_userId_type_idx`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentPlanTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `dayNumber` INTEGER NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `description` VARCHAR(512) NULL,
    `hint` VARCHAR(256) NULL,
    `toolKey` VARCHAR(32) NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `completedAt` DATETIME(3) NULL,
    `assetId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentPlanTask_planId_status_idx`(`planId`, `status`),
    UNIQUE INDEX `ContentPlanTask_planId_dayNumber_key`(`planId`, `dayNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuotaUsage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `planKey` VARCHAR(32) NOT NULL,
    `quotaKey` VARCHAR(64) NOT NULL,
    `amount` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(256) NULL,
    `refType` VARCHAR(32) NULL,
    `refId` INTEGER NULL,
    `balanceAfter` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuotaUsage_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `QuotaUsage_userId_quotaKey_createdAt_idx`(`userId`, `quotaKey`, `createdAt`),
    INDEX `QuotaUsage_accountId_createdAt_idx`(`accountId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContentPlan` ADD CONSTRAINT `ContentPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentPlanTask` ADD CONSTRAINT `ContentPlanTask_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `ContentPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentPlanTask` ADD CONSTRAINT `ContentPlanTask_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `ContentAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuotaUsage` ADD CONSTRAINT `QuotaUsage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
