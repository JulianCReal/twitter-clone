package eci.tdse.twitter_clone.service;

import eci.tdse.twitter_clone.dto.response.PostResponse;
import eci.tdse.twitter_clone.entity.Stream;
import eci.tdse.twitter_clone.repository.PostRepository;
import eci.tdse.twitter_clone.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;
    private final PostRepository postRepository;
    private final PostService postService;

    @Transactional(readOnly = true)
    public Page<PostResponse> getPublicStream(int page, int size) {
        Stream publicStream = streamRepository.findByName("public")
                .orElseThrow(() -> new NoSuchElementException("Stream público no encontrado"));

        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return postRepository
                .findByStreamIdOrderByCreatedAtDesc(publicStream.getId(), pageable)
                .map(postService::toResponse);
    }
}
