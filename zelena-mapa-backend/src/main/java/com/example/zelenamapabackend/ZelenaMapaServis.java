package com.example.zelenamapabackend;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZelenaMapaServis {

    private final LocationRepository locationRepo;
    private final RatingRepository ratingRepo;

    public ZelenaMapaServis(LocationRepository locationRepo, RatingRepository ratingRepo) {
        this.locationRepo = locationRepo;
        this.ratingRepo = ratingRepo;
    }

    // 📍 GET ALL LOCATIONS
    public List<Location> getAllLocations() {
        return locationRepo.findByStatus("APPROVED");
    }

    // 📍 GET ONE LOCATION
    public Location getLocation(Long id) {
        return locationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
    }

    // ➕ ADD LOCATION
    public Location addLocation(Location location) {
        return locationRepo.save(location);
    }

    // ❌ DELETE LOCATION
    public void deleteLocation(Long id) {
        locationRepo.deleteById(id);
    }

    // ⭐ ADD RATING TO LOCATION
    public Rating addRating(Long locationId, int ratingValue) {

        Location location = getLocation(locationId);

        Rating rating = new Rating();
        rating.setRating(ratingValue);
        rating.setLocation(location);

        return ratingRepo.save(rating);
    }

    // 📊 GET ALL RATINGS FOR LOCATION
    public List<Rating> getRatings(Long locationId) {
        return ratingRepo.findByLocationId(locationId);
    }

    // 📊 AVERAGE RATING
    public double getAverageRating(Long locationId) {

        List<Rating> ratings = ratingRepo.findByLocationId(locationId);

        return ratings.stream()
                .mapToInt(Rating::getRating)
                .average()
                .orElse(0.0);
    }

    public List<Location> getPending() {
        return locationRepo.findByStatus("PENDING");
    }


    public Location approve(Long id) {

        Location loc = locationRepo.findById(id).orElseThrow();

        loc.setStatus("APPROVED");

        return locationRepo.save(loc);
    }

    public Location reject(Long id) {

        Location loc = locationRepo.findById(id).orElseThrow();

        loc.setStatus("REJECTED");

        return locationRepo.save(loc);
    }
}