package com.familyrestaurant.reception.api;

import com.familyrestaurant.reception.model.Bill;
import com.familyrestaurant.reception.model.BillItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class BillView {
    public Long id;
    public String currency = "INR";
    public String billNumber;
    public OffsetDateTime createdAt;
    public String customerName;
    public String tableNumber;
    public Bill.ServiceType serviceType;
    public Bill.Status status;
    public Bill.PaymentMethod paymentMethod;
    public OffsetDateTime paidAt;
    public List<Line> items;
    public BigDecimal subtotal;
    public BigDecimal discountPercent;
    public BigDecimal discountAmount;
    public BigDecimal taxPercent;
    public BigDecimal taxAmount;
    public BigDecimal total;

    public static BillView from(Bill bill) {
        BillView view = new BillView();
        view.id = bill.getId();
        view.billNumber = bill.getBillNumber();
        view.createdAt = bill.getCreatedAt();
        view.customerName = bill.getCustomerName();
        view.tableNumber = bill.getTableNumber();
        view.serviceType = bill.getServiceType();
        view.status = bill.getStatus();
        view.paymentMethod = bill.getPaymentMethod();
        view.paidAt = bill.getPaidAt();
        view.items = bill.getItems().stream().map(Line::from).collect(Collectors.toList());
        view.subtotal = bill.getSubtotal();
        view.discountPercent = bill.getDiscountPercent();
        view.discountAmount = bill.getDiscountAmount();
        view.taxPercent = bill.getTaxPercent();
        view.taxAmount = bill.getTaxAmount();
        view.total = bill.getTotal();
        return view;
    }

    public static class Line {
        public Long menuItemId;
        public String name;
        public BigDecimal unitPrice;
        public int quantity;
        public BigDecimal lineTotal;

        private static Line from(BillItem item) {
            Line line = new Line();
            line.menuItemId = item.getMenuItemId();
            line.name = item.getName();
            line.unitPrice = item.getUnitPrice();
            line.quantity = item.getQuantity();
            line.lineTotal = item.getLineTotal();
            return line;
        }
    }
}
