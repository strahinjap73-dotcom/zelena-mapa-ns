package com.example.zelenamapabackend.repository;

import com.example.zelenamapabackend.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByUsernameContainingIgnoreCase(String username);
}
