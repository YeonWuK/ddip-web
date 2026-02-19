package com.ddip.backend.auction.service;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.domain.AuctionImage;
import com.ddip.backend.auction.repository.AuctionImageRepository;
import com.ddip.backend.common.utils.AwsS3Util;
import com.ddip.backend.common.utils.S3UrlPrefixFactory;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.project.exception.image.InvalidProjectImageException;
import com.ddip.backend.project.repository.ProjectImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;

@Service
@Transactional
@RequiredArgsConstructor
public class AuctionImageService {

    private final AwsS3Util awsS3Util;
    private final S3UrlPrefixFactory s3UrlPrefixFactory;
    private final AuctionImageRepository auctionImageRepository;

    public List<AuctionImage> findImagesByAuctionId(Long auctionId) {
        return auctionImageRepository.findImagesByAuctionId(auctionId);
    }

    public void uploadAuctionImagesAndSaveEntities(Auction auction, List<MultipartFile> files, int mainIndex) {
        if (files == null || files.isEmpty()) return;

        if (mainIndex < 0 || mainIndex >= files.size()) {
            throw new IllegalArgumentException("mainIndex 가 유효하지 않습니다.");
        }

        String prefix = s3UrlPrefixFactory.auctionPrefix(auction.getId());

        List<AuctionImage> projectImages = IntStream.range(0, files.size())
                .mapToObj(i -> {
                    MultipartFile file = files.get(i);
                    if (file == null || file.isEmpty()) {
                        throw new InvalidProjectImageException("사진은 하나 이상 등록되야합니다.");
                    }

                    String key = awsS3Util.uploadFile(file, prefix);
                    boolean isMain = (i == mainIndex);
                    return AuctionImage.from(auction, key, isMain);
                })
                .filter(Objects::nonNull)
                .toList();

        auctionImageRepository.saveAll(projectImages);
    }

    public void syncAuctionThumbnailFromMainOrThrow(Auction auction) {
        String key = auctionImageRepository.findMainByAuctionId(auction.getId())
                .map(AuctionImage::getS3Key)
                .orElseThrow(() -> new InvalidProjectImageException("대표 이미지(isMain)를 찾을 수 없습니다."));
        auction.updateMainImageKey(key);
    }

    public void deleteProjectImages(List<AuctionImage> deleteTargets) {
        if (deleteTargets == null || deleteTargets.isEmpty()) {
            return;
        }
        auctionImageRepository.deleteAll(deleteTargets);
        for (AuctionImage image : deleteTargets) {
            awsS3Util.deleteByKey(image.getS3Key());
        }
    }

}
