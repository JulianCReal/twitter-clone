package eci.tdse.twitter_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import eci.tdse.twitter_clone.dto.request.CreatePostRequest;
import eci.tdse.twitter_clone.entity.Stream;
import eci.tdse.twitter_clone.entity.User;
import eci.tdse.twitter_clone.repository.StreamRepository;
import eci.tdse.twitter_clone.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PostControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired StreamRepository streamRepository;

    // JWT simulado que Spring Security acepta en tests sin llamar a Auth0
    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor mockJwt;

    @BeforeEach
    void setUp() {
        // Crear el stream público si no existe
        if (streamRepository.findByName("public").isEmpty()) {
            streamRepository.save(Stream.builder().name("public").build());
        }

        // Pre-crear el usuario en BD para que findOrCreate no falle
        userRepository.save(User.builder()
                .auth0Id("auth0|test-user-123")
                .username("testuser")
                .email("test@example.com")
                .build());

        // Simular JWT de Auth0 con los claims necesarios
        mockJwt = jwt()
                .jwt(builder -> builder
                        .subject("auth0|test-user-123")
                        .claim("email", "test@example.com")
                        .claim("nickname", "testuser")
                );
    }

    @Test
    @DisplayName("GET /api/posts — debe devolver lista vacía sin autenticación")
    void getPostsPublic() throws Exception {
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("GET /api/stream — debe devolver el feed público")
    void getStreamPublic() throws Exception {
        mockMvc.perform(get("/api/stream"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("POST /api/posts — debe crear post con JWT válido")
    void createPost_withValidJwt() throws Exception {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Hola mundo desde el test!");

        mockMvc.perform(post("/api/posts")
                        .with(mockJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Hola mundo desde el test!"))
                .andExpect(jsonPath("$.author.username").value("testuser"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @DisplayName("POST /api/posts — debe fallar sin autenticación (401)")
    void createPost_withoutJwt() throws Exception {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Post sin token");

        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/posts — debe fallar si el contenido supera 140 chars (400)")
    void createPost_tooLong() throws Exception {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("a".repeat(141));

        mockMvc.perform(post("/api/posts")
                        .with(mockJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.content").exists());
    }

    @Test
    @DisplayName("POST /api/posts — debe fallar si el contenido está vacío (400)")
    void createPost_empty() throws Exception {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("");

        mockMvc.perform(post("/api/posts")
                        .with(mockJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/me — debe devolver perfil del usuario autenticado")
    void getMyProfile_withValidJwt() throws Exception {
        mockMvc.perform(get("/api/me").with(mockJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @DisplayName("GET /api/me — debe fallar sin JWT (401)")
    void getMyProfile_withoutJwt() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DELETE /api/posts/{id} — debe fallar si no eres el autor (403)")
    void deletePost_notOwner() throws Exception {
        // Crear post con usuario de test
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Post de testuser");
        String response = mockMvc.perform(post("/api/posts")
                        .with(mockJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();

        String postId = objectMapper.readTree(response).get("id").asText();

        // Intentar borrar con otro usuario
        var otherJwt = jwt().jwt(b -> b
                .subject("auth0|other-user-999")
                .claim("email", "other@example.com")
                .claim("nickname", "otheruser"));

        mockMvc.perform(delete("/api/posts/" + postId).with(otherJwt))
                .andExpect(status().isForbidden());
    }
}
