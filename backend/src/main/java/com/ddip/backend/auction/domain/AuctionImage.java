package com.ddip.backend.auction.domain;

import com.ddip.backend.common.domain.BaseTimeEntity;
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
@Table(name = "auction_image")
public class AuctionImage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    public static AuctionImage from(Auction auction, String s3Keys) {
        return AuctionImage.builder()
                .auction(auction)
                .s3Key(s3Keys)
                .build();
    }
}
