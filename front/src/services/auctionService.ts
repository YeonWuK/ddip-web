/**
 * 경매(Auction) & 입찰(Bidding) 도메인 서비스
 * 경매 생성, 조회, 수정, 삭제 및 입찰 관리
 */

import {
  AuctionResponse,
  AuctionSummary,
  AuctionCreateRequest,
  AuctionStatus,
  BidRequest,
  BidResponse,
  BidSummary,
  MyBidsSummary,
} from '@/src/types/api';
import { apiRequest } from '@/src/services/apiClient';
import { toS3ImageUrl } from '@/src/services/utils/imageUtils';

// API 함수들 - 경매 관련
export const auctionApi = {
  /**
   * 경매 목록 조회
   * GET /api/auction
   */
  getAuctions: async (params?: {
    status?: AuctionStatus;
    page?: number;
    limit?: number;
  }): Promise<AuctionSummary[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/api/auction${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const backendResponse = await apiRequest<AuctionSummary[]>(endpoint, {
        method: 'GET',
      });

      return backendResponse.map((auction: any) => {
        const mainUrl =
          toS3ImageUrl(auction.mainImageKey) ??
          auction.thumbnailImageUrl ??
          auction.thumbnail_url ??
          (auction.images?.[0] ? toS3ImageUrl(auction.images[0].s3Key ?? auction.images[0].imageKey ?? auction.images[0].imageUrl) ?? null : null);
        return {
          id: auction.auctionId ?? auction.id ?? 0,
          title: auction.title || '',
          thumbnailImageUrl: mainUrl,
          imageUrl: mainUrl,
          startPrice: auction.startPrice || auction.start_price || 0,
          currentPrice: auction.currentPrice || auction.current_price || 0,
          bidStep: auction.bidStep || auction.bid_step || 0,
          status: auction.auctionStatus ?? auction.status ?? 'SCHEDULED',
          startAt: auction.startAt ?? auction.start_at ?? '',
          endAt: auction.endAt ?? auction.end_at ?? '',
          bidCount: auction.bidCount ?? auction.bid_count ?? 0,
          categoryPath: auction.categoryPath ?? auction.category_path ?? null,
          summary: auction.summary ?? null,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 상세 조회
   * GET /api/auction/{id}
   */
  getAuction: async (id: number): Promise<AuctionResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/auction/${id}`, {
        method: 'GET',
      });

      // 백엔드 AuctionDetailResponseDto: images[] → S3 풀 URL로 변환 (키 또는 URL 지원)
      const images = backendResponse.images ?? [];
      const imageUrlsFromS3 = images
        .map((img: any) => {
          const keyOrUrl =
            typeof img === 'string'
              ? img
              : img?.s3Key ??
                img?.s3_key ??
                img?.imageKey ??
                img?.image_key ??
                img?.key ??
                img?.imageUrl ??
                img?.image_url ??
                img?.url ??
                img?.filePath ??
                img?.file_path ??
                (typeof img?.image === 'string' ? img.image : img?.image?.url ?? img?.image?.imageKey ?? img?.image?.s3Key);
          return toS3ImageUrl(keyOrUrl);
        })
        .filter((url: string | null): url is string => url != null);
      const firstImageUrl =
        imageUrlsFromS3[0] ??
        toS3ImageUrl(backendResponse.mainImageKey) ??
        backendResponse.thumbnailImageUrl ??
        backendResponse.imageUrl ??
        null;
      const imageUrls = imageUrlsFromS3.length > 0 ? imageUrlsFromS3 : firstImageUrl ? [firstImageUrl] : null;
      const imageUrl = firstImageUrl;
      const thumbnailUrl = firstImageUrl;

      return {
        id: backendResponse.auctionId ?? backendResponse.id ?? 0,
        seller: backendResponse.seller ? {
          id: backendResponse.seller.id || 0,
          email: backendResponse.seller.email || null,
          name: backendResponse.seller.name || backendResponse.seller.username || '',
          nickname: backendResponse.seller.nickname || '',
          profileImageUrl: backendResponse.seller.profileImageUrl || backendResponse.seller.profile_image_url || null,
          phone: backendResponse.seller.phone || backendResponse.seller.phoneNumber || null,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        title: backendResponse.title || '',
        description: backendResponse.description || '',
        thumbnailImageUrl: thumbnailUrl,
        imageUrl,
        imageUrls,
        startPrice: backendResponse.startPrice || backendResponse.start_price || 0,
        currentPrice: backendResponse.currentPrice || backendResponse.current_price || 0,
        bidStep: backendResponse.bidStep || backendResponse.bid_step || 0,
        buyoutPrice: backendResponse.buyoutPrice ?? backendResponse.buyout_price ?? null,
        status: backendResponse.auctionStatus ?? backendResponse.status ?? 'SCHEDULED',
        startAt: backendResponse.startAt || backendResponse.start_at || '',
        endAt: backendResponse.endAt || backendResponse.end_at || '',
        winner: backendResponse.winner ? {
          id: backendResponse.winner.id || 0,
          email: backendResponse.winner.email || null,
          name: backendResponse.winner.name || backendResponse.winner.username || '',
          nickname: backendResponse.winner.nickname || '',
          profileImageUrl: backendResponse.winner.profileImageUrl || backendResponse.winner.profile_image_url || null,
          phone: backendResponse.winner.phone || backendResponse.winner.phoneNumber || null,
        } : null,
        categoryPath: backendResponse.categoryPath || backendResponse.category_path || null,
        tags: backendResponse.tags || null,
        summary: backendResponse.summary || null,
        bids: backendResponse.bids ? backendResponse.bids.map((bid: any) => ({
          id: bid.id || 0,
          bidder: bid.bidder ? {
            id: bid.bidder.id || 0,
            email: bid.bidder.email || null,
            name: bid.bidder.name || bid.bidder.username || '',
            nickname: bid.bidder.nickname || '',
            profileImageUrl: bid.bidder.profileImageUrl || bid.bidder.profile_image_url || null,
            phone: bid.bidder.phone || bid.bidder.phoneNumber || null,
          } : {
            id: 0,
            email: null,
            name: '',
            nickname: '',
            profileImageUrl: null,
            phone: null,
          },
          bidderNickname: bid.bidderNickname || bid.bidder_nickname || bid.bidder?.nickname || '',
          bidPrice: bid.bidPrice || bid.bid_price || 0,
          bidAt: bid.bidAt || bid.bid_at || bid.createdAt || '',
        })) : [],
        createdAt: backendResponse.createdAt || backendResponse.created_at || '',
        updatedAt: backendResponse.updatedAt || backendResponse.updated_at || '',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 생성 (multipart/form-data: file 목록 + data JSON, 백엔드 S3 업로드)
   * POST /api/auction
   */
  createAuction: async (files: File[], data: AuctionCreateRequest): Promise<AuctionResponse> => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('file', file));
      const dataPart = {
        title: data.title,
        description: data.description,
        startPrice: data.startPrice,
        bidStep: data.bidStep,
        endAt: data.endAt || '',
      };
      formData.append('data', new Blob([JSON.stringify(dataPart)], { type: 'application/json' }));

      const backendResponse = await apiRequest<any>('/api/auction', {
        method: 'POST',
        body: formData,
      });

      // 백엔드 응답: images[].s3Key → S3 풀 URL로 변환
      const images = backendResponse.images ?? [];
      const imageUrlsFromS3 = images
        .map((img: any) => toS3ImageUrl(img.s3Key ?? img.imageKey ?? img.imageUrl ?? img.url ?? img.image_url))
        .filter((url: string | null): url is string => url != null);
      const firstImageUrl =
        imageUrlsFromS3[0] ??
        toS3ImageUrl(backendResponse.mainImageKey) ??
        backendResponse.thumbnailImageUrl ??
        backendResponse.imageUrl ??
        null;
      const imageUrls = imageUrlsFromS3.length > 0 ? imageUrlsFromS3 : firstImageUrl ? [firstImageUrl] : null;
      const imageUrl = firstImageUrl;
      const thumbnailUrl = firstImageUrl;

      return {
        id: backendResponse.auctionId ?? backendResponse.id ?? 0,
        seller: backendResponse.seller ? {
          id: backendResponse.seller.id ?? 0,
          email: backendResponse.seller.email ?? null,
          name: backendResponse.seller.name ?? backendResponse.seller.username ?? '',
          nickname: backendResponse.seller.nickname ?? '',
          profileImageUrl: backendResponse.seller.profileImageUrl ?? backendResponse.seller.profile_image_url ?? null,
          phone: backendResponse.seller.phone ?? backendResponse.seller.phoneNumber ?? null,
        } : { id: 0, email: null, name: '', nickname: '', profileImageUrl: null, phone: null },
        title: backendResponse.title ?? '',
        description: backendResponse.description ?? '',
        thumbnailImageUrl: thumbnailUrl,
        imageUrl,
        imageUrls,
        startPrice: backendResponse.startPrice ?? backendResponse.start_price ?? 0,
        currentPrice: backendResponse.currentPrice ?? backendResponse.current_price ?? 0,
        bidStep: backendResponse.bidStep ?? backendResponse.bid_step ?? 0,
        buyoutPrice: backendResponse.buyoutPrice ?? backendResponse.buyout_price ?? null,
        status: backendResponse.auctionStatus ?? backendResponse.status ?? 'SCHEDULED',
        startAt: backendResponse.startAt ?? backendResponse.start_at ?? '',
        endAt: backendResponse.endAt ?? backendResponse.end_at ?? '',
        winner: backendResponse.winner ? {
          id: backendResponse.winner.id ?? 0,
          email: backendResponse.winner.email ?? null,
          name: backendResponse.winner.name ?? backendResponse.winner.username ?? '',
          nickname: backendResponse.winner.nickname ?? '',
          profileImageUrl: backendResponse.winner.profileImageUrl ?? backendResponse.winner.profile_image_url ?? null,
          phone: backendResponse.winner.phone ?? backendResponse.winner.phoneNumber ?? null,
        } : null,
        categoryPath: backendResponse.categoryPath ?? backendResponse.category_path ?? null,
        tags: backendResponse.tags ?? null,
        summary: backendResponse.summary ?? null,
        bids: (backendResponse.bids ?? []).map((bid: any) => ({
          id: bid.id ?? 0,
          bidder: bid.bidder ? {
            id: bid.bidder.id ?? 0,
            email: bid.bidder.email ?? null,
            name: bid.bidder.name ?? bid.bidder.username ?? '',
            nickname: bid.bidder.nickname ?? '',
            profileImageUrl: bid.bidder.profileImageUrl ?? bid.bidder.profile_image_url ?? null,
            phone: bid.bidder.phone ?? bid.bidder.phoneNumber ?? null,
          } : { id: 0, email: null, name: '', nickname: '', profileImageUrl: null, phone: null },
          bidderNickname: bid.bidderNickname ?? bid.bidder_nickname ?? bid.bidder?.nickname ?? '',
          bidPrice: bid.bidPrice ?? bid.bid_price ?? 0,
          bidAt: bid.bidAt ?? bid.bid_at ?? bid.createdAt ?? '',
        })),
        createdAt: backendResponse.createdAt ?? backendResponse.created_at ?? '',
        updatedAt: backendResponse.updatedAt ?? backendResponse.updated_at ?? '',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 수정 (multipart/form-data: file 목록 + data JSON)
   * PATCH /api/auction/{id}
   */
  updateAuction: async (
    id: number,
    files: File[],
    data: Partial<AuctionCreateRequest>
  ): Promise<AuctionResponse> => {
    try {
      const formData = new FormData();
      
      // 파일이 있으면 추가
      if (files && files.length > 0) {
        files.forEach((file) => formData.append('file', file));
      }
      
      // 데이터 부분 구성
      const dataPart: any = {};
      if (data.title !== undefined) dataPart.title = data.title;
      if (data.description !== undefined) dataPart.description = data.description;
      if (data.startPrice !== undefined) dataPart.startPrice = data.startPrice;
      if (data.bidStep !== undefined) dataPart.bidStep = data.bidStep;
      if (data.endAt !== undefined) dataPart.endAt = data.endAt;
      if (data.categoryPath !== undefined) dataPart.categoryPath = data.categoryPath;
      if (data.tags !== undefined) dataPart.tags = data.tags;
      if (data.summary !== undefined) dataPart.summary = data.summary;
      
      formData.append('data', new Blob([JSON.stringify(dataPart)], { type: 'application/json' }));

      await apiRequest(`/api/auction/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      // 수정된 경매 정보 조회
      return await auctionApi.getAuction(id);
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 삭제
   * DELETE /api/auction/{id}
   */
  deleteAuction: async (id: number): Promise<void> => {
    try {
      await apiRequest(`/api/auction/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 입찰
   * POST /api/auctions/{auctionId}/bids
   */
  placeBid: async (
    auctionId: number,
    bidData: BidRequest
  ): Promise<BidResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/auction/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({
          price: bidData.price,
        }),
      });

      return {
        bidId: backendResponse.bidId || backendResponse.bid_id || 0,
        auction: backendResponse.auction ? await auctionApi.getAuction(backendResponse.auction.id || auctionId) : await auctionApi.getAuction(auctionId),
        bidPrice: backendResponse.bidPrice || backendResponse.bid_price || bidData.price,
        isHighestBidder: backendResponse.isHighestBidder || backendResponse.is_highest_bidder || false,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 특정 경매의 입찰 내역 조회
   * GET /api/auction/{auctionId}/bids
   */
  getBidsByAuction: async (auctionId: number): Promise<BidSummary[]> => {
    try {
      const backendResponse = await apiRequest<any[]>(`/api/auction/${auctionId}/bids`, {
        method: 'GET',
      });

      return backendResponse.map((bid: any) => ({
        id: bid.id || 0,
        bidder: bid.bidder ? {
          id: bid.bidder.id || 0,
          email: bid.bidder.email || null,
          name: bid.bidder.name || bid.bidder.username || '',
          nickname: bid.bidder.nickname || '',
          profileImageUrl: bid.bidder.profileImageUrl || bid.bidder.profile_image_url || null,
          phone: bid.bidder.phone || bid.bidder.phoneNumber || null,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        bidderNickname: bid.bidderNickname || bid.bidder_nickname || bid.bidder?.nickname || '',
        bidPrice: bid.bidPrice || bid.bid_price || 0,
          bidAt: bid.bidAt || bid.bid_at || bid.createdAt || '',
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * 사용자의 입찰 내역 조회 (마이페이지용)
   * GET /api/auction/my-bids
   */
  getMyBids: async (): Promise<MyBidsSummary[]> => {
    try {
      const backendResponse = await apiRequest<any[]>('/api/auction/my-bids', {
        method: 'GET',
      });

      return backendResponse.map((myBid: any) => ({
        auctionId: myBid.auctionId || myBid.auction_id || 0,
        auctionTitle: myBid.auctionTitle || myBid.auction_title || '',
        auctionThumbnailUrl: myBid.auctionThumbnailUrl || myBid.auction_thumbnail_url || null,
        auctionStatus: myBid.auctionStatus || myBid.auction_status || 'SCHEDULED',
        myAuctionStatus: myBid.myAuctionStatus || myBid.my_auction_status || 'OUTBID',
        lastBidPrice: myBid.lastBidPrice || myBid.last_bid_price || 0,
        currentPrice: myBid.currentPrice || myBid.current_price || 0,
        isHighestBidder: myBid.isHighestBidder !== undefined ? myBid.isHighestBidder : (myBid.is_highest_bidder !== undefined ? myBid.is_highest_bidder : false),
        lastBidAt: myBid.lastBidAt || myBid.last_bid_at || '',
        auctionEndAt: myBid.auctionEndAt || myBid.auction_end_at || '',
        isPaid: myBid.isPaid !== undefined ? myBid.isPaid : (myBid.is_paid !== undefined ? myBid.is_paid : false),
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 검색
   * GET /api/auction/search?query={query}&status={status}&limit={limit}
   */
  searchAuctions: async (query: string, params?: {
    status?: AuctionStatus;
    limit?: number;
  }): Promise<AuctionSummary[]> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/api/auction/search?${queryParams.toString()}`;
      const backendResponse = await apiRequest<AuctionSummary[]>(endpoint, {
        method: 'GET',
      });

      return backendResponse.map((auction: any) => {
        const mainUrl =
          toS3ImageUrl(auction.mainImageKey) ??
          auction.thumbnailImageUrl ??
          auction.thumbnail_url ??
          (auction.images?.[0] ? toS3ImageUrl(auction.images[0].s3Key ?? auction.images[0].imageKey ?? auction.images[0].imageUrl) ?? null : null);
        return {
          id: auction.auctionId ?? auction.id ?? 0,
          title: auction.title || '',
          thumbnailImageUrl: mainUrl,
          imageUrl: mainUrl,
          startPrice: auction.startPrice || auction.start_price || 0,
          currentPrice: auction.currentPrice || auction.current_price || 0,
          bidStep: auction.bidStep || auction.bid_step || 0,
          status: auction.auctionStatus ?? auction.status ?? 'SCHEDULED',
          startAt: auction.startAt ?? auction.start_at ?? '',
          endAt: auction.endAt ?? auction.end_at ?? '',
          bidCount: auction.bidCount ?? auction.bid_count ?? 0,
          categoryPath: auction.categoryPath ?? auction.category_path ?? null,
          summary: auction.summary ?? null,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * 경매 상태 갱신 (서버에서 최신 경매 정보 조회 후 반환)
   * GET /api/auction/{id}로 최신 상태를 가져와 UI와 동기화할 때 사용
   */
  checkAndUpdateAuctionStatus: async (auctionId: number): Promise<AuctionResponse | null> => {
    try {
      return await auctionApi.getAuction(auctionId);
    } catch {
      return null;
    }
  },

  /**
   * 전체 경매 상태 갱신 (백엔드에서 상태 관리 시 클라이언트는 목록 재조회로 반영)
   * 실제 갱신은 호출 후 getAuctions() 등으로 목록을 다시 불러올 때 이루어짐
   */
  checkAllAuctionsStatus: async (): Promise<void> => {
    // 백엔드에서 상태 자동 반영; 목록/상세 조회 시 최신 상태 반환
  },
};
