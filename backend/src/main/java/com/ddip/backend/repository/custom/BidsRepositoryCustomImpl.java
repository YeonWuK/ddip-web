package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Bids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import static com.ddip.backend.entity.QBids.bids;

@RequiredArgsConstructor
public class BidsRepositoryCustomImpl implements BidsRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public Optional<Bids>  findTopBidByAuctionId(Long auctionId) {
        return Optional.ofNullable(
                jpaQueryFactory
                        .selectFrom(bids)
                        .where(bids.auction.id.eq(auctionId))
                        .orderBy(
                                bids.price.desc(),
                                bids.id.asc()
                        )
                        .fetchFirst()
        );
    }
}
