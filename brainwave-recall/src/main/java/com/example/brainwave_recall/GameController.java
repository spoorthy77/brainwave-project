package com.example.brainwave_recall;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/game")
public class GameController {

    @PostMapping("/start")
    public Map<String, Object> startGame() {

        System.out.println("API CALLED");

        Random random = new Random();

        List<Integer> numbers = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            numbers.add(random.nextInt(90) + 10);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("numbers", numbers);

        return response;
    }
}