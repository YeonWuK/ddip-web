package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.MyBids;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

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
}