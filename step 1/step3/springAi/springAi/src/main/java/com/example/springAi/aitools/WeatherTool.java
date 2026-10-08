package com.example.springAi.aitools;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

@Component
public class WeatherTool {

    private RestClient restClient;
    private  String apikey;

    @Autowired
    public WeatherTool(RestClient.Builder builder,
                       @Value("${weather.api.key}") String apikey){
        this.restClient = builder.baseUrl("https://api.weatherapi.com/v1").build();
        this.apikey = apikey;
    }

    @Tool(description = "Get the current weather of a city.")
    public String currentWeather(
            @ToolParam(description = "Name of the city") String city) {

        System.out.println("Weather tool called");

        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/current.json")
                        .queryParam("key", apikey)
                        .queryParam("q", city)
                        .build())
                .retrieve()
                .body(String.class);
    }

}
