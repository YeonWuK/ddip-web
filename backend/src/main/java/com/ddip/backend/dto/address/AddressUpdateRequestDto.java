package com.ddip.backend.dto.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddressUpdateRequestDto {

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

    // 수정하면서 기본 배송지로 설정할지
    private boolean setAsDefault;
}