package eci.tdse.twitter_clone.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String avatarUrl;
    private Instant createdAt;
    private long postCount;
}
