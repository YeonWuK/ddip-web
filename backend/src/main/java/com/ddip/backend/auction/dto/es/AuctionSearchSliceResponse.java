package com.ddip.backend.auction.dto.es;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionSearchSliceResponse {

    private List<AuctionSearchResponse> content;

    /** 다음 페이지 존재 여부 */
    private boolean hasNext;

    /**
     * 다음 요청에 전달할 커서값 (마지막 hit의 _score)
     * hasNext=false 이면 null
     */
    private Double nextSearchAfterScore;

    /**
     * 다음 요청에 전달할 커서값 (마지막 hit의 id)
     * hasNext=false 이면 null
     */
    private Long nextSearchAfterId;
}
