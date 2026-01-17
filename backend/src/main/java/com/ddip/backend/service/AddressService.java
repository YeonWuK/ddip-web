package com.ddip.backend.service;

import com.ddip.backend.dto.address.AddressCreateRequestDto;
import com.ddip.backend.dto.address.AddressResponseDto;
import com.ddip.backend.dto.address.AddressUpdateRequestDto;
import com.ddip.backend.entity.User;
import com.ddip.backend.entity.UserAddress;
import com.ddip.backend.exception.address.AddressNotFoundException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.UserAddressRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AddressService {

    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    private UserAddress getUserAddress(Long addressId) {
        return userAddressRepository.findById(addressId).orElseThrow(() -> new AddressNotFoundException(addressId));
    }

    public Long create(Long userId, AddressCreateRequestDto request) {

        User user = getUser(userId);

        boolean setAsDefault = request.isSetAsDefault();

        UserAddress oldDefault = userAddressRepository.findByUserAndIsDefault(user, true)
                .orElse(null);

        UserAddress newAddress = request.toEntity(user, false);

        if (setAsDefault) {
            // 이전 기본 배송지 해제
            if (oldDefault != null) {
                oldDefault.unmarkDefault();
            }
            // 신규 기본 배송지 설정
            newAddress.markDefault();
        }

        userAddressRepository.save(newAddress);

        log.info("새 배송지 저장 완료. userId={}, addressId={}, isDefault={}",
                userId, newAddress.getId(), newAddress.isDefault());

        return newAddress.getId();
    }

    @Transactional(readOnly = true)
    public AddressResponseDto findDefaultAddress(Long userId) {

        User user = getUser(userId);

        return userAddressRepository.findByUserAndIsDefault(user, true)
                .map(AddressResponseDto::from)
                .orElse(null);   // 컨트롤러에서 204 처리
    }

    @Transactional(readOnly = true)
    public List<AddressResponseDto> findAll(Long userId) {

        User user = getUser(userId);

        return userAddressRepository.findAllByUser(user).stream()
                .map(AddressResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressResponseDto findOne(Long userId, Long addressId) {

        UserAddress address = getUserAddress(addressId);

        address.assertOwnedBy(userId);

        return AddressResponseDto.from(address);

    }

    public void delete(Long userId, Long addressId) {

        UserAddress address = getUserAddress(addressId);

        address.assertOwnedBy(userId);

        userAddressRepository.delete(address);
        log.info("배송지 삭제 완료. userId={}, addressId={}", userId, addressId);
    }

    public void update(Long userId, Long addressId, AddressUpdateRequestDto request) {

        UserAddress address = getUserAddress(addressId);

        address.assertOwnedBy(userId);

        address.update(request.getLabel(), request.getRecipientName(), request.getPhone(),
                request.getZipCode(), request.getAddress1(), request.getAddress2());

        log.info("배송지 수정 완료. userId={}, addressId={}", userId, addressId);
    }

    public void setDefault(Long userId, Long addressId) {
        UserAddress address = getUserAddress(addressId);
        address.assertOwnedBy(userId);

        if (address.isDefault()) {
            log.info("기본 배송지 설정 요청(이미 기본). userId={}, addressId={}", userId, addressId);
            return;
        }

        User user = address.getUser();
        UserAddress oldDefault = userAddressRepository.findByUserAndIsDefault(user, true).orElse(null);

        Long oldDefaultId = oldDefault != null ? oldDefault.getId() : null;
        if (oldDefault != null) oldDefault.unmarkDefault();

        address.markDefault();

        log.info("기본 배송지 변경 완료. userId={}, oldDefaultId={}, newDefaultId={}",
                userId, oldDefaultId, addressId);
    }

}
