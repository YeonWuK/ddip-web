package com.ddip.backend.entity;

import com.ddip.backend.dto.bids.CreateMyBidsDto;
import com.ddip.backend.dto.enums.MyAuctionStatus;
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
@Table(name = "my_auction")
public class MyBids extends BaseTimeEntity{

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

    @Enumerated(EnumType.STRING)
    @Column(name = "my_auction_state", nullable = false)
    private MyAuctionStatus myAuctionState;

    @Column(name = "last_bid_price", nullable = false)
    private Long lastBidPrice;

    public static MyBids from(CreateMyBidsDto dto) {
        return MyBids.builder()
                .user(dto.getUser())
                .auction(dto.getAuction())
                .myAuctionState(MyAuctionStatus.OUTBID)
                .lastBidPrice(dto.getPrice())
                .build();
    }

    public void updateLastBidPrice(Long lastBidPrice) {
        this.lastBidPrice = lastBidPrice;
    }

    public void markLeadBid() {
        this.myAuctionState = MyAuctionStatus.LEADING;
    }

    public void markOutBid() {
        this.myAuctionState = MyAuctionStatus.OUTBID;
    }

    public void markCanceledBid() {
        this.myAuctionState = MyAuctionStatus.CANCELED;
    }
}