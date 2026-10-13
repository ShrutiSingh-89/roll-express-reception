package com.familyrestaurant.reception.api;

import com.familyrestaurant.reception.model.Bill.ServiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class BillRequest {
    @Size(max = 100)
    public String customerName;

    // Accepted from older clients, but ignored: Roll Express is takeaway only.
    public String tableNumber;

    // Accepted from older clients, but ignored: all new bills are takeaway.
    public ServiceType serviceType;

    @NotEmpty
    @Size(max = 100)
    public List<@Valid Line> items;

    @DecimalMin("0.00")
    @DecimalMax("100.00")
    @Digits(integer = 3, fraction = 2)
    public BigDecimal discountPercent = BigDecimal.ZERO;

    // Accepted from older clients, but ignored: tax is disabled for new bills.
    public BigDecimal taxPercent;

    public static class Line {
        @NotNull
        public Long menuItemId;

        @NotNull
        @Min(1)
        @Max(100)
        public Integer quantity;
    }
}
