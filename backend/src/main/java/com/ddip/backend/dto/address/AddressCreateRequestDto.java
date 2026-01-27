package com.ddip.backend.dto.address;

import com.ddip.backend.entity.User;
import com.ddip.backend.entity.UserAddress;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddressCreateRequestDto {

    @Size(max = 30)
    private String label;

    @NotBlank
    @Size(max = 100)
    private String recipientName;

    @NotBlank
    @Size(max = 20)
    private String phone;

    @NotBlank
    @Size(max = 10)
    private String zipCode;

    @NotBlank
    @Size(max = 255)
    private String address1;

    @NotBlank
    @Size(max = 255)
    private String address2;

    // 생성과 동시에 기본 배송지로 설정할지
    private boolean setAsDefault;

    public UserAddress toEntity(User user, boolean isDefault) {
        return UserAddress.builder()
                .user(user)
                .label(label)
                .recipientName(recipientName)
                .phone(phone)
                .zipCode(zipCode)
                .address1(address1)
                .address2(address2)
                .isDefault(isDefault)
                .build();
    }

}