package eci.tdse.twitter_clone;

import eci.tdse.twitter_clone.entity.Stream;
import eci.tdse.twitter_clone.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@Slf4j
public class TwitterCloneApplication {

	public static void main(String[] args) {
		SpringApplication.run(TwitterCloneApplication.class, args);
	}

	// Crea el stream global "public" al arrancar si no existe
	@Bean
	CommandLineRunner initDatabase(StreamRepository streamRepository) {
		return args -> {
			if (streamRepository.findByName("public").isEmpty()) {
				Stream publicStream = Stream.builder()
						.name("public")
						.build();
				streamRepository.save(publicStream);
				log.info("Stream público creado correctamente");
			}
		};
	}
}