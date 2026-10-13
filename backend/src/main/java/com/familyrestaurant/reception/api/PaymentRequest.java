package com.familyrestaurant.reception.api;

import com.familyrestaurant.reception.model.Bill.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public class PaymentRequest {
    @NotNull
    public PaymentMethod paymentMethod;
}
