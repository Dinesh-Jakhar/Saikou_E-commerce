CREATE TABLE `address` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `district_or_county` varchar(255) DEFAULT NULL,
  `state_or_region` varchar(255) NOT NULL,
  `postal_code` varchar(255) NOT NULL,
  `country_code` varchar(2) NOT NULL DEFAULT 'US',
  `phone` varchar(255) DEFAULT NULL,
  `address_type` enum('home','office','other') NOT NULL DEFAULT 'home',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `address_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `address_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `cartitem` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `session_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cartitem_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `shoppingsession` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `cartitem_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cartitem_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cartitem_ibfk_4` FOREIGN KEY (`session_id`) REFERENCES `shoppingsession` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `cartitem_ibfk_5` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cartitem_ibfk_6` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `discount` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `desc` varchar(255) DEFAULT NULL,
  `discount_percent` decimal(5,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `fulfillmentshipment` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `amazon_shipment_id` varchar(255) DEFAULT NULL,
  `fulfillment_center_id` varchar(255) DEFAULT NULL,
  `fulfillment_shipment_status` enum('PENDING','SHIPPED','CANCELLED_BY_SELLER','CANCELLED_BY_FULFILLER') DEFAULT NULL,
  `package_number` varchar(255) DEFAULT NULL,
  `carrier_code` varchar(255) DEFAULT NULL,
  `tracking_number` varchar(255) DEFAULT NULL,
  `order_current_status` enum('IN_TRANSIT','DELIVERED','RETURNING','RETURNED','RETURN_REJECTED','UNDELIVERABLE','DELAYED','OUT_FOR_DELIVERY','DELIVERY_ATTEMPTED','OTHER') DEFAULT NULL,
  `return_reason` varchar(255) DEFAULT NULL,
  `estimated_arrival_date` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `amazon_shipment_id` (`amazon_shipment_id`),
  UNIQUE KEY `tracking_number` (`tracking_number`),
  UNIQUE KEY `amazon_shipment_id_2` (`amazon_shipment_id`),
  UNIQUE KEY `tracking_number_2` (`tracking_number`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `fulfillmentshipment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fulfillmentshipment_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci



CREATE TABLE `health_check` (
  `id` int NOT NULL AUTO_INCREMENT,
  `current_version` varchar(255) NOT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci



CREATE TABLE `inventory` (
  `product_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci



CREATE TABLE `orderaddress` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `district_or_county` varchar(255) DEFAULT NULL,
  `state_or_region` varchar(255) NOT NULL,
  `postal_code` varchar(255) NOT NULL,
  `country_code` varchar(2) NOT NULL DEFAULT 'US',
  `phone` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `orderaddress_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orderaddress_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `orderdetail` (
  `id` varchar(255) NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `fulfillment_order_status` enum('New','Received','Planning','Processing','Cancelled','Complete','CompletePartialled','Unfulfillable','Invalid') DEFAULT NULL,
  `order_status` enum('pending','pendingAmazon','onAmazon') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orderdetail_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orderdetail_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `orderitem` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `product_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `seller_sku` varchar(255) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `order_item_amount` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `orderitem_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orderitem_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orderitem_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orderitem_ibfk_4` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `paymentdetails` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `payment_id` varchar(255) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` enum('succeeded','failed','pending','canceled') NOT NULL,
  `payment_method_id` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `payment_confirmation_timestamp` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `paymentdetails_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `paymentdetails_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orderdetail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `product` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `desc` text,
  `price` decimal(10,2) NOT NULL,
  `image_urls` json DEFAULT NULL,
  `discount_id` int DEFAULT NULL,
  `seller_sku` varchar(255) NOT NULL,
  `fn_sku` varchar(255) DEFAULT NULL,
  `asin` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seller_sku` (`seller_sku`),
  UNIQUE KEY `seller_sku_2` (`seller_sku`),
  UNIQUE KEY `fn_sku` (`fn_sku`),
  UNIQUE KEY `asin` (`asin`),
  UNIQUE KEY `fn_sku_2` (`fn_sku`),
  UNIQUE KEY `asin_2` (`asin`),
  KEY `discount_id` (`discount_id`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`discount_id`) REFERENCES `discount` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `product_ibfk_2` FOREIGN KEY (`discount_id`) REFERENCES `discount` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `shoppingsession` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `shoppingsession_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shoppingsession_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


CREATE TABLE `user` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci