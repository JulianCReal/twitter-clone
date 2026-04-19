package eci.tdse.twitter_clone.controller;

import eci.tdse.twitter_clone.dto.response.PostResponse;
import eci.tdse.twitter_clone.service.StreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
@Tag(name = "Stream", description = "Feed público global de posts")
public class StreamController {

    private final StreamService streamService;

    @Operation(
            summary = "Obtener el feed público",
            description = """
            Devuelve todos los posts del stream público, ordenados del más reciente al más antiguo.
            Este endpoint es completamente público — no requiere autenticación.
            Ideal para que cualquier visitante vea el feed sin necesidad de iniciar sesión.
            """
    )
    @ApiResponse(responseCode = "200", description = "Feed de posts paginado")
    @GetMapping
    public ResponseEntity<Page<PostResponse>> getPublicStream(
            @Parameter(description = "Página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Posts por página (máx 50)")  @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(streamService.getPublicStream(page, size));
    }
}
