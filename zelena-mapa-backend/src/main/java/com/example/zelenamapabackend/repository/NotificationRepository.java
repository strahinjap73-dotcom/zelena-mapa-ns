package com.example.zelenamapabackend.repository;

import com.example.zelenamapabackend.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByToUserIdOrderByCreatedAtDesc(Long toUserId);
}
