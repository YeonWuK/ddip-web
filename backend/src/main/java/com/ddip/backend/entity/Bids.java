package com.ddip.backend.entity;

import com.ddip.backend.dto.bids.CreateBidsDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "bids")
public class Bids extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(name = "price", nullable = false)
    private Long price;

    public static Bids from(CreateBidsDto dto) {
        return Bids.builder()
                .user(dto.getUser())
                .auction(dto.getAuction())
                .price(dto.getPrice())
                .build();
    }
}