package com.example.zelenamapabackend;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.zelenamapabackend.dto.RatingRequest;
import com.example.zelenamapabackend.repository.LocationImageRepository;
import com.example.zelenamapabackend.repository.UserRepository;
import com.example.zelenamapabackend.repository.FriendRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@Service
public class ZelenaMapaServis {

    private final LocationRepository locationRepo;
    private final RatingRepository ratingRepo;
    private final UserRepository userRepo;
    private final com.example.zelenamapabackend.repository.NotificationRepository notificationRepo;
    private final FriendRequestRepository friendRequestRepository;

    private final Cloudinary cloudinary;
    private final LocationImageRepository imageRepository;

    public ZelenaMapaServis(
            LocationRepository locationRepo,
            RatingRepository ratingRepo,
            UserRepository userRepo,
            com.example.zelenamapabackend.repository.NotificationRepository notificationRepo,
            FriendRequestRepository friendRequestRepository,
            Cloudinary cloudinary,
            LocationImageRepository imageRepository) {
        this.locationRepo = locationRepo;
        this.ratingRepo = ratingRepo;
        this.userRepo = userRepo;
        this.notificationRepo = notificationRepo;
        this.friendRequestRepository = friendRequestRepository;
        this.cloudinary = cloudinary;
        this.imageRepository = imageRepository;
    }

    // 📍 GET ALL LOCATIONS
    public List<Location> getAllLocations(java.security.Principal principal) {
        List<Location> locations = locationRepo.findByStatus("APPROVED");

        if (principal == null) {
            return locations.stream()
                    .filter(loc -> !loc.isPrivateLocation())
                    .toList();
        }

        User user = userRepo.findByEmail(principal.getName()).orElse(null);

        return locations.stream()
                .filter(loc -> !loc.isPrivateLocation() ||
                        (loc.getOwner() != null && user != null && loc.getOwner().getEmail().equals(user.getEmail())))
                .toList();
    }

    // 📍 GET ONE LOCATION
    public Location getLocation(Long id) {
        return getLocation(id, null);
    }

    public Location getLocation(Long id, java.security.Principal principal) {
        Location location = locationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        if (location.isPrivateLocation()) {
            if (principal == null) {
                throw new RuntimeException("Lokacija nije dostupna");
            }
            User user = userRepo.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
            if (location.getOwner() == null || !location.getOwner().getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Lokacija nije dostupna");
            }
        }

        return location;
    }

    // ➕ ADD LOCATION
    public Location addLocation(Location location, String userEmail) {
   	 Location newLocation = new Location();

 	 newLocation.setName(location.getName());
	 newLocation.setDescription(location.getDescription());
 	 newLocation.setLat(location.getLat());
    	newLocation.setLng(location.getLng());
    	newLocation.setPrivateLocation(location.isPrivateLocation());

    	// Privatne lokacije su odmah approved, javne čekaju admin odobrenje
    	if (location.isPrivateLocation()) {
      	  newLocation.setStatus("APPROVED");
      	  if (userEmail == null) {
       	     throw new RuntimeException("Morate biti prijavljeni da biste kreirali privatnu lokaciju");
       	 }
       	 User owner = userRepo.findByEmail(userEmail)
       	         .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
       	 newLocation.setOwner(owner);
    	} else {
     	   newLocation.setStatus("PENDING");
     	   if (userEmail != null) {
      	      User owner = userRepo.findByEmail(userEmail).orElse(null);
      	      newLocation.setOwner(owner);
      	  }
   	 }

   	 return locationRepo.save(newLocation);
     }

    // ❌ DELETE LOCATION
    public void deleteLocation(Long id) {
        locationRepo.deleteById(id);
    }

    // ⭐ ADD RATING TO LOCATION
    public Rating addRating(Long locationId, RatingRequest ratingRequest, String userEmail) {

        Location location = getLocation(locationId);
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        if (ratingRepo.existsByLocationIdAndUserId(locationId, user.getId())) {
            throw new RuntimeException("Korisnik je već ocenio ovu lokaciju");
        }

        Rating rating = new Rating();
        rating.setDistanceFromCenter(ratingRequest.getDistanceFromCenter());
        rating.setCleanliness(ratingRequest.getCleanliness());
        rating.setGreenArea(ratingRequest.getGreenArea());
        rating.setLocation(location);
        rating.setUser(user);
        // compute and store aggregated rating value for legacy DB column
        rating.setRating(rating.getAverage());

        return ratingRepo.save(rating);
    }

