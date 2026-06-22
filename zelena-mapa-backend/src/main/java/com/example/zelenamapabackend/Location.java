package com.example.zelenamapabackend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double lat;
    private double lng;
    private String status;
    private boolean privateLocation;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private User owner;

    // getters & setters

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }

    public String getStatus() {
        return status;
    }

    public boolean isPrivateLocation() {
        return privateLocation;
    }

    public User getOwner() {
        return owner;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description=description;
    }

    public void setLat(double lat) {
        this.lat=lat;
    }

    public void setLng(double lng) {
        this.lng=lng;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setPrivateLocation(boolean privateLocation) {
        this.privateLocation = privateLocation;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

}