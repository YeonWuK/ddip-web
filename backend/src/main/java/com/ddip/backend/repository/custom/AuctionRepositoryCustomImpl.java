package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.admin.auction.AdminAuctionSearchCondition;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.QAuction;
import com.ddip.backend.entity.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.ddip.backend.entity.QAuction.auction;
import static com.ddip.backend.entity.QMyBids.myBids;
import static com.ddip.backend.entity.QUser.user;


@RequiredArgsConstructor
public class AuctionRepositoryCustomImpl implements AuctionRepositoryCustom {

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
    public List<Auction> findAllByOrderByIdDesc() {
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
                .where(
                        auction.auctionStatus.eq(AuctionStatus.RUNNING),
                        auction.endAt.loe(now)
                )
                .orderBy(auction.endAt.asc(), auction.id.asc())
                .limit(limit)
                .fetch();
    }

    @Override
    public List<Auction> findAuctionsByUserId(Long userId) {
        return jpaQueryFactory
                .selectFrom(auction)
                .leftJoin(auction.seller, user).fetchJoin()
                .where(auction.seller.id.eq(userId))
                .orderBy(auction.id.desc())
                .fetch();
    }

    @Override
    public Page<Auction> searchAuctionsForAdmin(AdminAuctionSearchCondition condition, Pageable pageable) {
        QAuction a = auction;
        QUser s = user; // seller

        // content 조회
        List<Auction> content = jpaQueryFactory
                .selectFrom(a)
                .leftJoin(a.seller, s).fetchJoin()
                .where(
                        titleContains(condition.getTitle()),
                        sellerUsernameContains(condition.getSellerUsername()),
                        statusEq(condition.getStatus()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(a.id.desc())
                .fetch();

        // total count 조회
        Long total = jpaQueryFactory
                .select(a.count())
                .from(a)
                .leftJoin(a.seller, s)
                .where(
                        titleContains(condition.getTitle()),
                        sellerUsernameContains(condition.getSellerUsername()),
                        statusEq(condition.getStatus()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .fetchOne();

        long totalCount = (total == null) ? 0L : total;

        return new PageImpl<>(content, pageable, totalCount);
    }

    // ====== 조건 헬퍼들 ======

    private BooleanExpression titleContains(String title) {
        if (!StringUtils.hasText(title)) return null;
        return auction.title.containsIgnoreCase(title);
    }

    private BooleanExpression sellerUsernameContains(String username) {
        if (!StringUtils.hasText(username)) return null;
        return auction.seller.username.containsIgnoreCase(username);
    }

    private BooleanExpression statusEq(String statusStr) {
        if (!StringUtils.hasText(statusStr)) return null;

        AuctionStatus status;
        try {
            status = AuctionStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // 잘못된 값 들어오면 조건에서 그냥 제외
            return null;
        }

        return auction.auctionStatus.eq(status);
    }

    private BooleanExpression startAtFrom(LocalDateTime from) {
        if (from == null) return null;
        return auction.startAt.goe(from);
    }

    private BooleanExpression startAtTo(LocalDateTime to) {
        if (to == null) return null;
        return auction.startAt.loe(to);
    }


}