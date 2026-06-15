package com.example.zelenamapabackend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ZelenaMapaKontroler {

    private final ZelenaMapaServis service;

    public ZelenaMapaKontroler(ZelenaMapaServis service) {
        this.service = service;
    }

    // 📍 GET ALL LOCATIONS
    @GetMapping
    public List<Location> getAll() {
        return service.getAllLocations();
    }

    // 📍 GET ONE LOCATION
    @GetMapping("/{id}")
    public Location getOne(@PathVariable Long id) {
        return service.getLocation(id);
    }

    // ➕ ADD LOCATION
    @PostMapping
    public Location create(@RequestBody Location location) {
        return service.addLocation(location);
    }

    // ❌ DELETE LOCATION
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteLocation(id);
    }

    // ⭐ ADD RATING
    @PostMapping("/{id}/rating")
    public Rating addRating(
            @PathVariable Long id,
            @RequestBody int rating
    ) {
        return service.addRating(id, rating);
    }

    // 📊 GET RATINGS
    @GetMapping("/{id}/ratings")
    public List<Rating> getRatings(@PathVariable Long id) {
        return service.getRatings(id);
    }

    // 📊 AVERAGE RATING
    @GetMapping("/{id}/rating/average")
    public double average(@PathVariable Long id) {
        return service.getAverageRating(id);
    }
}