/**
 * 검색(Search) 도메인 서비스
 * 프로젝트, 경매 통합 검색, 자동완성 등 검색 엔진 관련 기능
 */

import {
  SearchAutoCompleteResponse,
  ProjectSearchResponse,
  AuctionSearchResponse,
  PageResponse,
} from '@/src/types/api';
import { apiRequest } from '@/src/services/apiClient';

/**
 * 검색 API
 */
export const searchApi = {
  /**
   * 자동완성 (검색어 제안)
   * GET /api/search/suggest?keyword={keyword}
   */
  getSuggestions: async (keyword: string): Promise<SearchAutoCompleteResponse[]> => {
    if (!keyword.trim()) return [];
    const params = new URLSearchParams();
    params.set('keyword', keyword);
    return apiRequest<SearchAutoCompleteResponse[]>(`/api/search/suggest?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 프로젝트 검색 (기본)
   * GET /api/search/project?title={title}
   */
  searchProjects: async (title: string): Promise<ProjectSearchResponse[]> => {
    const params = new URLSearchParams();
    params.set('title', title);
    return apiRequest<ProjectSearchResponse[]>(`/api/search/project?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 프로젝트 필터 검색 (페이징 지원)
   * GET /api/search/project/filter?title={title}&endAt={endAt}&page={page}&size={size}
   */
  searchProjectsWithFilter: async (params: {
    title?: string;
    endAt?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ProjectSearchResponse>> => {
    const query = new URLSearchParams();
    if (params.title) query.set('title', params.title);
    if (params.endAt) query.set('endAt', params.endAt);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    
    return apiRequest<PageResponse<ProjectSearchResponse>>(
      `/api/search/project/filter?${query.toString()}`,
      { method: 'GET' }
    );
  },

  /**
   * 경매 검색 (기본)
   * GET /api/search/auction?title={title}
   */
  searchAuctions: async (title: string): Promise<AuctionSearchResponse[]> => {
    const params = new URLSearchParams();
    params.set('title', title);
    return apiRequest<AuctionSearchResponse[]>(`/api/search/auction?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 경매 필터 검색 (페이징 지원)
   * GET /api/search/auction/filter?title={title}&endAt={endAt}&page={page}&size={size}
   */
  searchAuctionsWithFilter: async (params: {
    title?: string;
    endAt?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AuctionSearchResponse>> => {
    const query = new URLSearchParams();
    if (params.title) query.set('title', params.title);
    if (params.endAt) query.set('endAt', params.endAt);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    
    return apiRequest<PageResponse<AuctionSearchResponse>>(
      `/api/search/auction/filter?${query.toString()}`,
      { method: 'GET' }
    );
  },
};
