package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.AuctionImage;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.ddip.backend.entity.QAuction.auction;
import static com.ddip.backend.entity.QAuctionImage.auctionImage;

@RequiredArgsConstructor
public class AuctionImageRepositoryCustomImpl implements AuctionImageRepositoryCustom{

    private final JPAQueryFactory jpaQueryFactory;


    @Override
    public List<AuctionImage> findImagesByAuctionId(Long auctionId) {
        return jpaQueryFactory
                .selectFrom(auctionImage)
                .leftJoin(auctionImage.auction, auction)
                .where(auctionImage.auction.id.eq(auctionId))
                .fetch();
    }
}
