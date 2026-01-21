package com.ddip.backend.entity;

import com.ddip.backend.dto.auction.AuctionRequestDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.dto.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "auction")
public class Auction extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_user_id")
    private User winner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_winner_user_id")
    private User currentWinner;

    @Column(name = "title", nullable = false)
    private String title;

    @Lob
    private String description;

    @Column(name = "start_price", nullable = false)
    private Long startPrice;

    @Column(name = "current_price")
    private Long currentPrice;

    @Column(name = "bid_step", nullable = false)
    private int bidStep;

    @Enumerated(EnumType.STRING)
    @Column(name = "auction_status", nullable = false)
    private AuctionStatus auctionStatus;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Builder.Default
    @OneToMany(mappedBy = "auction", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<Bids> bids = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "auction", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<MyBids> myBids = new ArrayList<>();

    public static Auction from(User user, AuctionRequestDto dto) {
        return Auction.builder()
                .seller(user)
                .winner(null)
                .currentWinner(null)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .startPrice(dto.getStartPrice())
                .currentPrice(dto.getStartPrice())
                .bidStep(dto.getBidStep())
                .auctionStatus(AuctionStatus.RUNNING)
                .startAt(LocalDateTime.now())
                .endAt(LocalDateTime.parse(dto.getEndAt()))
                .build();
    }

    public void updateCurrentPrice(Long price) {
        this.currentPrice = price;
    }

    public void updateCurrentWinner(User user) {
        this.currentWinner = user;
    }

    public void updateWinner(User winner) {
        this.winner = winner;
    }

    public void updateAuctionStatus(AuctionStatus status) {
        this.auctionStatus = status;
    }

}