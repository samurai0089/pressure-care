package com.example.pressurecare.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.pressurecare.model.City;
import com.example.pressurecare.model.DailyPressure;
import com.example.pressurecare.model.PressureInfo;
import com.example.pressurecare.service.PressureService;

/**
 * 気圧情報に関する画面表示・APIレスポンスを制御するコントローラクラス
 */
@Controller
@RequestMapping("/pressure")
public class PressureController {

    /** 気圧情報を取得するサービス */
    private final PressureService pressureService;

    /**
     * コンストラクタインジェクション
     * 
     * @param pressureService 気圧情報サービス
     */
    public PressureController(PressureService pressureService) {
        this.pressureService = pressureService;
    }

    /**
     * 初期画面表示
     * 都市一覧をModelに詰めて index.html を表示する
     *
     * @param model 画面に渡すデータ
     * @return 表示するテンプレート名
     */
    @GetMapping("/")
    public String showIndex(Model model) {
    	 model.addAttribute("cities", City.values());
    	    model.addAttribute("defaultCity", City.OSAKA.name());

    	    PressureInfo info;
    	    try {
    	        info = pressureService.getPressureFromApi(City.OSAKA);
    	    } catch (Exception e) {
    	        info = PressureInfo.empty();
    	    }

    	    model.addAttribute("pressure", info);
    	    return "index";
    }


    /**
     * 現在の気圧データを取得するAPI
     * Ajax等から呼ばれ、JSON形式でレスポンスを返す
     *
     * @param city 対象都市
     * @return 現在の気圧情報
     */
    @ResponseBody
    @GetMapping("/data")
    public PressureInfo getPressureData(@RequestParam City city) {
        return pressureService.getPressureFromApi(city);
    }

    /**
     * 週間気圧データを取得するAPI
     * グラフ表示用のデータとして使用される
     *
     * @param city 対象都市
     * @return 日別気圧情報のリスト
     */
    @ResponseBody
    @GetMapping("/weekly")
    public List<DailyPressure> getWeekly(@RequestParam City city) {
        return pressureService.getWeeklyPressure(city);
    }
}
