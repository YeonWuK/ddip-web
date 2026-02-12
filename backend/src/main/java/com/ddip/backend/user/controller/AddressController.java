package com.ddip.backend.user.controller;

import com.ddip.backend.user.dto.address.AddressCreateRequestDto;
import com.ddip.backend.user.dto.address.AddressResponseDto;
import com.ddip.backend.user.dto.address.AddressUpdateRequestDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.user.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/addresses")
@Tag(name = "Address", description = "배송지 API")
public class AddressController {

    private final AddressService addressService;

    /**
     * 기본 배송지 단건 조회
     * - 기본 배송지 있으면 200 + AddressResponse
     * - 없으면 204 No Content
     *
     * 화면: 200이면 "최근 배송지" 렌더, 204면 "새로입력" 폼 노출
     */
    @GetMapping("/default")
    @Operation(summary = "기본 배송지 조회", description = "내 기본 배송지를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "204", description = "기본 배송지 없음"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<AddressResponseDto> getDefaultAddress(@AuthenticationPrincipal CustomUserDetails user) {
        Long userId = user.getUserId();

        AddressResponseDto response = addressService.findDefaultAddress(userId);

        // 없으면 204
        if (response == null) {
            return ResponseEntity.noContent().build();
        }

        // 있으면 200 + body
        return ResponseEntity.ok(response);

    }

    /**
     * 내 배송지 목록 조회
     * - 마이페이지 배송지 관리 화면에서 사용
     */
    @GetMapping
    @Operation(summary = "내 배송지 목록 조회", description = "내 배송지 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<List<AddressResponseDto>> getMyAddresses(@AuthenticationPrincipal CustomUserDetails user) {
        Long userId = user.getUserId();

        List<AddressResponseDto> list = addressService.findAll(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * 배송지 생성
     * - 사용자가 "새로 입력"한 배송지를 저장할 때
     * - setAsDefault=true 면 생성과 동시에 기본 배송지로 설정
     *
     * REST: 201 Created + Location 헤더
     */
    @PostMapping
    @Operation(summary = "배송지 생성", description = "새 배송지를 생성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<Long> createAddress(@AuthenticationPrincipal CustomUserDetails user,
                                              @Valid @RequestBody AddressCreateRequestDto request) {
        Long userId = user.getUserId();

        Long newId = addressService.create(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(newId);
    }

    /**
     * 배송지 삭제
     */
    @DeleteMapping("/{addressId}")
    @Operation(summary = "배송지 삭제", description = "내 배송지를 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "배송지를 찾을 수 없음")
    })
    public ResponseEntity<Void> deleteAddress(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long addressId) {
        Long userId = user.getUserId();

        addressService.delete(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 배송지 상세 조회(선택)
     * - 주소 선택/수정 화면에서 사용 가능
     */
    @GetMapping("/{addressId}")
    @Operation(summary = "배송지 상세 조회", description = "내 특정 배송지를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "조회 권한 없음"),
            @ApiResponse(responseCode = "404", description = "배송지를 찾을 수 없음")
    })
    public ResponseEntity<AddressResponseDto> getAddress(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long addressId) {
        Long userId = user.getUserId();

         AddressResponseDto response = addressService.findOne(userId, addressId);
         return ResponseEntity.ok(response);
    }

    /**
     * 배송지 수정
     * - 주소 편집 화면
     */
    @PatchMapping("/{addressId}")
    @Operation(summary = "배송지 수정", description = "내 배송지를 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "배송지를 찾을 수 없음")
    })
    public ResponseEntity<Void> updateAddress(@AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long addressId, @Valid @RequestBody AddressUpdateRequestDto request) {
        Long userId = user.getUserId();

         addressService.update(userId, addressId, request);
         return ResponseEntity.noContent().build();
    }

    /**
     * 기본 배송지 설정
     * - 기존 기본 배송지는 해제되고, 지정한 addressId가 기본이 됨
     */
    @PutMapping("/{addressId}/default")
    @Operation(summary = "기본 배송지 설정", description = "지정한 배송지를 기본 배송지로 설정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "설정 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "설정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "배송지를 찾을 수 없음")
    })
    public ResponseEntity<Void> setDefaultAddress(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long addressId) {
        Long userId = user.getUserId();

         addressService.setDefault(userId, addressId);
         return ResponseEntity.noContent().build();
    }

}
