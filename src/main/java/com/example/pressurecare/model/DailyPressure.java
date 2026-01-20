package com.example.pressurecare.model;

/**
 * 日別の平均気圧データを表すモデルクラス
 * 週間グラフ表示用として使用される
 */
public class DailyPressure {

    /** 日付（yyyy-MM-dd） */
    private String date;

    /** 平均気圧（hPa） */
    private double pressure;

    /**
     * コンストラクタ
     *
     * @param date 日付
     * @param pressure 平均気圧
     */
    public DailyPressure(String date, double pressure) {
        this.date = date;
        this.pressure = pressure;
    }

    /**
     * 日付を取得する
     *
     * @return 日付
     */
    public String getDate() {
        return date;
    }

    /**
     * 平均気圧を取得する
     *
     * @return 平均気圧
     */
    public double getPressure() {
        return pressure;
    }
}
