package com.ddip.backend.auction.domain;

import com.ddip.backend.auction.dto.bids.CreateBidsDto;
import com.ddip.backend.common.domain.BaseTimeEntity;
import com.ddip.backend.user.domain.User;
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
public class Bids extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "auction_id", nullable = false)
    private Long auctionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "price", nullable = false)
    private Long price;

    public static Bids from(CreateBidsDto dto) {
        return Bids.builder()
                .user(dto.getUser())
                .auctionId(dto.getAuctionId())
                .price(dto.getPrice())
                .build();
    }
}