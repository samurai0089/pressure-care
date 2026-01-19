package com.example.pressurecare.model;

public class PressureInfo {

    private double currentPressure;
    private double yesterdayPressure;
    private double difference;
    private ConditionLevel conditionLevel;

    public double getCurrentPressure() {
        return currentPressure;
    }
    public void setCurrentPressure(double currentPressure) {
        this.currentPressure = currentPressure;
    }

    public double getYesterdayPressure() {
        return yesterdayPressure;
    }
    public void setYesterdayPressure(double yesterdayPressure) {
        this.yesterdayPressure = yesterdayPressure;
    }

    public double getDifference() {
        return difference;
    }
    public void setDifference(double difference) {
        this.difference = difference;
    }

 // getter / setter
    public ConditionLevel getConditionLevel() {
        return conditionLevel;
    }

    public void setConditionLevel(ConditionLevel conditionLevel) {
        this.conditionLevel = conditionLevel;
    }
}
