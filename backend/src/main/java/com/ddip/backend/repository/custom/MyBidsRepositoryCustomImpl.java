package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.enums.MyAuctionStatus;
import com.ddip.backend.entity.MyBids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import static com.ddip.backend.entity.QAuction.auction;
import static com.ddip.backend.entity.QMyBids.myBids;
import static com.ddip.backend.entity.QUser.user;

@RequiredArgsConstructor
public class MyBidsRepositoryCustomImpl implements MyBidsRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<MyBids> findMyBidsByUserId(Long userId) {
        return jpaQueryFactory
                .selectFrom(myBids)
                .leftJoin(myBids.auction, auction).fetchJoin()
                .leftJoin(myBids.user, user).fetchJoin()
                .where(myBids.user.id.eq(userId))
                .orderBy(myBids.modifiedDate.desc())
                .fetch();
    }

    @Override
    public Optional<MyBids> findLeadingByAuctionId(Long auctionId) {
        return Optional.ofNullable(
                jpaQueryFactory
                        .selectFrom(myBids)
                        .leftJoin(myBids.user, user).fetchJoin()
                        .where(
                                myBids.auction.id.eq(auctionId),
                                myBids.myAuctionState.eq(MyAuctionStatus.LEADING)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<MyBids> findTopByAuctionId(Long auctionId) {
        return Optional.ofNullable(
                jpaQueryFactory
                        .selectFrom(myBids)
                        .leftJoin(myBids.user, user).fetchJoin()
                        .where(myBids.auction.id.eq(auctionId))
                        .orderBy(
                                myBids.lastBidPrice.desc(),
                                myBids.modifiedDate.asc(),
                                myBids.id.asc()
                        )
                        .fetchFirst()
        );
    }

    @Override
    public void markWon(Long auctionId, Long winnerUserId) {
        jpaQueryFactory
                .update(myBids)
                .set(myBids.myAuctionState, MyAuctionStatus.WON)
                .where(
                        myBids.auction.id.eq(auctionId),
                        myBids.user.id.eq(winnerUserId)
                )
                .execute();
    }

    @Override
    public void markLostExceptWinner(Long auctionId, Long winnerUserId) {
        jpaQueryFactory
                .update(myBids)
                .set(myBids.myAuctionState, MyAuctionStatus.LOST)
                .where(
                        myBids.auction.id.eq(auctionId),
                        myBids.user.id.ne(winnerUserId)
                )
                .execute();
    }
}