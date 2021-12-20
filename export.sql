-- MySQL dump 10.13  Distrib 8.0.27, for Linux (x86_64)
--
-- Host: localhost    Database: sampleDB
-- ------------------------------------------------------
-- Server version	8.0.27-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `prize_lists`
--

DROP TABLE IF EXISTS `prize_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prize_lists` (
  `id` int NOT NULL,
  `image_name` varchar(50) DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `description` varchar(20) DEFAULT NULL,
  `need_point` int DEFAULT '0',
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prize_lists`
--

LOCK TABLES `prize_lists` WRITE;
/*!40000 ALTER TABLE `prize_lists` DISABLE KEYS */;
INSERT INTO `prize_lists` VALUES (0,'defaultBullet',0,'普通の弾',0),(1,'glowBullet',0,'発光弾',10),(2,'triangleBullet',0,'三角弾',10),(4,'defaultWall',1,'灰色の壁',0),(5,'orangeWall',1,'オレンジの壁',10),(6,'whiteWall',1,'白い壁',10),(7,'concreteWall',1,'コンクリート',20),(8,'stoneWall',1,'石の壁',20),(9,'woodWall',1,'木の壁',20),(25,'blackFloor',2,'黒い床',0),(26,'greenFloor',2,'緑の床',10),(27,'grassFloor',2,'芝生',15),(28,'dartFloor',2,'土',15),(29,'sandFloor',2,'砂',15),(30,'corkFloor',2,'コルクの床',15),(31,'woodFloor',2,'木の床',15);
/*!40000 ALTER TABLE `prize_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prize_names`
--

DROP TABLE IF EXISTS `prize_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prize_names` (
  `id` int NOT NULL,
  `name` varchar(10) DEFAULT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prize_names`
--

LOCK TABLES `prize_names` WRITE;
/*!40000 ALTER TABLE `prize_names` DISABLE KEYS */;
INSERT INTO `prize_names` VALUES (0,'弾スキン'),(1,'壁テクスチャ'),(2,'床テクスチャ');
/*!40000 ALTER TABLE `prize_names` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `name` varchar(50) NOT NULL,
  `show_damage` tinyint(1) DEFAULT '0',
  `show_fps` tinyint(1) DEFAULT NULL,
  `upkey` varchar(10) DEFAULT 'W',
  `downkey` varchar(10) DEFAULT 'S',
  `rightkey` varchar(10) DEFAULT 'D',
  `leftkey` varchar(10) DEFAULT 'A',
  `firekey` varchar(10) DEFAULT 'SPACE',
  `useitemkey` varchar(10) DEFAULT 'Z',
  `rightarmrkey` varchar(10) DEFAULT 'E',
  `leftarmrkey` varchar(10) DEFAULT 'Q',
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('default',0,0,'ARROWUP','ARROWDOWN','ARROWRIGHT','ARROWLEFT','SPACE','Z','E','Q'),('java',0,0,'W','S','D','A','SPACE','Z','E','Q'),('kurita',0,0,'W','S','D','A','SPACE','Z','E','Q'),('test',1,1,'W','S','D','A','SPACE','Z','E','Q');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `count` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `password` varchar(1000) NOT NULL,
  `win` int DEFAULT '0',
  `lose` int DEFAULT '0',
  `cv` int DEFAULT '0',
  `skin` int NOT NULL DEFAULT '0',
  `point` int NOT NULL DEFAULT '0',
  `opend_prize` bigint NOT NULL DEFAULT '33554449',
  `selected_prize` bigint NOT NULL DEFAULT '33554449',
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `count` (`count`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (29,1,'aaa','9834876dcfb05cb167a5c24953eba58c4ac89b1adf57f28f2f9d09af107ee8f0',0,7,0,0,0,33554449,33554449),(41,8082,'kurita','db4615b8c9a9a05e8840940913268fb178d60f441d84943380a557b75cb5aefa',0,0,0,0,0,33554449,33554449),(42,11617,'java','9b8fd9f4ec9edbf1d6618437504747a3d38c61de17b27afe59e9b482e58d7536',0,0,0,0,0,33554449,33554449),(35,53060,'test','9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',34,8,4,7,4,4261413649,268435969);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-12-20 14:50:32
