package com.example.pressurecare.model;

/**
 * 対象都市を表すEnum
 * 表示用名称と緯度・経度をセットで管理する
 */
public enum City {

    /** 大阪 */
    OSAKA("大阪", 34.6937, 135.5023),

    /** 東京 */
    TOKYO("東京", 35.6895, 139.6917),

    /** 名古屋 */
    NAGOYA("名古屋", 35.1815, 136.9066),

    /** 福岡 */
    FUKUOKA("福岡", 33.5904, 130.4017),

    /** 札幌 */
    SAPPORO("札幌", 43.0618, 141.3545);

    /** 画面表示用の都市名 */
    private final String label;

    /** 緯度（外部API通信用） */
    private final double latitude;

    /** 経度（外部API通信用） */
    private final double longitude;

    /**
     * コンストラクタ
     *
     * @param label 表示用名称
     * @param latitude 緯度
     * @param longitude 経度
     */
    City(String label, double latitude, double longitude) {
        this.label = label;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    /** 表示用都市名を取得 */
    public String getLabel() {
        return label;
    }

    /** 緯度を取得 */
    public double getLatitude() {
        return latitude;
    }

    /** 経度を取得 */
    public double getLongitude() {
        return longitude;
    }
}
