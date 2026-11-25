-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 25, 2026 at 06:43 AM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ridesri_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bikes`
--

CREATE TABLE `bikes` (
  `bike_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `model` varchar(100) NOT NULL,
  `bike_type` varchar(50) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `price_per_day` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `availability` enum('available','unavailable') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bikes`
--

INSERT INTO `bikes` (`bike_id`, `owner_id`, `model`, `bike_type`, `location`, `price_per_day`, `description`, `image_url`, `availability`) VALUES
(1, 2, 'Bajaj', 'Standard', 'Galle', 2500.00, 'Available for tourist rentals', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85', 'available'),
(2, 2, 'Honda Commuters.', 'Standard', 'Matara', 3000.00, 'Available for tourist rentals', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85', 'available'),
(3, 2, 'TVS', 'Standard', 'kandy', 2500.00, 'Available for tourist rentals', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85', 'available'),
(4, 2, 'Yamaha', 'Standard', 'Matara', 3500.00, 'Available for tourist rentals', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85', 'available'),
(5, 2, 'KTM', 'Standard', 'Galle', 2500.00, 'Available for tourist rentals', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85', 'available');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `tourist_id` int(11) NOT NULL,
  `bike_id` int(11) NOT NULL,
  `pickup_date` date NOT NULL,
  `return_date` date NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `tourist_id`, `bike_id`, `pickup_date`, `return_date`, `total_amount`, `status`, `created_at`) VALUES
(1, 1, 3, '2026-11-17', '2026-11-18', 4500.00, 'confirmed', '2026-11-16 15:24:08'),
(2, 1, 3, '2026-11-17', '2026-11-18', 4500.00, 'confirmed', '2026-11-16 15:40:16'),
(3, 1, 1, '2026-11-20', '2026-11-21', 2500.00, 'confirmed', '2026-11-19 04:16:21'),
(4, 1, 2, '2026-11-20', '2026-11-21', 1800.00, 'cancelled', '2026-11-19 04:18:01'),
(5, 1, 2, '2026-11-20', '2026-11-21', 1800.00, 'cancelled', '2026-11-19 04:21:57'),
(6, 1, 2, '2026-11-28', '2026-11-30', 3600.00, '', '2026-11-19 04:46:10'),
(7, 1, 1, '2026-11-20', '2026-11-21', 2500.00, '', '2026-11-19 04:48:00'),
(8, 1, 4, '2026-11-20', '2026-11-21', 5200.00, 'confirmed', '2026-11-19 05:03:53'),
(9, 4, 4, '2026-12-09', '2026-12-11', 10400.00, 'confirmed', '2026-11-19 05:07:51');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','paid','failed') DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `booking_id`, `amount`, `payment_method`, `payment_status`, `payment_date`) VALUES
(1, 2, 4500.00, 'Card', 'paid', '2026-11-16 15:40:18'),
(2, 3, 2500.00, 'Card', 'paid', '2026-11-19 04:16:29'),
(3, 6, 3600.00, 'Card', 'paid', '2026-11-19 04:46:15'),
(4, 7, 2500.00, 'Card', 'paid', '2026-11-19 04:48:04'),
(5, 8, 5200.00, 'Card', 'paid', '2026-11-19 05:03:54'),
(6, 9, 10400.00, 'Card', 'paid', '2026-11-19 05:07:54');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('tourist','owner','admin') DEFAULT 'tourist',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'tharushi nethsara', 'tharushineth22@gmail.com', 'scrypt:32768:8:1$pRMGtrsKAlM9bSak$3c15bacaa12383581feb330c25c0a72c0046f0ad42df3a8816b4d04785b19fe437b5bf0fe199fa95cf3cfbdd374be38863d08320fcfbd6d14ba8d291ab74198b', 'tourist', '2026-11-12 05:15:06'),
(2, 'Namal Silva', 'namal123@gmail.com', 'scrypt:32768:8:1$QhTcTrpKJv8WKjYl$d7c431048c084c7eb57acbebc54922c26bb58a6708c831688b0a74fdb78ac643514388f7a901a1213c99a53125d7a287d3fd735e49d6c966c6ec6f604936f08d', 'owner', '2026-11-15 06:04:09'),
(3, 'Admin', 'admin@ridesri.com', 'scrypt:32768:8:1$oMhupzuqUC9esLPE$3532e89b0bac91961314cf03d32375965fa5a44c48353d7220ba0b45ffcbd2159eb6d4c94106c50284fcb966a414a3701cab7dc21f02ec4417016f247411b29a', 'admin', '2026-11-16 17:07:59'),
(4, 'Malshi Nethsarani', 'malshi924neth@gmail.com', 'scrypt:32768:8:1$EKCjhINVU15be56t$b1ca4335a61846d18e2a5dfb8b0105f1d8bf6a1ff286265ba3e57077e7649d314f229069eb231273692d6289337ee7051a20d53718a35bbb12ce7295429bd119', 'tourist', '2026-11-19 05:06:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bikes`
--
ALTER TABLE `bikes`
  ADD PRIMARY KEY (`bike_id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `tourist_id` (`tourist_id`),
  ADD KEY `bike_id` (`bike_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bikes`
--
ALTER TABLE `bikes`
  MODIFY `bike_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bikes`
--
ALTER TABLE `bikes`
  ADD CONSTRAINT `bikes_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`tourist_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`bike_id`) REFERENCES `bikes` (`bike_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
