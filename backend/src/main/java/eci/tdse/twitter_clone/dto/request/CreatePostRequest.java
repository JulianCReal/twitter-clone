package eci.tdse.twitter_clone.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePostRequest {

    @NotBlank(message = "El contenido no puede estar vacío")
    @Size(min = 1, max = 140, message = "El post debe tener entre 1 y 140 caracteres")
    private String content;
}
