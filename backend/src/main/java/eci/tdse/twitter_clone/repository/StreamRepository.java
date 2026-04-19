package eci.tdse.twitter_clone.repository;

import eci.tdse.twitter_clone.entity.Stream;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StreamRepository extends JpaRepository<Stream, UUID> {
    Optional<Stream> findByName(String name);
}
