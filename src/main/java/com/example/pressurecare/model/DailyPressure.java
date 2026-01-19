package com.example.pressurecare.model;

public class DailyPressure {

    private String date;
    private double pressure;

    public DailyPressure(String date, double pressure) {
        this.date = date;
        this.pressure = pressure;
    }

    public String getDate() {
        return date;
    }

    public double getPressure() {
        return pressure;
    }
}
