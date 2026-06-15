package com.example.zelenamapabackend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByLocationId(Long locationId);
}
