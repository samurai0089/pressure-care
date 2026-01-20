package com.example.pressurecare.model;

/**
 * 気圧変化による体調レベルを表すEnum
 * 判定結果と画面表示用ラベルを紐づけて管理する
 */
public enum ConditionLevel {

    /** 問題なし（安定） */
    SAFE("安全"),

    /** 注意が必要 */
    WARNING("注意"),

    /** 体調不良の恐れあり */
    DANGER("警戒");

    /** 画面表示用ラベル */
    private final String label;

    /**
     * コンストラクタ
     *
     * @param label 表示用文言
     */
    ConditionLevel(String label) {
        this.label = label;
    }

    /**
     * 表示用ラベルを取得する
     *
     * @return 体調レベルの表示名
     */
    public String getLabel() {
        return label;
    }
}
