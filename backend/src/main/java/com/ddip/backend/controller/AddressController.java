package com.ddip.backend.controller;

import com.ddip.backend.dto.address.AddressCreateRequestDto;
import com.ddip.backend.dto.address.AddressResponseDto;
import com.ddip.backend.dto.address.AddressUpdateRequestDto;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.AddressService;
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
    public ResponseEntity<Void> setDefaultAddress(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long addressId) {
        Long userId = user.getUserId();

         addressService.setDefault(userId, addressId);
         return ResponseEntity.noContent().build();
    }

}