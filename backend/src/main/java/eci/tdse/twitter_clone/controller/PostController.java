package eci.tdse.twitter_clone.controller;

import eci.tdse.twitter_clone.dto.request.CreatePostRequest;
import eci.tdse.twitter_clone.dto.response.PostResponse;
import eci.tdse.twitter_clone.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "Operaciones sobre posts individuales")
public class PostController {

    private final PostService postService;

    @Operation(
            summary = "Obtener todos los posts",
            description = "Devuelve los posts ordenados del más reciente al más antiguo. Endpoint público."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de posts paginada")
    })
    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Cantidad de posts por página (máx 50)") @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(postService.getRecentPosts(page, size));
    }

    @Operation(
            summary = "Obtener un post por ID",
            description = "Devuelve un post específico. Endpoint público."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Post encontrado"),
            @ApiResponse(responseCode = "404", description = "Post no encontrado", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @Parameter(description = "UUID del post") @PathVariable UUID id
    ) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    @Operation(
            summary = "Crear un nuevo post",
            description = "Crea un post de máximo 140 caracteres. Requiere autenticación.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Post creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Validación fallida (ej: más de 140 chars)", content = @Content),
            @ApiResponse(responseCode = "401", description = "Token JWT inválido o ausente", content = @Content)
    })
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePostRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(jwt, request));
    }

    @Operation(
            summary = "Eliminar un post",
            description = "Elimina un post. Solo el autor puede eliminar su propio post.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Post eliminado"),
            @ApiResponse(responseCode = "403", description = "No eres el autor del post", content = @Content),
            @ApiResponse(responseCode = "404", description = "Post no encontrado", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "UUID del post a eliminar") @PathVariable UUID id
    ) {
        postService.deletePost(jwt, id);
        return ResponseEntity.noContent().build();
    }
}