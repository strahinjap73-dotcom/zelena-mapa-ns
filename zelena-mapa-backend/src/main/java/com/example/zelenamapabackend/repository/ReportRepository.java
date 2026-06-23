package com.example.zelenamapabackend.repository;

import com.example.zelenamapabackend.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByUsernameOrderByCreatedAtDesc(String username);
    List<Report> findAllByOrderByCreatedAtDesc();
}