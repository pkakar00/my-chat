-- DropForeignKey
ALTER TABLE `ChatMessage` DROP FOREIGN KEY `ChatMessage_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatMessage` DROP FOREIGN KEY `ChatMessage_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Contact` DROP FOREIGN KEY `Contact_recieverId_fkey`;

-- DropForeignKey
ALTER TABLE `Contact` DROP FOREIGN KEY `Contact_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_senderId_fkey`;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_recieverId_fkey` FOREIGN KEY (`recieverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
