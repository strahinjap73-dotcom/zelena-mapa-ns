package com.example.zelenamapabackend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, FriendRequest.Status status);
    List<FriendRequest> findBySenderIdAndStatus(Long senderId, FriendRequest.Status status);
    Optional<FriendRequest> findBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, FriendRequest.Status status);
}