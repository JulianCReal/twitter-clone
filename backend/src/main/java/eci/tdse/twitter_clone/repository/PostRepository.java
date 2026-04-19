package eci.tdse.twitter_clone.repository;

import eci.tdse.twitter_clone.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByStreamIdOrderByCreatedAtDesc(UUID streamId, Pageable pageable);
    long countByUserId(UUID userId);
}
