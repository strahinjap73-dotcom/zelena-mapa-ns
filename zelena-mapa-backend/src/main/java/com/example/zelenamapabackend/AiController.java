package com.example.zelenamapabackend;

import com.example.zelenamapabackend.dto.AiRequest;
import com.example.zelenamapabackend.dto.AiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AiController {


    private final AiService aiService;


    public AiController(AiService aiService){
        this.aiService = aiService;
    }


    @PostMapping("/recommend")
    public AiResponse recommend(
            @RequestBody AiRequest request
    ){

        String answer =
                aiService.recommend(request.getQuestion());

        return new AiResponse(answer);
    }

}