package com.chargelink.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 80)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 80)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        message = "Password must contain uppercase, lowercase, and a digit"
    )
    private String password;

    @Pattern(regexp = "^(\\+?[1-9]\\d{6,14})?$", message = "Invalid phone number format")
    private String phone;
}
