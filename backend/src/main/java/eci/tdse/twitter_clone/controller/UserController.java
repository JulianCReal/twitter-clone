package eci.tdse.twitter_clone.controller;

import eci.tdse.twitter_clone.dto.request.UpdateProfileRequest;
import eci.tdse.twitter_clone.dto.response.UserResponse;
import eci.tdse.twitter_clone.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Users", description = "Perfil de usuario y datos propios")
public class UserController {

    private final UserService userService;

    // ── /api/me ──────────────────────────────────────────────────────────────

    @Operation(
            summary = "Obtener mi perfil",
            description = """
            Devuelve la información del usuario autenticado actualmente.
            Si es la primera vez que el usuario inicia sesión, se crea automáticamente
            un perfil con los datos del token de Auth0.
            """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del usuario"),
            @ApiResponse(responseCode = "401", description = "Token JWT inválido o ausente")
    })
    @GetMapping("/api/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getProfile(jwt));
    }

    @Operation(
            summary = "Actualizar mi perfil",
            description = "Actualiza username y/o avatar del usuario autenticado.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil actualizado"),
            @ApiResponse(responseCode = "400", description = "Username inválido o ya en uso"),
            @ApiResponse(responseCode = "401", description = "Token JWT inválido o ausente")
    })
    @PutMapping("/api/me")
    public ResponseEntity<UserResponse> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(jwt, request));
    }

    // ── /api/users ───────────────────────────────────────────────────────────

    @Operation(
            summary = "Obtener perfil público de un usuario",
            description = "Devuelve información pública de cualquier usuario por su ID. Endpoint público."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del usuario"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @GetMapping("/api/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @Parameter(description = "UUID del usuario") @PathVariable UUID id
    ) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
