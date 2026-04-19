package eci.tdse.twitter_clone.service;

import eci.tdse.twitter_clone.dto.request.CreatePostRequest;
import eci.tdse.twitter_clone.dto.response.PostResponse;
import eci.tdse.twitter_clone.entity.Post;
import eci.tdse.twitter_clone.entity.Stream;
import eci.tdse.twitter_clone.entity.User;
import eci.tdse.twitter_clone.repository.PostRepository;
import eci.tdse.twitter_clone.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final StreamRepository streamRepository;
    private final UserService userService;

    @Transactional
    public PostResponse createPost(Jwt jwt, CreatePostRequest request) {
        User author = userService.findOrCreateFromJwt(jwt);

        // Siempre existe un stream público (creado al arrancar la app)
        Stream publicStream = streamRepository.findByName("public")
                .orElseThrow(() -> new IllegalStateException("Stream público no encontrado"));

        Post post = Post.builder()
                .content(request.getContent().strip())
                .user(author)
                .stream(publicStream)
                .build();

        Post saved = postRepository.save(post);
        log.info("Post creado por '{}': {} chars", author.getUsername(), saved.getContent().length());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getRecentPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50)); // máx 50 por página
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(UUID id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post no encontrado: " + id));
        return toResponse(post);
    }

    @Transactional
    public void deletePost(Jwt jwt, UUID postId) {
        User requester = userService.findOrCreateFromJwt(jwt);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post no encontrado: " + postId));

        // Solo el autor puede borrar su propio post
        if (!post.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("Solo puedes eliminar tus propios posts");
        }

        postRepository.delete(post);
        log.info("Post {} eliminado por '{}'", postId, requester.getUsername());
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .author(PostResponse.AuthorResponse.builder()
                        .id(post.getUser().getId())
                        .username(post.getUser().getUsername())
                        .avatarUrl(post.getUser().getAvatarUrl())
                        .build())
                .build();
    }
}