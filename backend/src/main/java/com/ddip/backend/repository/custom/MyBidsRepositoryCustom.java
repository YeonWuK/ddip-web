package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.MyBids;

import java.util.List;

public interface MyBidsRepositoryCustom {

    List<MyBids> findMyBidsByUserId(Long userId);
}
