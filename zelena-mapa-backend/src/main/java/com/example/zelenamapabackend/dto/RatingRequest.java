package com.example.zelenamapabackend.dto;

public class RatingRequest {

    private int distanceFromCenter;
    private int cleanliness;
    private int greenArea;

    public RatingRequest() {
    }

    public int getDistanceFromCenter() {
        return distanceFromCenter;
    }

    public void setDistanceFromCenter(int distanceFromCenter) {
        this.distanceFromCenter = distanceFromCenter;
    }

    public int getCleanliness() {
        return cleanliness;
    }

    public void setCleanliness(int cleanliness) {
        this.cleanliness = cleanliness;
    }

    public int getGreenArea() {
        return greenArea;
    }

    public void setGreenArea(int greenArea) {
        this.greenArea = greenArea;
    }
}
