-- DropForeignKey
ALTER TABLE `authidentity` DROP FOREIGN KEY `AuthIdentity_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `authsession` DROP FOREIGN KEY `AuthSession_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `contentasset` DROP FOREIGN KEY `ContentAsset_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `contentasset` DROP FOREIGN KEY `ContentAsset_userId_fkey`;

-- DropForeignKey
ALTER TABLE `contentasset` DROP FOREIGN KEY `ContentAsset_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `contentplan` DROP FOREIGN KEY `ContentPlan_userId_fkey`;

-- DropForeignKey
ALTER TABLE `contentplantask` DROP FOREIGN KEY `ContentPlanTask_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `contentplantask` DROP FOREIGN KEY `ContentPlanTask_planId_fkey`;

-- DropForeignKey
ALTER TABLE `dailycheckin` DROP FOREIGN KEY `DailyCheckin_userId_fkey`;

-- DropForeignKey
ALTER TABLE `paymentorder` DROP FOREIGN KEY `PaymentOrder_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `paymentorder` DROP FOREIGN KEY `PaymentOrder_userId_fkey`;

-- DropForeignKey
ALTER TABLE `quotausage` DROP FOREIGN KEY `QuotaUsage_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userprofile` DROP FOREIGN KEY `UserProfile_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `userprofile` DROP FOREIGN KEY `UserProfile_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `workspacemember` DROP FOREIGN KEY `WorkspaceMember_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `workspacemember` DROP FOREIGN KEY `WorkspaceMember_workspaceId_fkey`;

-- CreateTable
CREATE TABLE `explosioncase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NULL,
    `sourceUrl` VARCHAR(512) NULL,
    `sourcePlatform` VARCHAR(32) NULL,
    `sourceContent` LONGTEXT NULL,
    `structureJson` LONGTEXT NULL,
    `myVersion` LONGTEXT NULL,
    `myVersionPrompt` LONGTEXT NULL,
    `assetId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `explosioncase_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `explosioncase_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `explosioncase_sourcePlatform_idx`(`sourcePlatform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `authidentity` ADD CONSTRAINT `authidentity_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authsession` ADD CONSTRAINT `authsession_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspacemember` ADD CONSTRAINT `workspacemember_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspacemember` ADD CONSTRAINT `workspacemember_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userprofile` ADD CONSTRAINT `userprofile_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userprofile` ADD CONSTRAINT `userprofile_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentorder` ADD CONSTRAINT `paymentorder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentorder` ADD CONSTRAINT `paymentorder_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentasset` ADD CONSTRAINT `contentasset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentasset` ADD CONSTRAINT `contentasset_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentasset` ADD CONSTRAINT `contentasset_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentplan` ADD CONSTRAINT `contentplan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentplantask` ADD CONSTRAINT `contentplantask_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `contentplan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contentplantask` ADD CONSTRAINT `contentplantask_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `contentasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotausage` ADD CONSTRAINT `quotausage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explosioncase` ADD CONSTRAINT `explosioncase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explosioncase` ADD CONSTRAINT `explosioncase_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explosioncase` ADD CONSTRAINT `explosioncase_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `contentasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dailycheckin` ADD CONSTRAINT `dailycheckin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `appconfig` RENAME INDEX `AppConfig_key_key` TO `appconfig_key_key`;

-- RenameIndex
ALTER TABLE `authidentity` RENAME INDEX `AuthIdentity_accountId_provider_idx` TO `authidentity_accountId_provider_idx`;

-- RenameIndex
ALTER TABLE `authidentity` RENAME INDEX `AuthIdentity_provider_providerUserId_key` TO `authidentity_provider_providerUserId_key`;

-- RenameIndex
ALTER TABLE `authsession` RENAME INDEX `AuthSession_accountId_expiredAt_idx` TO `authsession_accountId_expiredAt_idx`;

-- RenameIndex
ALTER TABLE `authsession` RENAME INDEX `AuthSession_refreshToken_key` TO `authsession_refreshToken_key`;

-- RenameIndex
ALTER TABLE `authsession` RENAME INDEX `AuthSession_sessionToken_key` TO `authsession_sessionToken_key`;

-- RenameIndex
ALTER TABLE `contentasset` RENAME INDEX `ContentAsset_accountId_createdAt_idx` TO `contentasset_accountId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `contentasset` RENAME INDEX `ContentAsset_status_createdAt_idx` TO `contentasset_status_createdAt_idx`;

-- RenameIndex
ALTER TABLE `contentasset` RENAME INDEX `ContentAsset_userId_createdAt_idx` TO `contentasset_userId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `contentasset` RENAME INDEX `ContentAsset_workspaceId_createdAt_idx` TO `contentasset_workspaceId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `contentplan` RENAME INDEX `ContentPlan_userId_status_createdAt_idx` TO `contentplan_userId_status_createdAt_idx`;

-- RenameIndex
ALTER TABLE `contentplan` RENAME INDEX `ContentPlan_userId_type_idx` TO `contentplan_userId_type_idx`;

-- RenameIndex
ALTER TABLE `contentplantask` RENAME INDEX `ContentPlanTask_planId_dayNumber_key` TO `contentplantask_planId_dayNumber_key`;

-- RenameIndex
ALTER TABLE `contentplantask` RENAME INDEX `ContentPlanTask_planId_status_idx` TO `contentplantask_planId_status_idx`;

-- RenameIndex
ALTER TABLE `dailycheckin` RENAME INDEX `DailyCheckin_mood_idx` TO `dailycheckin_mood_idx`;

-- RenameIndex
ALTER TABLE `dailycheckin` RENAME INDEX `DailyCheckin_userId_createdAt_idx` TO `dailycheckin_userId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `dailycheckin` RENAME INDEX `DailyCheckin_userId_date_key` TO `dailycheckin_userId_date_key`;

-- RenameIndex
ALTER TABLE `paymentorder` RENAME INDEX `PaymentOrder_accountId_createdAt_idx` TO `paymentorder_accountId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `paymentorder` RENAME INDEX `PaymentOrder_orderNo_key` TO `paymentorder_orderNo_key`;

-- RenameIndex
ALTER TABLE `paymentorder` RENAME INDEX `PaymentOrder_status_createdAt_idx` TO `paymentorder_status_createdAt_idx`;

-- RenameIndex
ALTER TABLE `paymentorder` RENAME INDEX `PaymentOrder_userId_createdAt_idx` TO `paymentorder_userId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `quotausage` RENAME INDEX `QuotaUsage_accountId_createdAt_idx` TO `quotausage_accountId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `quotausage` RENAME INDEX `QuotaUsage_userId_createdAt_idx` TO `quotausage_userId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `quotausage` RENAME INDEX `QuotaUsage_userId_quotaKey_createdAt_idx` TO `quotausage_userId_quotaKey_createdAt_idx`;

-- RenameIndex
ALTER TABLE `userprofile` RENAME INDEX `UserProfile_accountId_key` TO `userprofile_accountId_key`;

-- RenameIndex
ALTER TABLE `userprofile` RENAME INDEX `UserProfile_workspaceId_idx` TO `userprofile_workspaceId_idx`;

-- RenameIndex
ALTER TABLE `workspacemember` RENAME INDEX `WorkspaceMember_accountId_status_idx` TO `workspacemember_accountId_status_idx`;

-- RenameIndex
ALTER TABLE `workspacemember` RENAME INDEX `WorkspaceMember_workspaceId_accountId_key` TO `workspacemember_workspaceId_accountId_key`;
