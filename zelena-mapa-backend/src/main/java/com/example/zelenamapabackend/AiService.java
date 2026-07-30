package com.example.zelenamapabackend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiService {


    private final LocationRepository locationRepository;

    private final RestClient restClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String apiKey;



    public AiService(LocationRepository locationRepository) {

        this.locationRepository = locationRepository;

        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
    }



    public String recommend(String question) {


        List<Location> locations =
                locationRepository.findAll();



        StringBuilder locationsText =
                new StringBuilder();



        for(Location location : locations) {


            locationsText.append("""
                    
                    Naziv: %s
                    Opis: %s
                    
                    """
                    .formatted(
                            location.getName(),
                            location.getDescription()
                    ));
        }



        String prompt = """
                
                Ti si AI asistent aplikacije "Zelena mapa Novog Sada".

                Na osnovu dostupnih lokacija preporuči korisniku najbolje mesto.

                Dostupne lokacije:

                %s


                Korisnik traži:

                %s


                Odgovori kratko (2-3 rečenice).
                Obavezno navedi naziv preporučene lokacije.

                """
                .formatted(
                        locationsText,
                        question
                );



        try {


            Map<String,Object> requestBody = Map.of(

                    "model",
                    "gpt-4.1-mini",

                    "messages",
                    List.of(

                            Map.of(
                                    "role",
                                    "system",
                                    "content",
                                    "Ti pomažeš korisnicima da pronađu zelene površine."
                            ),

                            Map.of(
                                    "role",
                                    "user",
                                    "content",
                                    prompt
                            )
                    )
            );



            String response =
                    restClient.post()

                            .uri("/chat/completions")

                            .header(
                                    "Authorization",
                                    "Bearer " + apiKey
                            )

                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )

                            .body(requestBody)

                            .retrieve()

                            .body(String.class);



            JsonNode json =
                    objectMapper.readTree(response);



            return json
                    .get("choices")
                    .get(0)
                    .get("message")
                    .get("content")
                    .asText();



        } catch(Exception e) {

            e.printStackTrace();

            return "Došlo je do greške prilikom AI preporuke.";
        }

    }

}