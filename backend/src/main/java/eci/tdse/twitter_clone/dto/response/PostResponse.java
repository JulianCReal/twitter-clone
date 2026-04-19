package eci.tdse.twitter_clone.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class PostResponse {
    private UUID id;
    private String content;
    private Instant createdAt;
    private AuthorResponse author;

    @Data @Builder
    public static class AuthorResponse {
        private UUID id;
        private String username;
        private String avatarUrl;
    }
}
