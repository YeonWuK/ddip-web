package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.dto.enums.MyAuctionStatus;
import com.ddip.backend.auction.domain.MyBids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import static com.ddip.backend.auction.domain.QMyBids.myBids;
import static com.ddip.backend.user.domain.QUser.user;


@RequiredArgsConstructor
public class MyBidsRepositoryCustomImpl implements MyBidsRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<MyBids> findMyBidsByUserId(Long userId) {
        return jpaQueryFactory
                .selectFrom(myBids)
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
                                myBids.auctionId.eq(auctionId),
                                myBids.myAuctionState.eq(MyAuctionStatus.LEADING)
                        )
                        .fetchOne()
        );
    }

    @Override
    public void markWon(Long auctionId, Long winnerUserId) {
        jpaQueryFactory
                .update(myBids)
                .set(myBids.myAuctionState, MyAuctionStatus.WON)
                .where(
                        myBids.auctionId.eq(auctionId),
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
                        myBids.auctionId.eq(auctionId),
                        myBids.user.id.ne(winnerUserId)
                )
                .execute();
    }
}