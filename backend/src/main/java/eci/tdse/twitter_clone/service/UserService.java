package eci.tdse.twitter_clone.service;

import eci.tdse.twitter_clone.dto.request.UpdateProfileRequest;
import eci.tdse.twitter_clone.dto.response.UserResponse;
import eci.tdse.twitter_clone.entity.User;
import eci.tdse.twitter_clone.repository.PostRepository;
import eci.tdse.twitter_clone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public User findOrCreateFromJwt(Jwt jwt) {
        String auth0Id = jwt.getSubject(); // "auth0|abc123" o "google-oauth2|abc123"

        return userRepository.findByAuth0Id(auth0Id)
                .orElseGet(() -> {
                    // Auth0 no incluye email/nickname en el access token por defecto.
                    // Leemos los claims de forma defensiva con fallbacks seguros.
                    String email    = jwt.getClaimAsString("email");
                    String nickname = jwt.getClaimAsString("nickname");
                    String name     = jwt.getClaimAsString("name");
                    String picture  = jwt.getClaimAsString("picture");

                    // Construir baseUsername de forma segura
                    String baseUsername;
                    if (nickname != null && !nickname.isBlank()) {
                        baseUsername = nickname;
                    } else if (name != null && !name.isBlank()) {
                        baseUsername = name;
                    } else if (email != null && email.contains("@")) {
                        baseUsername = email.split("@")[0];
                    } else {
                        // Fallback: usar la parte final del sub (ej: "abc123" de "auth0|abc123")
                        String[] parts = auth0Id.split("[|_]");
                        baseUsername = parts[parts.length - 1];
                    }

                    // Construir email de forma segura
                    if (email == null || email.isBlank()) {
                        // Generar email ficticio único basado en el sub
                        email = auth0Id.replaceAll("[^a-zA-Z0-9]", "_") + "@placeholder.com";
                    }

                    String username = buildUniqueUsername(baseUsername);

                    User newUser = User.builder()
                            .auth0Id(auth0Id)
                            .email(email)
                            .username(username)
                            .avatarUrl(picture)
                            .createdAt(java.time.Instant.now())
                            .build();

                    log.info("Nuevo usuario creado desde Auth0: {} (sub: {})", username, auth0Id);
                    User saved = userRepository.save(newUser);
                    // Re-leer desde BD para obtener createdAt generado por Hibernate
                    return userRepository.findById(saved.getId()).orElse(saved);
                });
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Jwt jwt) {
        User user = findOrCreateFromJwt(jwt);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Jwt jwt, UpdateProfileRequest request) {
        User user = findOrCreateFromJwt(jwt);

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            boolean taken = userRepository.existsByUsername(request.getUsername())
                    && !user.getUsername().equals(request.getUsername());
            if (taken) {
                throw new IllegalArgumentException(
                        "El username '" + request.getUsername() + "' ya está en uso");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + id));
        return toResponse(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String buildUniqueUsername(String base) {
        // Limpiar caracteres no válidos y pasar a minúsculas
        String candidate = base.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
        if (candidate.isBlank()) candidate = "user";
        if (candidate.length() > 40) candidate = candidate.substring(0, 40);

        String username = candidate;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = candidate + suffix++;
        }
        return username;
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .postCount(postRepository.countByUserId(user.getId()))
                .build();
    }
}