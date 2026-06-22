package com.example.zelenamapabackend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    public List<Location> getAll(java.security.Principal principal) {
        return service.getAllLocations(principal);
    }

    // 📍 GET ONE LOCATION
    @GetMapping("/{id}")
    public Location getOne(@PathVariable Long id, java.security.Principal principal) {
        return service.getLocation(id, principal);
    }

    // ➕ ADD LOCATION
    @PostMapping
    public Location create(@RequestBody Location location, java.security.Principal principal) {
        return service.addLocation(location, principal == null ? null : principal.getName());
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
            @RequestBody com.example.zelenamapabackend.dto.RatingRequest ratingRequest,
            java.security.Principal principal
    ) {
        if (principal == null) {
            throw new RuntimeException("Morate biti prijavljeni da biste ocenili lokaciju");
        }
        return service.addRating(id, ratingRequest, principal.getName());
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

    @GetMapping("/admin/locations/pending")
    public List<Location> getPending() {
        return service.getPending();
    }

    @PutMapping("/admin/locations/{id}/approve")
    public Location approve(@PathVariable Long id) {
        return service.approve(id);
    }

    @PutMapping("/admin/locations/{id}/reject")
    public Location reject(@PathVariable Long id) {

        return service.reject(id);
    }

    @PostMapping(value = "/images", consumes = "multipart/form-data")
    public LocationImage upload(
            @RequestParam("locationId") Long locationId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        return service.upload(locationId, file);
    }

    @GetMapping("/images/{locationId}")
    public List<LocationImage> getImages(
            @PathVariable Long locationId) {

        return service.pronadjiSlikeZaLokaciju(locationId);
    }

    // === Users / Friends ===
    @GetMapping("/users/search")
    public List<User> searchUsers(@RequestParam String q) {
        return service.searchUsers(q);
    }

    @PostMapping("/users/{id}/add")
    public void addFriend(@PathVariable Long id, java.security.Principal principal) {
        if (principal == null) throw new RuntimeException("Morate biti prijavljeni");
        service.addFriend(principal.getName(), id);
    }

    @GetMapping("/users/friends")
    public List<User> getFriends(java.security.Principal principal) {
        if (principal == null) throw new RuntimeException("Morate biti prijavljeni");
        return service.getFriends(principal.getName());
    }

    // Recommend a location to a friend
    @PostMapping("/{id}/recommend/{friendId}")
    public Notification recommend(@PathVariable Long id, @PathVariable Long friendId, java.security.Principal principal) {
        if (principal == null) throw new RuntimeException("Morate biti prijavljeni");
        return service.recommendLocation(id, friendId, principal.getName());
    }

    // Notifications
    @GetMapping("/notifications")
    public List<Notification> getNotifications(java.security.Principal principal) {
        if (principal == null) throw new RuntimeException("Morate biti prijavljeni");
        return service.getNotifications(principal.getName());
    }

    @PutMapping("/notifications/{id}/read")
    public Notification markNotificationRead(@PathVariable Long id, java.security.Principal principal) {
        if (principal == null) throw new RuntimeException("Morate biti prijavljeni");
        return service.markNotificationRead(id, principal.getName());
    }
}
