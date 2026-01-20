package com.example.pressurecare.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.pressurecare.model.City;
import com.example.pressurecare.model.ConditionLevel;
import com.example.pressurecare.model.DailyPressure;
import com.example.pressurecare.model.PressureInfo;

/**
 * 気圧データを外部APIから取得・加工し、
 * 画面やAPIに渡すためのビジネスロジックを担うサービスクラス
 */
@Service
public class PressureService {

    /** 注意レベル判定の閾値（前日比） */
    private static final double WARNING_THRESHOLD = -3.0;

    /** 危険レベル判定の閾値（前日比） */
    private static final double DANGER_THRESHOLD = -6.0;

    /** 外部気象API通信用 */
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 現在の気圧・前日平均との差分・体調レベルをまとめて取得する
     *
     * @param city 対象都市
     * @return 画面表示・通知用の気圧情報
     */
    public PressureInfo getPressureFromApi(City city) {
        double currentPressure = getCurrentPressure(city);
        double yesterdayPressure = getYesterdayAveragePressure(city);

        double diff = currentPressure - yesterdayPressure;

        PressureInfo info = new PressureInfo();
        info.setCurrentPressure(currentPressure);
        info.setYesterdayPressure(yesterdayPressure);
        info.setDifference(diff);
        info.setConditionLevel(judgeCondition(diff));

        return info;
    }

    /**
     * 指定都市の現在の気圧を取得する
     *
     * @param city 対象都市
     * @return 現在の地表気圧
     */
    private double getCurrentPressure(City city) {
        String url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + city.getLatitude() +
            "&longitude=" + city.getLongitude() +
            "&current=surface_pressure";

        Map response = restTemplate.getForObject(url, Map.class);
        Map current = (Map) response.get("current");
        return ((Number) current.get("surface_pressure")).doubleValue();
    }

    /**
     * 前日の1日分の気圧から平均値を算出する
     *
     * @param city 対象都市
     * @return 前日の平均気圧
     */
    private double getYesterdayAveragePressure(City city) {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        String url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + city.getLatitude() +
            "&longitude=" + city.getLongitude() +
            "&hourly=surface_pressure" +
            "&start_date=" + yesterday +
            "&end_date=" + yesterday;

        Map response = restTemplate.getForObject(url, Map.class);
        Map hourly = (Map) response.get("hourly");
        List<Number> pressures = (List<Number>) hourly.get("surface_pressure");

        double sum = 0;
        for (Number p : pressures) {
            sum += p.doubleValue();
        }
        return sum / pressures.size();
    }

    /**
     * 過去7日分の気圧データを日別平均に変換して取得する
     * （グラフ表示用）
     *
     * @param city 対象都市
     * @return 日別平均気圧リスト
     */
    public List<DailyPressure> getWeeklyPressure(City city) {

        LocalDate end = LocalDate.now().minusDays(1);
        LocalDate start = end.minusDays(6);

        String url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + city.getLatitude() +
            "&longitude=" + city.getLongitude() +
            "&hourly=surface_pressure" +
            "&start_date=" + start +
            "&end_date=" + end;

        Map response = restTemplate.getForObject(url, Map.class);
        Map hourly = (Map) response.get("hourly");

        List<String> times = (List<String>) hourly.get("time");
        List<Number> pressures = (List<Number>) hourly.get("surface_pressure");

        // 日付ごとに気圧をまとめる
        Map<String, List<Double>> dailyMap = new LinkedHashMap<>();

        for (int i = 0; i < times.size(); i++) {
            String date = times.get(i).substring(0, 10);
            dailyMap.putIfAbsent(date, new ArrayList<>());
            dailyMap.get(date).add(pressures.get(i).doubleValue());
        }

        // 日別平均値を算出
        List<DailyPressure> result = new ArrayList<>();
        for (Map.Entry<String, List<Double>> entry : dailyMap.entrySet()) {
            double avg = entry.getValue()
                              .stream()
                              .mapToDouble(Double::doubleValue)
                              .average()
                              .orElse(0);
            result.add(new DailyPressure(entry.getKey(), avg));
        }

        return result;
    }

    /**
     * 気圧差から体調レベルを判定する
     *
     * @param diff 前日平均との差
     * @return 体調レベル
     */
    private ConditionLevel judgeCondition(double diff) {
        if (diff <= DANGER_THRESHOLD) {
            return ConditionLevel.DANGER;
        }
        if (diff <= WARNING_THRESHOLD) {
            return ConditionLevel.WARNING;
        }
        return ConditionLevel.SAFE;
    }
}
