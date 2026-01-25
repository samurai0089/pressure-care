package com.example.pressurecare.model;

/**
 * 現在の気圧状況をまとめた情報クラス
 * 画面表示・APIレスポンス・通知判定に使用される
 */
public class PressureInfo {

    /** 現在の気圧（hPa） */
    private double currentPressure;

    /** 前日の平均気圧（hPa） */
    private double yesterdayPressure;

    /** 前日平均との差（現在 − 前日平均） */
    private double difference;

    /** 気圧変化による体調レベル */
    private ConditionLevel conditionLevel;

    
    public static PressureInfo empty() {
        PressureInfo info = new PressureInfo();
        info.setCurrentPressure(0);
        info.setYesterdayPressure(0);
        info.setDifference(0);
        info.setConditionLevel(ConditionLevel.SAFE); // ★ enum を渡す
        return info;
    }


    /** 現在の気圧を取得 */
    public double getCurrentPressure() {
        return currentPressure;
    }

    /** 現在の気圧を設定 */
    public void setCurrentPressure(double currentPressure) {
        this.currentPressure = currentPressure;
    }

    /** 前日の平均気圧を取得 */
    public double getYesterdayPressure() {
        return yesterdayPressure;
    }

    /** 前日の平均気圧を設定 */
    public void setYesterdayPressure(double yesterdayPressure) {
        this.yesterdayPressure = yesterdayPressure;
    }

    /** 前日平均との差を取得 */
    public double getDifference() {
        return difference;
    }

    /** 前日平均との差を設定 */
    public void setDifference(double difference) {
        this.difference = difference;
    }

    /** 体調レベルを取得 */
    public ConditionLevel getConditionLevel() {
        return conditionLevel;
    }

    /** 体調レベルを設定 */
    public void setConditionLevel(ConditionLevel conditionLevel) {
        this.conditionLevel = conditionLevel;
    }
}
