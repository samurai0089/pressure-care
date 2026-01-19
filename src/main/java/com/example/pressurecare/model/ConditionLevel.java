package com.example.pressurecare.model;

public enum ConditionLevel {
    SAFE("安全"),
    WARNING("注意"),
    DANGER("警戒");

    private final String label;

    ConditionLevel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
