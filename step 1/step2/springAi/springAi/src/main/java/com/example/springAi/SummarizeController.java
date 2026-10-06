package com.example.springAi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class SummarizeController {

    private SummarizeService summarizeService;

    @Autowired
    public SummarizeController(SummarizeService summarizeService){
        this.summarizeService = summarizeService;
    }

    @PostMapping("/chat")
    public String chat(@RequestBody String message){
        return summarizeService.chat(message);
    }

}
