package com.example.springAi;

import com.example.springAi.aitools.CalculatorTool;
import com.example.springAi.aitools.CurrencyExchangeTool;
import com.example.springAi.aitools.WeatherTool;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SummarizeService {

    private ChatClient chatClient;

    private List<Message> history = new ArrayList<>();

    private CalculatorTool calculatorTool;
    private WeatherTool weatherTool;
    private CurrencyExchangeTool currencyExchangeTool;

    private final String SYSTEM_PROMPT =
            """
               You are a helpful AI assistant with access to external tools.

                       Follow these rules:
                            1. For arithmetic calculations, ALWAYS use the calculator tool.
                            2. Always use calculator tool for even trivial calculation
                            3. For current weather, ALWAYS use the currentWeather tool.
                            4. For currency conversion or exchange rates, ALWAYS use the convertCurrency tool.
                            5. You may call multiple tools when solving a multi-step request.
                            6. After receiving tool results, explain the answer naturally.
                            7. Never invent current weather or exchange-rate information.
            """;

    @Autowired
    public SummarizeService(ChatClient.Builder builder, CalculatorTool calculatorTool,
                            WeatherTool weatherTool,
                            CurrencyExchangeTool currencyExchangeTool){
        this.chatClient = builder.build();
        this.calculatorTool = calculatorTool;
        this.weatherTool = weatherTool;
        this.currencyExchangeTool = currencyExchangeTool;
    }

    public String chat(String message){

        history.add(new UserMessage(message));

        String output = chatClient.prompt()
                .system(SYSTEM_PROMPT)
               .messages(history)
                .tools(calculatorTool, weatherTool, currencyExchangeTool)
               .call()
               .content();

        history.add(new AssistantMessage(output));

       return output;
    }

}
