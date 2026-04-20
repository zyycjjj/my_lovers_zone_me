-- CreateTable
CREATE TABLE `PaymentOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` VARCHAR(32) NOT NULL,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `planKey` ENUM('experience', 'pro', 'team') NOT NULL,
    `amountFen` INTEGER NOT NULL,
    `status` ENUM('pending', 'paid', 'activated', 'rejected', 'refunded') NOT NULL DEFAULT 'pending',
    `channel` VARCHAR(32) NULL,
    `paymentRef` VARCHAR(128) NULL,
    `proofNote` VARCHAR(255) NULL,
    `adminNote` VARCHAR(255) NULL,
    `paidAt` DATETIME(3) NULL,
    `activatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentOrder_orderNo_key`(`orderNo`),
    INDEX `PaymentOrder_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `PaymentOrder_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `PaymentOrder_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `planKey` ENUM('experience', 'pro', 'team') NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiredAt` DATETIME(3) NULL,
    `orderId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_accountId_status_expiredAt_idx`(`accountId`, `status`, `expiredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentOrder` ADD CONSTRAINT `PaymentOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentOrder` ADD CONSTRAINT `PaymentOrder_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
