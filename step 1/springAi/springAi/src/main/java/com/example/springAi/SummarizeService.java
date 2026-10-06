package com.example.springAi;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SummarizeService {

    private ChatClient chatClient;

    @Autowired
    public SummarizeService(ChatClient.Builder builder){
        this.chatClient = builder.build();
    }

    public String summarize(String ticket){
       String output = chatClient.prompt()
               .user("Sumarrize this support ticket in 2 lines : \n\n " + ticket)
               .call()
               .content();

       return output;
    }

}
