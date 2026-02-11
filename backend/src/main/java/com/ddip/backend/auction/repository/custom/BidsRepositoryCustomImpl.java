package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.domain.Bids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.ddip.backend.auction.domain.QBids.bids;
import static com.ddip.backend.user.domain.QUser.user;


@RequiredArgsConstructor
public class BidsRepositoryCustomImpl implements BidsRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<Bids> findBidsByUserId(Long userId) {
        return jpaQueryFactory
                .selectFrom(bids)
                .leftJoin(bids.user, user).fetchJoin()
                .where(bids.user.id.eq(userId))
                .orderBy(bids.createTime.desc())
                .fetch();
    }
}
