package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Bids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import static com.ddip.backend.entity.QAuction.auction;
import static com.ddip.backend.entity.QBids.bids;
import static com.ddip.backend.entity.QUser.user;

@RequiredArgsConstructor
public class BidsRepositoryCustomImpl implements BidsRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<Bids> findBidsByUserId(Long userId) {
        return jpaQueryFactory
                .selectFrom(bids)
                .leftJoin(bids.auction, auction).fetchJoin()
                .leftJoin(bids.user, user).fetchJoin()
                .where(bids.user.id.eq(userId))
                .orderBy(bids.createTime.desc())
                .fetch();
    }

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

    @Override
    public void deleteAllByAuctionIdAndUserId(Long auctionId, Long userId) {
        jpaQueryFactory.delete(bids)
                .where(bids.auction.id.eq(auctionId),
                        bids.user.id.eq(userId))
                .execute();
    }
}
