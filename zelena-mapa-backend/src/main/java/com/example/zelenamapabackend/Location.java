package com.example.zelenamapabackend;

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

}