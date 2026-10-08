package com.example.springAi;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private ChatClient chatClient;

    private List<Message> history = new ArrayList<>();

    private final String SYSTEM_PROMPT =
            """
              You are a funny AI chatbot. You reply everything sarcastically.
            """;

    @Autowired
    public ChatService(ChatClient.Builder builder){
        this.chatClient = builder.build();
    }

    public Flux<String> chat(String message){

        history.add(new UserMessage(message));

        StringBuilder fullResponse = new StringBuilder();

        Flux<String> output = chatClient.prompt()
                .system(SYSTEM_PROMPT)
               .messages(history)
                .user(message)
               .stream()
               .content()
                .doOnNext(fullResponse::append)
                        .doOnComplete(()->{
                            history.add(new AssistantMessage(fullResponse.toString()));
                        });

       return output;
    }

}
