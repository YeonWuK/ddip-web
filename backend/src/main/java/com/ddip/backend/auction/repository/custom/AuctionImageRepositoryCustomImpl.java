package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.domain.AuctionImage;
import com.ddip.backend.project.domain.ProjectImage;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import static com.ddip.backend.auction.domain.QAuction.auction;
import static com.ddip.backend.auction.domain.QAuctionImage.auctionImage;
import static com.ddip.backend.project.domain.QProject.project;
import static com.ddip.backend.project.domain.QProjectImage.projectImage;


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

    @Override
    public List<AuctionImage> findImageIdsByAuctionIdAndIds(Long auctionId, List<Long> imageIds) {
        return jpaQueryFactory
                .selectFrom(auctionImage)
                .leftJoin(auctionImage.auction, auction).fetchJoin()
                .where(
                        auctionImage.auction.id.eq(auctionId),
                        projectImage.id.in(imageIds)
                )
                .fetch();
    }

    @Override
    public Optional<AuctionImage> findMainByAuctionId(Long auctionId) {
        return Optional.ofNullable(
                jpaQueryFactory
                        .selectFrom(auctionImage)
                        .where(
                                auctionImage.auction.id.eq(auctionId),
                                auctionImage.isMain.isTrue()
                        )
                        .fetchFirst());
    }

    @Override
    public void clearMainByAuctionId(Long auctionId) {
        jpaQueryFactory
                .update(auctionImage)
                .set(auctionImage.isMain, false)
                .where(auctionImage.auction.id.eq(auctionId))
                .execute();
    }

    @Override
    public void setMainById(Long imageId) {
        jpaQueryFactory
                .update(auctionImage)
                .set(auctionImage.isMain, true)
                .where(auctionImage.id.eq(imageId))
                .execute();
    }
}