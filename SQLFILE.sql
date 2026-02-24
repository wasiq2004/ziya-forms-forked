CREATE DATABASE  IF NOT EXISTS `ziya_forms` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ziya_forms`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: ziya_forms
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `answers`
--

DROP TABLE IF EXISTS `answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answers` (
  `id` varchar(36) NOT NULL,
  `response_id` varchar(36) NOT NULL,
  `question_id` varchar(36) NOT NULL,
  `answer_text` text,
  `answer_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_answers_response_id` (`response_id`),
  KEY `idx_answers_question_id` (`question_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`response_id`) REFERENCES `responses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answers`
--

LOCK TABLES `answers` WRITE;
/*!40000 ALTER TABLE `answers` DISABLE KEYS */;
INSERT INTO `answers` VALUES ('CeTQUiDBo9WkihTkSCx7T','I6eTK6DzB3U6s3S-BZ7HV','wFiF_XOsEdZQ1O0R8xVat','wada','{}','2025-11-05 07:52:49'),('gGiZDVKbfDpINV2ZidWcU','I6eTK6DzB3U6s3S-BZ7HV','HVb5gVyX0YkgATkoMolP-','wada','{}','2025-11-05 07:52:49'),('s2VsEmzd2Bk3XDld_48Hv','I6eTK6DzB3U6s3S-BZ7HV','8lE_1Z_8ksbXcm44Nz-7f','wdadawd','{}','2025-11-05 07:52:49'),('zfnr-RiwQMjnX5kaFbbl6','I6eTK6DzB3U6s3S-BZ7HV','XYBVhUnh5NVvSmTPUI8nC','awda','{}','2025-11-05 07:52:49');
/*!40000 ALTER TABLE `answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forms`
--

DROP TABLE IF EXISTS `forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `theme_color` varchar(7) DEFAULT '#3b82f6',
  `is_published` tinyint(1) DEFAULT '0',
  `is_accepting_responses` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_forms_user_id` (`user_id`),
  CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forms`
--

LOCK TABLES `forms` WRITE;
/*!40000 ALTER TABLE `forms` DISABLE KEYS */;
INSERT INTO `forms` VALUES ('dzrp8vnx4S27ypMlA9J0B','SJYE_3qSSwhUc4ie7Ln3v','Untitled Form',NULL,'#3b84f2',0,1,'2025-12-15 11:09:32','2025-12-15 11:09:32'),('UEKmc_GtPHNrhrDbjoT2U','3oMuO4VoO97-DHeJRPk-P','Sample form',NULL,'#3b84f2',1,1,'2025-11-05 08:20:40','2025-11-05 08:20:56'),('zlQ-9QdAxbm-BjCGUEbsb','Vlo5rPBx-OdzVRVp-xJHz','Hello SQL',NULL,'#3b84f2',1,1,'2025-11-05 07:52:07','2025-11-05 07:52:30');
/*!40000 ALTER TABLE `forms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `type` enum('short_answer','paragraph','multiple_choice','checkboxes','dropdown','linear_scale','file_upload') NOT NULL,
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `order_index` int DEFAULT '0',
  `settings` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_form_id` (`form_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES ('25M4_29gzy5vUwwVcFfEZ','UEKmc_GtPHNrhrDbjoT2U','What is your name?',NULL,'short_answer','[]',1,0,'{}','2025-11-05 08:20:41','2025-11-05 08:20:41'),('8lE_1Z_8ksbXcm44Nz-7f','zlQ-9QdAxbm-BjCGUEbsb','What is your email?',NULL,'short_answer','[]',1,1,'{}','2025-11-05 07:52:27','2025-11-05 07:52:27'),('HVb5gVyX0YkgATkoMolP-','zlQ-9QdAxbm-BjCGUEbsb','',NULL,'short_answer','[]',0,3,'{}','2025-11-05 07:52:27','2025-11-05 07:52:27'),('jBrYKaVgQ8CdRxZ5RFyNV','dzrp8vnx4S27ypMlA9J0B','What is your name?',NULL,'short_answer','[]',1,0,'{}','2025-12-15 11:09:32','2025-12-15 11:09:32'),('kfa-iGJRutAwfwvyKdG47','dzrp8vnx4S27ypMlA9J0B','What is your email?',NULL,'short_answer','[]',1,1,'{}','2025-12-15 11:09:32','2025-12-15 11:09:32'),('Khj52HDNqCeOCodTLk4Wp','UEKmc_GtPHNrhrDbjoT2U','What is your email?',NULL,'short_answer','[]',1,1,'{}','2025-11-05 08:20:41','2025-11-05 08:20:41'),('wFiF_XOsEdZQ1O0R8xVat','zlQ-9QdAxbm-BjCGUEbsb','What is your name?',NULL,'short_answer','[]',1,0,'{}','2025-11-05 07:52:27','2025-11-05 07:52:27'),('XYBVhUnh5NVvSmTPUI8nC','zlQ-9QdAxbm-BjCGUEbsb','who are u',NULL,'short_answer','[]',0,2,'{}','2025-11-05 07:52:27','2025-11-05 07:52:27');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responses`
--

DROP TABLE IF EXISTS `responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responses` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `respondent_email` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_responses_form_id` (`form_id`),
  CONSTRAINT `responses_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responses`
--

LOCK TABLES `responses` WRITE;
/*!40000 ALTER TABLE `responses` DISABLE KEYS */;
INSERT INTO `responses` VALUES ('I6eTK6DzB3U6s3S-BZ7HV','zlQ-9QdAxbm-BjCGUEbsb','was','2025-11-05 07:52:49');
/*!40000 ALTER TABLE `responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3oMuO4VoO97-DHeJRPk-P','wasiqmohideen786@gmail.com','Wasiq Mohideen',NULL,'https://lh3.googleusercontent.com/a/ACg8ocKwJppnOww9Lxr_KYfUCluEk2TqIrjxT3WxAccnB2i2Q9FOKhrt=s96-c','2025-11-05 08:08:34','2025-11-05 08:19:39'),('SJYE_3qSSwhUc4ie7Ln3v','wasiq.works@gmail.com','wasiq.works','$2b$10$2Cnc95ix/hsJKuojtUA3nOZOU2ZuY957afudFww8grpqlfKuTLssK',NULL,'2025-12-15 11:09:27','2025-12-15 11:09:27'),('Vlo5rPBx-OdzVRVp-xJHz','test1@gmail.com','test1','$2b$10$Ln82GHk5IPdVuMHEitFnZumr8kJh3Qnvu3fBl6arzzpfr7e7IpqZK',NULL,'2025-11-05 07:51:59','2025-11-05 07:51:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-15 16:41:26
