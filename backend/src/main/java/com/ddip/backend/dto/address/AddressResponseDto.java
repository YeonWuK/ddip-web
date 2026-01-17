package com.ddip.backend.dto.address;

import com.ddip.backend.entity.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponseDto {

    private Long id;
    private String label;
    private String recipientName;
    private String phoneNumber;
    private String zipCode;
    private String address1;
    private String address2;
    private boolean isDefault;

    public static AddressResponseDto from(UserAddress userAddress) {
        return AddressResponseDto.builder()
                .id(userAddress.getId())
                .label(userAddress.getLabel())
                .recipientName(userAddress.getRecipientName())
                .phoneNumber(userAddress.getPhone())
                .zipCode(userAddress.getZipCode())
                .address1(userAddress.getAddress1())
                .address2(userAddress.getAddress2())
                .isDefault(userAddress.isDefault())
                .build();
    }

}