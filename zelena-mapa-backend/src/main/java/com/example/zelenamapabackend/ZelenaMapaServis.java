package com.example.zelenamapabackend;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.zelenamapabackend.repository.LocationImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class ZelenaMapaServis {

    private final LocationRepository locationRepo;
    private final RatingRepository ratingRepo;

    private final Cloudinary cloudinary;
    private final LocationImageRepository imageRepository;

    public ZelenaMapaServis(LocationRepository locationRepo, RatingRepository ratingRepo, Cloudinary cloudinary, LocationImageRepository imageRepository) {
        this.locationRepo = locationRepo;
        this.ratingRepo = ratingRepo;
        this.cloudinary = cloudinary;
        this.imageRepository = imageRepository;
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
        Location newLocation = new Location();

        newLocation.setName(location.getName());
        newLocation.setDescription(location.getDescription());
        newLocation.setLat(location.getLat());
        newLocation.setLng(location.getLng());

        newLocation.setStatus("APPROVED");

        return locationRepo.save(newLocation);
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

    public LocationImage upload(
            Long locationId,
            MultipartFile file)
            throws IOException {

        Location location =
                locationRepo.findById(locationId)
                        .orElseThrow();

        Map uploadResult =
                cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.emptyMap()
                );

        String imageUrl =
                uploadResult.get("secure_url").toString();

        LocationImage image = new LocationImage();
        image.setLocation(location);
        image.setImageUrl(imageUrl);

        return imageRepository.save(image);
    }

    public List<LocationImage> pronadjiSlikeZaLokaciju(
            @PathVariable Long locationId) {
        return imageRepository.findByLocationId(locationId);

    }
}