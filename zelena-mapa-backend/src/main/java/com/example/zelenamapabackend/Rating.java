package com.example.zelenamapabackend;

import jakarta.persistence.*;


@Entity
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    public void setRating(int ratingValue) {
        rating = ratingValue;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public int getRating() {
        return rating;
    }
}