    //izmena lokacije
    public Location updateLocation(Long locationId, Location updatedLocation) {
        Location location = locationRepo.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        location.setName(updatedLocation.getName());
        location.setDescription(updatedLocation.getDescription());
        location.setLat(updatedLocation.getLat());
        location.setLng(updatedLocation.getLng());
        location.setStatus(updatedLocation.getStatus());
        location.setPrivateLocation(updatedLocation.isPrivateLocation());

        return locationRepo.save(location);
    }

    // 📊 GET ALL RATINGS FOR LOCATION
    public List<Rating> getRatings(Long locationId) {
        return ratingRepo.findByLocationId(locationId);
    }

    // 📊 AVERAGE RATING
    public double getAverageRating(Long locationId) {

        List<Rating> ratings = ratingRepo.findByLocationId(locationId);

        return ratings.stream()
                .mapToDouble(Rating::getRating)
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

    // === Friends & Notifications ===
    public java.util.List<User> searchUsers(String username) {
        return userRepo.findByUsernameContainingIgnoreCase(username);
    }

    public void addFriend(String userEmail, Long friendId) {
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
        User friend = userRepo.findById(friendId).orElseThrow(() -> new RuntimeException("Prijatelj nije pronađen"));
        if (user.getFriends().contains(friend)) return;
        user.addFriend(friend);
        friend.addFriend(user);
        userRepo.save(user);
        userRepo.save(friend);
    }

    public java.util.List<User> getFriends(String userEmail) {
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
        return new java.util.ArrayList<>(user.getFriends());
    }

    public Notification recommendLocation(Long locationId, Long friendId, String fromEmail) {
        Location loc = locationRepo.findById(locationId).orElseThrow(() -> new RuntimeException("Lokacija nije pronađena"));
        User from = userRepo.findByEmail(fromEmail).orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
        User to = userRepo.findById(friendId).orElseThrow(() -> new RuntimeException("Prijatelj nije pronađen"));
        // ensure they are friends
        if (!from.getFriends().contains(to)) {
            throw new RuntimeException("Morate biti prijatelji da biste preporučili lokaciju");
        }
        Notification n = new Notification();
        n.setFromUser(from);
        n.setToUser(to);
        n.setMessage(from.getUsername() + " preporučio lokaciju: " + loc.getName());
        return notificationRepo.save(n);
    }

    public java.util.List<Notification> getNotifications(String userEmail) {
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));
        return notificationRepo.findByToUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Notification markNotificationRead(Long id, String userEmail) {
        Notification n = notificationRepo.findById(id).orElseThrow(() -> new RuntimeException("Notifikacija nije pronađena"));
        if (!n.getToUser().getEmail().equals(userEmail)) throw new RuntimeException("Nije ovlašćenje");
        n.setReadFlag(true);
        return notificationRepo.save(n);
    }

    // ===== ZAMENI ove dve metode u ZelenaMapaServis.java =====

    public FriendRequest sendFriendRequest(String senderEmail, Long receiverId) {
        User sender = userRepo.findByEmail(senderEmail)  // bilo: findByUsername
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));
        User receiver = userRepo.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Primalac ne postoji"));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("Ne mozes sebi poslati zahtev");
        }
        if (sender.getFriends().contains(receiver)) {
            throw new RuntimeException("Vec ste prijatelji");
        }

        boolean alreadyPending = friendRequestRepository
                .findBySenderIdAndReceiverIdAndStatus(sender.getId(), receiver.getId(), FriendRequest.Status.PENDING)
                .isPresent();
        if (alreadyPending) {
            throw new RuntimeException("Zahtev je vec poslat");
        }

        FriendRequest request = new FriendRequest(sender, receiver);
        return friendRequestRepository.save(request);
    }

    public List<FriendRequest> getPendingRequests(String email) {
        User user = userRepo.findByEmail(email)  // bilo: findByUsername
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));
        return friendRequestRepository.findByReceiverIdAndStatus(user.getId(), FriendRequest.Status.PENDING);
    }

    public FriendRequest respondToRequest(Long requestId, boolean accept, String email) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Zahtev ne postoji"));

        User currentUser = userRepo.findByEmail(email)  // bilo: poređenje sa username
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Nemate pravo da odgovorite na ovaj zahtev");
        }
        if (request.getStatus() != FriendRequest.Status.PENDING) {
            throw new RuntimeException("Zahtev je vec obraden");
        }

        if (accept) {
            request.setStatus(FriendRequest.Status.ACCEPTED);
            User sender = request.getSender();
            User receiver = request.getReceiver();
            sender.addFriend(receiver);
            receiver.addFriend(sender);
            userRepo.save(sender);
            userRepo.save(receiver);
        } else {
            request.setStatus(FriendRequest.Status.REJECTED);
        }

        return friendRequestRepository.save(request);
    }
}