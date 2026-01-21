package com.ddip.backend.es.document;

import com.ddip.backend.entity.Auction;
import org.springframework.data.annotation.Id;
import lombok.*;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "auction", createIndex = true)
@Setting(settingPath = "elasticsearch/ticket-setting.json")
@Mapping(mappingPath = "elasticsearch/ticket-mapping.json")
public class AuctionDocument {

    @Id
    @Field(type = FieldType.Long)
    private Long id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String seller;

    @Field(type = FieldType.Long)
    private Long startPrice;

    @Field(type = FieldType.Long)
    private Long currentPrice;

    @Field(type = FieldType.Text)
    private String status;

    @Field(type = FieldType.Date, format = {DateFormat.date_hour_minute_second_millis, DateFormat.epoch_millis})
    private LocalDateTime startAt;

    @Field(type = FieldType.Date, format = {DateFormat.date_hour_minute_second_millis, DateFormat.epoch_millis})
    private LocalDateTime endAt;

    public static AuctionDocument from(Auction auction) {
        return AuctionDocument.builder()
                .id(auction.getId())
                .title(auction.getTitle())
                .seller(auction.getSeller().getUsername())
                .startPrice(auction.getStartPrice())
                .currentPrice(auction.getCurrentPrice())
                .status(String.valueOf(auction.getAuctionStatus()))
                .startAt(auction.getStartAt())
                .endAt(auction.getEndAt())
                .build();
    }
}
