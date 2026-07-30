package com.example.zelenamapabackend;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiService {

    private final LocationRepository locationRepository;

    @Value("${openai.api.key}")
    private String apiKey;

    public AiService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public String recommend(String question) {

        List<Location> locations = locationRepository.findAll();

        StringBuilder locationsText = new StringBuilder();

        for (Location location : locations) {

            locationsText.append("""
                    Naziv: %s
                    Opis: %s

                    """.formatted(
                    location.getName(),
                    location.getDescription()
            ));

        }

        String prompt = """
                Ti si AI asistent aplikacije "Zelena mapa Novog Sada".

                Imaš sledeće lokacije:

                %s

                Korisnik traži:

                %s

                Preporuči najbolju lokaciju.
                Odgovori u 2-3 rečenice.
                """.formatted(locationsText, question);

        OpenAIClient client = OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .build();

        ChatCompletionCreateParams params =
                ChatCompletionCreateParams.builder()
                        .model(ChatModel.GPT_4_1_MINI)
                        .addUserMessage(prompt)
                        .build();

        return client.chat()
                .completions()
                .create(params)
                .choices()
                .getFirst()
                .message()
                .content()
                .orElse("Nije moguće dobiti odgovor.");
    }

}