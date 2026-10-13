package com.familyrestaurant.reception.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class MenuItemRequest {
    @NotBlank
    @Size(max = 100)
    public String name;

    @NotBlank
    @Size(max = 60)
    public String category;

    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("999999.99")
    @Digits(integer = 6, fraction = 2)
    public BigDecimal price;

    public Boolean available = true;
}
