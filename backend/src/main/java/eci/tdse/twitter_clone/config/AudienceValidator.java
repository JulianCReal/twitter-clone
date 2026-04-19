package eci.tdse.twitter_clone.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

/**
 * Valida que el JWT incluya el "audience" correcto configurado en Auth0.
 * Spring Security no valida el audience por defecto — este validator lo añade.
 */
public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final List<String> audiences;

    public AudienceValidator(List<String> audiences) {
        this.audiences = audiences;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        List<String> tokenAudiences = jwt.getAudience();
        boolean hasAudience = tokenAudiences.stream()
                .anyMatch(audiences::contains);

        if (hasAudience) {
            return OAuth2TokenValidatorResult.success();
        }

        OAuth2Error error = new OAuth2Error(
                "invalid_token",
                "El token no contiene el audience requerido: " + audiences,
                null
        );
        return OAuth2TokenValidatorResult.failure(error);
    }
}
