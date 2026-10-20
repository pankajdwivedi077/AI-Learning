package com.example.springAi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    private ChatbotService chatbotService;

    @Autowired
    public ChatbotController(ChatbotService chatbotService){
        this.chatbotService = chatbotService;
    }

    @GetMapping("/query")
    public Map<String, String> query(@RequestParam String question) {
        return Map.of("answer", chatbotService.answerUserQuery(question));
    }

}
