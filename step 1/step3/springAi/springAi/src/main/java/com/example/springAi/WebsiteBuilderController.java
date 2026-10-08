package com.example.springAi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/website")
public class WebsiteBuilderController {

    private WebsiteBuilderService websiteBuilderService;

    @Autowired
    public WebsiteBuilderController(WebsiteBuilderService websiteBuilderService){
        this.websiteBuilderService = websiteBuilderService;
    }

    @PostMapping()
    public String generateWebsite(@RequestBody String message){
        return websiteBuilderService.generate(message);
    }

}
