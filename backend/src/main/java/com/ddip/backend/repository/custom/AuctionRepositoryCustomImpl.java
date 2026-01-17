package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.QUser;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.ddip.backend.entity.QAuction.auction;
import static com.ddip.backend.entity.QMyBids.myBids;


@RequiredArgsConstructor
public class AuctionRepositoryCustomImpl implements AuctionCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public Optional<Auction> findDetailById(Long auctionId) {
        return Optional.ofNullable(jpaQueryFactory.selectFrom(auction)
                .leftJoin(auction.seller, new QUser("seller")).fetchJoin()
                .leftJoin(auction.winner, new QUser("winner")).fetchJoin()
                .leftJoin(myBids.user, new QUser("bidder")).fetchJoin()
                .where(auction.id.eq(auctionId))
                .fetchOne());
    }

    @Override
    public List<Auction> findAllDesc() {
        return jpaQueryFactory.selectFrom(auction)
                .leftJoin(auction.seller, new QUser("seller")).fetchJoin()
                .leftJoin(auction.winner, new QUser("winner")).fetchJoin()
                .orderBy(auction.id.desc())
                .fetch();
    }

    @Override
    public List<Auction> findEndAuctions(LocalDateTime now, int limit) {
        return jpaQueryFactory
                .selectFrom(auction)
                .leftJoin(auction.myBids, myBids).fetchJoin()
                .leftJoin(myBids.user, new QUser("bidder")).fetchJoin()
                .where(
                        auction.auctionStatus.eq(AuctionStatus.RUNNING),
                        auction.endAt.loe(now)
                )
                .orderBy(auction.endAt.asc(), auction.id.asc())
                .limit(limit)
                .fetch();
    }
}