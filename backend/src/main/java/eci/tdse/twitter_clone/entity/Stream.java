package eci.tdse.twitter_clone.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "streams")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stream {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Solo existe 1 stream global: "public"
    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "stream", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();
}
