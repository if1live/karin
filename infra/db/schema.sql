-- note:
-- `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
-- `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

CREATE TABLE `miyako_function_definition` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `function_name` VARCHAR(255) NOT NULL,
  `function_arn` VARCHAR(255) NOT NULL,
  `payload` JSON NOT NULL,

  UNIQUE INDEX `miyako_function_definition_function_name`(`function_name`),
  UNIQUE INDEX `miyako_function_definition_function_arn`(`function_arn`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `miyako_function_url` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `function_arn` VARCHAR(255) NOT NULL,
  `function_url` VARCHAR(255) NOT NULL,
  `payload` JSON NOT NULL,

  UNIQUE INDEX `miyako_function_url_function_arn`(`function_arn`),
  UNIQUE INDEX `miyako_function_url_function_url`(`function_url`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `miyako_event_source_mapping` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NOT NULL,
  `event_source_arn` VARCHAR(255) NOT NULL,
  `function_arn` VARCHAR(255) NOT NULL,
  `payload` JSON NOT NULL,

  UNIQUE INDEX `miyako_event_source_mapping_uuid`(`uuid`),
  UNIQUE INDEX `miyako_event_source_mapping_event_source_arn`(`event_source_arn`),
  UNIQUE INDEX `miyako_event_source_mapping_function_arn`(`function_arn`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
