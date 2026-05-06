-- CreateTable
CREATE TABLE `supportconnection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerUserId` INTEGER NOT NULL,
    `ownerAccountId` INTEGER NULL,
    `supporterAccountId` INTEGER NULL,
    `supporterName` VARCHAR(64) NOT NULL,
    `supporterContact` VARCHAR(128) NULL,
    `inviteCode` VARCHAR(32) NOT NULL,
    `note` VARCHAR(255) NULL,
    `status` ENUM('invited', 'active', 'removed') NOT NULL DEFAULT 'invited',
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supportconnection_inviteCode_key`(`inviteCode`),
    INDEX `supportconnection_ownerUserId_status_createdAt_idx`(`ownerUserId`, `status`, `createdAt`),
    INDEX `supportconnection_ownerAccountId_status_idx`(`ownerAccountId`, `status`),
    INDEX `supportconnection_supporterAccountId_status_idx`(`supporterAccountId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supportsharedasset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `connectionId` INTEGER NOT NULL,
    `assetId` INTEGER NOT NULL,
    `ownerUserId` INTEGER NOT NULL,
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `supportsharedasset_connectionId_assetId_key`(`connectionId`, `assetId`),
    INDEX `supportsharedasset_ownerUserId_createdAt_idx`(`ownerUserId`, `createdAt`),
    INDEX `supportsharedasset_assetId_idx`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communitypost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `type` VARCHAR(32) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `platform` VARCHAR(64) NULL,
    `sourceUrl` VARCHAR(512) NULL,
    `assetId` INTEGER NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'published',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `communitypost_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `communitypost_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `communitypost_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `communitypost_assetId_idx`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communitycomment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `content` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `communitycomment_postId_createdAt_idx`(`postId`, `createdAt`),
    INDEX `communitycomment_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communityreaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `kind` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `communityreaction_postId_userId_kind_key`(`postId`, `userId`, `kind`),
    INDEX `communityreaction_postId_kind_idx`(`postId`, `kind`),
    INDEX `communityreaction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `supportconnection` ADD CONSTRAINT `supportconnection_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportconnection` ADD CONSTRAINT `supportconnection_ownerAccountId_fkey` FOREIGN KEY (`ownerAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportconnection` ADD CONSTRAINT `supportconnection_supporterAccountId_fkey` FOREIGN KEY (`supporterAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportsharedasset` ADD CONSTRAINT `supportsharedasset_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `supportconnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportsharedasset` ADD CONSTRAINT `supportsharedasset_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `contentasset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportsharedasset` ADD CONSTRAINT `supportsharedasset_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitypost` ADD CONSTRAINT `communitypost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitypost` ADD CONSTRAINT `communitypost_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitypost` ADD CONSTRAINT `communitypost_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `contentasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitycomment` ADD CONSTRAINT `communitycomment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `communitypost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitycomment` ADD CONSTRAINT `communitycomment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communitycomment` ADD CONSTRAINT `communitycomment_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communityreaction` ADD CONSTRAINT `communityreaction_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `communitypost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communityreaction` ADD CONSTRAINT `communityreaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communityreaction` ADD CONSTRAINT `communityreaction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
