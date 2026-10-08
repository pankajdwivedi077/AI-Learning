package com.example.springAi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ChatController {

    private ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService){
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public Flux<String> chat(@RequestBody String message){
        return chatService.chat(message);
    }

}
