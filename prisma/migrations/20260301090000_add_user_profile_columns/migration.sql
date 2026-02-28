ALTER TABLE `User`
  ADD COLUMN `role` ENUM('me', 'girlfriend', 'test', 'user') NULL,
  ADD COLUMN `name` VARCHAR(64) NULL;

CREATE INDEX `User_role_idx` ON `User`(`role`);
