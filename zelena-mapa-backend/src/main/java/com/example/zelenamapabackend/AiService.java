package com.example.zelenamapabackend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiService {

    private final LocationRepository locationRepository;


    public AiService(LocationRepository locationRepository){
            this.locationRepository = locationRepository;
    }

    @Value("${openai.api.key}")
    private String apiKey;


    public String recommend(String question) {

        List<Location> locations =
                locationRepository.findAll();


        StringBuilder locationsText = new StringBuilder();


        for(Location location : locations){

            locationsText.append("""
    
    Naziv: %s
    Opis: %s
    
    """.formatted(
                    location.getName(),
                    location.getDescription()
            ));

        }
        String prompt = """

Ti si AI asistent aplikacije Zelena mapa Novog Sada.

Na osnovu sledećih lokacija preporuči korisniku najbolje mesto.

LOKACIJE:

%s


Korisnik pita:

%s


Odgovori kratko i objasni razlog preporuke.

""".formatted(
                locationsText.toString(),
                question
        );


        // ovde ide poziv OpenAI API-ja

        return "Preporučujem Limanski park jer je miran i ima puno zelenila.";
    }
}