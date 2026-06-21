package com.example.zelenamapabackend.repository;

import com.example.zelenamapabackend.LocationImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationImageRepository extends JpaRepository<LocationImage, Long> {

  List<LocationImage> findByLocationId(Long locationId);
}