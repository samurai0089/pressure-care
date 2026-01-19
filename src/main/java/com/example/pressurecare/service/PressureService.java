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

@Service
public class PressureService {

	private static final double WARNING_THRESHOLD = -3.0;
	private static final double DANGER_THRESHOLD = -6.0;
//    private static final double LATITUDE = 34.6937;
//    private static final double LONGITUDE = 135.5023;

    private final RestTemplate restTemplate = new RestTemplate();

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
        for (Number p : pressures) sum += p.doubleValue();
        return sum / pressures.size();
    }

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

        Map<String, List<Double>> dailyMap = new LinkedHashMap<>();

        for (int i = 0; i < times.size(); i++) {
            String date = times.get(i).substring(0, 10);
            dailyMap.putIfAbsent(date, new ArrayList<>());
            dailyMap.get(date).add(pressures.get(i).doubleValue());
        }

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
    
    /** 体調レベル判定 */
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
