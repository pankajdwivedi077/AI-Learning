package com.example.springAi;

import jakarta.annotation.PostConstruct;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    @Value("classpath*:knowledge/*.pdf")
    private Resource[] policyFiles;

    public ChatbotService(VectorStore vectorStore, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
    }

    @PostConstruct
    public void loadKnowledgeBase(){
        // 1. read all pdf file
        // 2. for each file divide them into chunks
        // 3. store chunks in vector db

        List<Document> allChunks = new ArrayList<>();

        TokenTextSplitter splitter = TokenTextSplitter.builder()
                .withChunkSize(150)
                .withMinChunkSizeChars(50)
                .withMinChunkLengthToEmbed(5)
                .withMaxNumChunks(10000)
                .withKeepSeparator(true)
                .build();

        // Loop through each PDF file
        for (Resource resource : policyFiles) {

            PagePdfDocumentReader reader = new PagePdfDocumentReader(resource);
            List<Document> pages = reader.read();
            List<Document> chunks = splitter.apply(pages);
            allChunks.addAll(chunks);
        }
        vectorStore.add(allChunks);
    }

    public String answerUserQuery(String question) {
        // 1. Question --> vector
        //2. similarity search in our vector db
        //3. top 4 results fetch

        List<Document> relevantChunks = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(4)
                        .build()
        );

        StringBuilder context = new StringBuilder();

        for (Document document : relevantChunks) {

            context.append(document.getText())
                    .append("\n\n");
        }

        String finalContext = context.toString();

        String prompt = """
                You are an AI customer support assistant for our e-commerce company.

                Answer the customer using ONLY the company information provided below.

                If the answer is not available in the provided information, say:
                "I don't have that information in the company documents."
                
                COMPANMY INFORMATION
                %s
                
                """.formatted(finalContext);

        return chatClient.prompt()
                .system(prompt)
                .user(question)
                .call()
                .content();
    }

}