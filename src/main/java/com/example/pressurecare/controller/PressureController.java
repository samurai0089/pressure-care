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

@Controller
@RequestMapping("/pressure")
public class PressureController {

    private final PressureService pressureService;

    public PressureController(PressureService pressureService) {
        this.pressureService = pressureService;
    }

    @GetMapping
    public String showIndex(Model model) {
        model.addAttribute("cities", City.values());
        return "index";
    }

    @ResponseBody
    @GetMapping("/data")
    public PressureInfo getPressureData(@RequestParam City city) {
        return pressureService.getPressureFromApi(city);
    }

    @ResponseBody
    @GetMapping("/weekly")
    public List<DailyPressure> getWeekly(@RequestParam City city) {
        return pressureService.getWeeklyPressure(city);
    }
}
