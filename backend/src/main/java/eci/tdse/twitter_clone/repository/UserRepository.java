package eci.tdse.twitter_clone.repository;

import eci.tdse.twitter_clone.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByAuth0Id(String auth0Id);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}