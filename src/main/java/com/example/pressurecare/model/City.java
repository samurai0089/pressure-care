package com.example.pressurecare.model;

public enum City {
    OSAKA("大阪", 34.6937, 135.5023),
    TOKYO("東京", 35.6895, 139.6917),
    NAGOYA("名古屋", 35.1815, 136.9066),
    FUKUOKA("福岡", 33.5904, 130.4017),
    SAPPORO("札幌", 43.0618, 141.3545);

    private final String label;
    private final double latitude;
    private final double longitude;

    City(String label, double latitude, double longitude) {
        this.label = label;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getLabel() { return label; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
}
