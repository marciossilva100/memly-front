-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           9.6.0 - MySQL Community Server - GPL
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.15.0.7171
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Copiando estrutura para tabela memly.categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela memly.categorias: ~0 rows (aproximadamente)
INSERT INTO `categorias` (`id`, `categoria`) VALUES
	(1, 'Frases'),
	(2, 'Verbos'),
	(3, 'Expressoes');

-- Copiando estrutura para tabela memly.frases
CREATE TABLE IF NOT EXISTS `frases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `texto_nativo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `texto_traduzido` text NOT NULL,
  `idioma_nativo` text NOT NULL,
  `idioma_aprendendo` text NOT NULL,
  `data_criacao` timestamp NULL DEFAULT NULL,
  `data_atualizacao` timestamp NULL DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_frases_categorias` (`categoria_id`),
  KEY `FK_frases_usuarios` (`usuario_id`),
  CONSTRAINT `fk_frases_categorias` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `FK_frases_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela memly.frases: ~1 rows (aproximadamente)
INSERT INTO `frases` (`id`, `usuario_id`, `texto_nativo`, `texto_traduzido`, `idioma_nativo`, `idioma_aprendendo`, `data_criacao`, `data_atualizacao`, `categoria_id`) VALUES
	(1, 1, 'Ola', 'Hello', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 1),
	(2, 1, 'deixa pra lá', 'nevermind', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 1),
	(3, 1, 'conselho', 'piece advice', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 1),
	(4, 1, 'contato', 'touch', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 1),
	(5, 1, 'orgulhoso', 'proud', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 1),
	(6, 1, 'lide com isso', 'handle it', 'Portugues', 'Ingles', '2026-02-04 22:32:42', '2026-02-04 22:32:43', 3);

-- Copiando estrutura para tabela memly.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela memly.usuarios: ~0 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nome`, `email`, `password`) VALUES
	(1, 'Marcios', 'marcios@gmail.com', '123');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
